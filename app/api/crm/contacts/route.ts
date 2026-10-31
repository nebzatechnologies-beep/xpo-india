import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireSuperadmin } from '@/lib/auth/server-session';
import {
  listCrmContacts,
  updateCrmContactById,
  upsertCrmContactNonDestructive,
} from '@/lib/services/crm';
import { BadRequestError, handleApiError, jsonOk } from '@/lib/utils/api-handler';
import type {
  ConsentStatus,
  CrmContact,
  CrmContactState,
  CrmDatabaseType,
  CrmInvitationStatus,
  CustomerRole,
} from '@/lib/types/domain';

const createCrmSchema = z.object({
  databaseType: z.enum(['client', 'partner']).optional(),
  phoneRaw: z.string().min(5),
  whatsappRaw: z.string().optional(),
  confirmedCountry: z.string().optional(),
  contactName: z.string().min(1),
  companyName: z.string().optional(),
  businessInfo: z.string().optional(),
  servicesOffered: z.array(z.string()).optional(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  website: z.string().optional().nullable(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  sectorId: z.string().optional().nullable(),
  sectorName: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  categoryName: z.string().optional(),
  subcategoryId: z.string().optional().nullable(),
  subcategoryName: z.string().optional(),
  skills: z.array(z.string()).optional(),
  roles: z.array(z.enum(['client', 'partner'])).optional(),
  consentStatus: z.enum(['none', 'consent_pending', 'opted_in', 'opted_out']).optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

const patchCrmSchema = z.object({
  id: z.string().optional(),
  phoneE164: z.string().optional(),
  patch: z
    .object({
      contactName: z.string().min(1).optional(),
      companyName: z.string().optional(),
      businessInfo: z.string().optional(),
      servicesOffered: z.array(z.string()).optional(),
      email: z.string().email().optional().or(z.literal('')).nullable(),
      website: z.string().optional().nullable(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      sectorId: z.string().optional().nullable(),
      sectorName: z.string().optional(),
      categoryId: z.string().optional().nullable(),
      categoryName: z.string().optional(),
      subcategoryId: z.string().optional().nullable(),
      subcategoryName: z.string().optional(),
      skills: z.array(z.string()).optional(),
      notes: z.string().optional(),
      crmState: z
        .enum([
          'imported_prospect',
          'opted_out_contact',
          'suspended_contact',
          'registered_customer',
        ])
        .optional(),
    })
    .passthrough()
    .optional(),
}).passthrough();

export async function GET(request: NextRequest) {
  try {
    await requireSuperadmin();
    const sp = request.nextUrl.searchParams;
    const contacts = await listCrmContacts({
      databaseType: (sp.get('databaseType') as CrmDatabaseType) || undefined,
      invitationStatus: (sp.get('invitationStatus') as CrmInvitationStatus) || undefined,
      search: sp.get('search') || undefined,
      crmState: (sp.get('crmState') as CrmContactState) || undefined,
      consentStatus: (sp.get('consentStatus') as ConsentStatus) || undefined,
      role: (sp.get('role') as CustomerRole) || undefined,
      sectorId: sp.get('sectorId') || undefined,
      categoryId: sp.get('categoryId') || undefined,
      city: sp.get('city') || undefined,
      limit: sp.get('limit') ? Number(sp.get('limit')) : 300,
    });
    return jsonOk({ contacts });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperadmin();
    const body = createCrmSchema.parse(await request.json());
    const result = await upsertCrmContactNonDestructive({
      ...body,
      email: body.email || null,
    });
    return jsonOk(result, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const body = patchCrmSchema.parse(await request.json());
    const phoneE164 = String(body.phoneE164 || body.id || '');
    if (!phoneE164) {
      throw new BadRequestError('Target contact phoneE164 or id is required.');
    }
    const patchData = (body.patch || body) as Partial<CrmContact>;
    const contact = await updateCrmContactById(phoneE164, patchData, {
      uid: session.uid,
      name: session.user.displayName,
    });
    return jsonOk({ contact });
  } catch (err) {
    return handleApiError(err);
  }
}
