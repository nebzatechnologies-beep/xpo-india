import { NextRequest, NextResponse } from 'next/server';
import { authenticateN8nInboundRequest } from '@/lib/integrations/n8n/auth-guard';
import { xpoStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  const auth = authenticateN8nInboundRequest(req);
  if (!auth.authenticated) return auth.errorResponse!;

  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');
    const categoryCode = searchParams.get('categoryCode');
    const sectorCode = searchParams.get('sectorCode');
    const country = searchParams.get('country');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let targetCategory = categoryCode;
    let targetSector = sectorCode;
    let targetCountry = country;

    if (leadId) {
      const lead = xpoStore.leads.find((l: any) => l._id === leadId || l.xpoId === leadId);
      if (lead) {
        targetCategory = targetCategory || lead.category?.code || lead.category;
        targetSector = targetSector || lead.category?.parentSectorCode;
        targetCountry = targetCountry || lead.country;
      }
    }

    // Filter partners from users & CRM contacts
    const users = xpoStore.users || [];
    const crmContacts = xpoStore.crmContacts || [];

    const matchedAudience: any[] = [];

    // Map users with role 'lead_absorber' or partner profiles
    users.forEach((u: any) => {
      const isPartner =
        u.role === 'lead_absorber' ||
        u.roles?.includes('lead_absorber') ||
        u.userType === 'partner';

      if (isPartner) {
        const matchesCategory =
          !targetCategory ||
          u.categories?.includes(targetCategory) ||
          u.sector === targetSector ||
          true; // Broad match for partners

        const matchesCountry =
          !targetCountry ||
          u.country === targetCountry ||
          u.planType === 'global' ||
          !u.country;

        if (matchesCategory && matchesCountry) {
          matchedAudience.push({
            userId: u._id || u.id,
            name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Partner',
            companyName: u.company || u.companyName,
            email: u.email,
            phone: u.phone || u.mobile || u.whatsappNumber,
            country: u.country || 'India',
            city: u.city,
            subscriptionPlan: u.subscriptionPlan || u.planType || 'Domestic Pro',
            matchingSectors: u.sectors || (targetSector ? [targetSector] : []),
            matchingCategories: u.categories || (targetCategory ? [targetCategory] : []),
            communicationOptIn: u.communicationOptIn !== false,
            source: 'platform_user',
          });
        }
      }
    });

    // Append relevant CRM contact partners
    crmContacts.forEach((c: any) => {
      if (c.type === 'partner' || c.role === 'partner') {
        matchedAudience.push({
          userId: c._id || c.id,
          name: c.name,
          companyName: c.company,
          email: c.email,
          phone: c.phone,
          country: c.country || 'India',
          city: c.city,
          subscriptionPlan: 'CRM Partner',
          matchingSectors: c.sectors || [],
          matchingCategories: c.categories || [],
          communicationOptIn: true,
          source: 'crm_contact',
        });
      }
    });

    // De-duplicate by email or phone
    const uniqueAudience = Array.from(
      new Map(matchedAudience.map((item) => [item.phone || item.email, item])).values()
    );

    return NextResponse.json({
      success: true,
      query: {
        leadId,
        categoryCode: targetCategory,
        sectorCode: targetSector,
        country: targetCountry,
      },
      count: uniqueAudience.slice(0, limit).length,
      totalMatching: uniqueAudience.length,
      audience: uniqueAudience.slice(0, limit),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
