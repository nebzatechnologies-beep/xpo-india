import { requireFirestore } from '@/lib/firebase/admin';
import { getUserByUid } from '@/lib/services/users';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '@/lib/utils/api-handler';
import { generateDocId } from '@/lib/utils/id-generator';
import { dispatchOutboundWhatsApp } from '@/lib/whatsapp/notification-service';
import type {
  LeadClaim,
  MutualConnection,
  ServiceRequirement,
  TrustEvent,
} from '@/lib/types/domain';

/**
 * Initiates a Mutual Consent Connection Request between a Client and an unlocked Partner.
 * Direct phone numbers and emails remain masked until the Partner explicitly accepts!
 */
export async function requestMutualConnection(params: {
  marketplaceType?: 'service';
  claimOrApplicationId: string;
  initiatorUid: string;
}): Promise<MutualConnection> {
  const db = requireFirestore();
  const nowIso = new Date().toISOString();
  const connId = `con_${params.claimOrApplicationId}`;
  const connRef = db.collection('connections').doc(connId);
  const claimRef = db.collection('lead_claims').doc(params.claimOrApplicationId);

  let conn!: MutualConnection;
  let initiatorCompany = 'Verified XPO Client';
  let isNewlyCreated = false;

  await db.runTransaction(async (tx) => {
    const connSnap = await tx.get(connRef);
    if (connSnap.exists) {
      conn = connSnap.data() as MutualConnection;
      return;
    }

    const claimSnap = await tx.get(claimRef);
    if (!claimSnap.exists) throw new NotFoundError('Lead claim not found');
    const claim = claimSnap.data() as LeadClaim;

    if (claim.clientUid !== params.initiatorUid) {
      throw new ForbiddenError('Only the Requirement Client can initiate this connection.');
    }

    if (!claim.unlockedByClient) {
      throw new ForbiddenError(
        'Please unlock this Partner profile first before requesting a direct connection.'
      );
    }

    const reqSnap = await tx.get(db.collection('requirements').doc(claim.reqId));
    const req = reqSnap.exists ? (reqSnap.data() as ServiceRequirement) : null;
    initiatorCompany = req?.clientBusinessName || 'Verified XPO Client';

    conn = {
      id: connId,
      marketplaceType: 'service',
      sourceId: claim.reqId,
      sourceCode: claim.xpoCode,
      sourceTitle: req?.title || claim.xpoCode,
      claimOrApplicationId: claim.id,
      initiatorUid: params.initiatorUid,
      initiatorRole: 'client',
      recipientUid: claim.partnerUid,
      recipientRole: 'partner',
      status: 'pending',
      releasedInitiatorContact: null,
      releasedRecipientContact: null,
      isSimulated: claim.isSimulated,
      requestedAt: nowIso,
    };

    tx.set(connRef, conn);
    tx.set(
      claimRef,
      { status: 'connection_requested', connectionId: connId, updatedAt: nowIso },
      { merge: true }
    );
    isNewlyCreated = true;
  });

  if (isNewlyCreated) {
    await notifyRecipientOfConnectionRequest(conn, initiatorCompany);
  }
  return conn;
}

async function notifyRecipientOfConnectionRequest(
  conn: MutualConnection,
  initiatorCompany: string
): Promise<void> {
  try {
    const db = requireFirestore();
    const recipient = await getUserByUid(conn.recipientUid);
    if (!recipient?.phoneE164) return;
    const sessionId = conn.isSimulated ? `sim_${recipient.phoneE164}` : recipient.phoneE164;

    await dispatchOutboundWhatsApp({
      sessionId,
      phoneE164: recipient.phoneE164,
      isSimulated: conn.isSimulated,
      messageType: 'interactive_buttons',
      headerText: 'Mutual Connection Request',
      body:
        `*${initiatorCompany}* has reviewed your Partner profile and requested a direct connection regarding *${conn.sourceTitle}* (${conn.sourceCode}).\n\n` +
        `🔒 *XPO Privacy Protection:* Direct phone numbers and email addresses are released to both sides *only* after you accept.`,
      interactiveOptions: [
        { id: `conn_accept:${conn.id}`, title: 'Accept Connection' },
        { id: `conn_decline:${conn.id}`, title: 'Decline' },
      ],
      outsideWindowTemplate: {
        name: 'xpo_mutual_connection_consent_v1',
        language: 'en',
        category: 'UTILITY',
        variables: [recipient.displayName, initiatorCompany, conn.sourceCode],
      },
    });

    await db
      .collection('whatsapp_sessions')
      .doc(sessionId)
      .set(
        {
          state: 'CONNECTION_PENDING',
          activeConnectionId: conn.id,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
  } catch (err) {
    console.error('[Connections] Failed to notify recipient of connection request:', err);
  }
}

export async function respondToMutualConnection(params: {
  connectionId: string;
  recipientUid: string;
  decision: 'accepted' | 'declined';
}): Promise<MutualConnection> {
  const db = requireFirestore();
  const connRef = db.collection('connections').doc(params.connectionId);
  const connSnap = await connRef.get();
  if (!connSnap.exists) throw new NotFoundError('Connection request not found');

  const conn = connSnap.data() as MutualConnection;
  if (conn.recipientUid !== params.recipientUid) {
    throw new ForbiddenError('Only the invited Partner can respond to this connection request.');
  }
  if (conn.status !== 'pending') {
    throw new ConflictError(`This connection request has already been ${conn.status}.`);
  }

  const nowIso = new Date().toISOString();

  if (params.decision === 'declined') {
    await Promise.all([
      connRef.set({ status: 'declined', respondedAt: nowIso }, { merge: true }),
      db
        .collection('lead_claims')
        .doc(conn.claimOrApplicationId)
        .set({ status: 'client_declined', updatedAt: nowIso }, { merge: true }),
    ]);
    return (await connRef.get()).data() as MutualConnection;
  }

  // Accepted! Unmask and release contact details to both consented parties
  const [initiatorUser, recipientUser] = await Promise.all([
    getUserByUid(conn.initiatorUid),
    getUserByUid(conn.recipientUid),
  ]);
  if (!initiatorUser || !recipientUser) {
    throw new NotFoundError('Participant user profile missing');
  }

  const [initProfSnap, recProfSnap] = await Promise.all([
    db.collection('role_profiles').doc(`${conn.initiatorUid}_client`).get(),
    db.collection('role_profiles').doc(`${conn.recipientUid}_partner`).get(),
  ]);
  const initProf = initProfSnap.data() as Record<string, unknown> | undefined;
  const recProf = recProfSnap.data() as Record<string, unknown> | undefined;

  const releasedInitiatorContact: MutualConnection['releasedInitiatorContact'] = {
    name: initiatorUser.displayName,
    companyName: String(initProf?.businessName || initiatorUser.displayName),
    phoneE164: initiatorUser.phoneE164,
    email: initiatorUser.email || null,
    city: initiatorUser.primaryCity,
  };

  const releasedRecipientContact: MutualConnection['releasedRecipientContact'] = {
    name: recipientUser.displayName,
    companyName: String(recProf?.businessName || recipientUser.displayName),
    phoneE164: recipientUser.phoneE164,
    email: recipientUser.email || null,
    city: recipientUser.primaryCity,
    portfolioOrResume: String(recProf?.portfolioUrl || '') || null,
  };

  const batch = db.batch();
  batch.set(
    connRef,
    {
      status: 'accepted',
      releasedInitiatorContact,
      releasedRecipientContact,
      respondedAt: nowIso,
    },
    { merge: true }
  );

  batch.set(
    db.collection('lead_claims').doc(conn.claimOrApplicationId),
    { status: 'connected', updatedAt: nowIso },
    { merge: true }
  );

  for (const uid of [conn.initiatorUid, conn.recipientUid]) {
    const tevId = generateDocId('tev');
    const tev: TrustEvent = {
      id: tevId,
      uid,
      type: 'mutual_connection',
      summary: `Completed mutual consent connection for ${conn.sourceCode}`,
      referenceId: conn.id,
      createdAt: nowIso,
    };
    batch.set(db.collection('trust_events').doc(tevId), tev);
  }

  await batch.commit();

  // Deliver unmasked contact cards to both parties via WhatsApp
  try {
    if (initiatorUser.phoneE164) {
      const sId = conn.isSimulated ? `sim_${initiatorUser.phoneE164}` : initiatorUser.phoneE164;
      await dispatchOutboundWhatsApp({
        sessionId: sId,
        phoneE164: initiatorUser.phoneE164,
        isSimulated: conn.isSimulated,
        messageType: 'text',
        body:
          `✅ *Mutual Connection Confirmed* (${conn.sourceCode})\n\n` +
          `*${releasedRecipientContact.name}* (${releasedRecipientContact.companyName}) accepted your connection request. You may now discuss pricing, timelines, and delivery directly:\n\n` +
          `📞 Direct Phone/WhatsApp: ${releasedRecipientContact.phoneE164}\n` +
          `${releasedRecipientContact.email ? `✉️ Email: ${releasedRecipientContact.email}\n` : ''}` +
          `📍 City: ${releasedRecipientContact.city}`,
      });
    }
    if (recipientUser.phoneE164) {
      const sId = conn.isSimulated ? `sim_${recipientUser.phoneE164}` : recipientUser.phoneE164;
      await dispatchOutboundWhatsApp({
        sessionId: sId,
        phoneE164: recipientUser.phoneE164,
        isSimulated: conn.isSimulated,
        messageType: 'text',
        body:
          `✅ *Mutual Connection Confirmed* (${conn.sourceCode})\n\n` +
          `Here are the direct contact details for *${releasedInitiatorContact.companyName}* (${releasedInitiatorContact.name}). You may now communicate and negotiate directly:\n\n` +
          `📞 Direct Phone/WhatsApp: ${releasedInitiatorContact.phoneE164}\n` +
          `${releasedInitiatorContact.email ? `✉️ Email: ${releasedInitiatorContact.email}\n` : ''}` +
          `📍 City: ${releasedInitiatorContact.city}`,
      });
      await db
        .collection('whatsapp_sessions')
        .doc(sId)
        .set({ state: 'CONNECTED', activeConnectionId: null, updatedAt: nowIso }, { merge: true });
    }
  } catch (err) {
    console.error('[Connections] Contact card delivery error:', err);
  }

  return (await connRef.get()).data() as MutualConnection;
}

export async function listUserConnections(uid: string): Promise<MutualConnection[]> {
  const db = requireFirestore();
  const [initSnap, recSnap] = await Promise.all([
    db.collection('connections').where('initiatorUid', '==', uid).get(),
    db.collection('connections').where('recipientUid', '==', uid).get(),
  ]);

  const map = new Map<string, MutualConnection>();
  for (const d of [...initSnap.docs, ...recSnap.docs]) {
    const c = d.data() as MutualConnection;
    if (c.status !== 'accepted') {
      c.releasedInitiatorContact = null;
      c.releasedRecipientContact = null;
    }
    map.set(c.id, c);
  }

  return Array.from(map.values()).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}
