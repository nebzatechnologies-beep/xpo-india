const fs = require('fs');
const path = require('path');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFile(relPath, content) {
  const fullPath = path.join(__dirname, '..', relPath);
  ensureDir(fullPath);
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log('Created:', relPath);
}

// 1. /api/taxonomy/tree/route.ts
writeFile('app/api/taxonomy/tree/route.ts', `
import { NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET() {
  try {
    const store = getMockStore();
    const tree = store.leadTypes.map((lt: any) => ({
      ...lt,
      sectors: store.sectors.map((sec: any) => ({
        ...sec,
        categories: store.categories
          .filter((cat: any) => cat.parentSectorCode === sec.code)
          .map((cat: any) => ({
            ...cat,
            subcategories: store.subcategories.filter((sub: any) => sub.parentCategoryCode === cat.code)
          }))
      }))
    }));

    return NextResponse.json({
      success: true,
      data: {
        tree,
        leadTypes: store.leadTypes,
        sectors: store.sectors,
        categories: store.categories,
        subcategories: store.subcategories,
        tags: store.tags,
        stats: {
          totalLeadTypes: store.leadTypes.length,
          totalSectors: store.sectors.length,
          totalCategories: store.categories.length,
          totalSubcategories: store.subcategories.length,
          totalTags: store.tags.length,
          activeClassifications: store.categories.filter((c: any) => c.status === 'active').length + store.subcategories.filter((s: any) => s.status === 'active').length,
          inactiveClassifications: store.categories.filter((c: any) => c.status === 'inactive').length + store.subcategories.filter((s: any) => s.status === 'inactive').length,
          lastUpdated: 'Today, 14:00 IST'
        }
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
`);

// 2. /api/taxonomy/lead-types/route.ts
writeFile('app/api/taxonomy/lead-types/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET() {
  const store = getMockStore();
  return NextResponse.json({ success: true, data: store.leadTypes });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();
    const existingIndex = store.leadTypes.findIndex((lt: any) => lt.code === body.code);
    if (existingIndex >= 0) {
      store.leadTypes[existingIndex] = { ...store.leadTypes[existingIndex], ...body };
    } else {
      store.leadTypes.push({
        code: body.code || 'LT_' + Date.now(),
        name: body.name,
        description: body.description || '',
        mappedSectorsCount: body.mappedSectorsCount || 0,
        activeLeads: 0,
        status: body.status || 'active'
      });
    }
    return NextResponse.json({ success: true, data: store.leadTypes });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
`);

// 3. /api/taxonomy/sectors/route.ts
writeFile('app/api/taxonomy/sectors/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET() {
  const store = getMockStore();
  return NextResponse.json({ success: true, data: store.sectors });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();
    const existingIndex = store.sectors.findIndex((s: any) => s.code === body.code);
    if (existingIndex >= 0) {
      store.sectors[existingIndex] = { ...store.sectors[existingIndex], ...body };
    } else {
      store.sectors.push({
        code: body.code || 'SEC_' + Date.now(),
        name: body.name,
        description: body.description || '',
        categoriesCount: 0,
        activeLeads: 0,
        status: body.status || 'active'
      });
    }
    return NextResponse.json({ success: true, data: store.sectors });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
`);

// 4. /api/taxonomy/categories/route.ts
writeFile('app/api/taxonomy/categories/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  const store = getMockStore();
  const { searchParams } = new URL(req.url);
  const sectorCode = searchParams.get('sectorCode');
  let result = store.categories;
  if (sectorCode) {
    result = result.filter((c: any) => c.parentSectorCode === sectorCode);
  }
  return NextResponse.json({ success: true, data: result });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();
    const existingIndex = store.categories.findIndex((c: any) => c.code === body.code);
    if (existingIndex >= 0) {
      store.categories[existingIndex] = { ...store.categories[existingIndex], ...body };
    } else {
      store.categories.push({
        _id: 'cat_' + Date.now(),
        code: body.code || 'CAT_' + Date.now(),
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        parentSectorCode: body.parentSectorCode || 'MFG',
        icon: body.icon || 'Box',
        description: body.description || '',
        subcategoryCount: 0,
        activeLeads: 0,
        status: body.status || 'active',
        isActive: body.status !== 'inactive'
      });
    }
    return NextResponse.json({ success: true, data: store.categories });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
`);

// 5. /api/taxonomy/subcategories/route.ts
writeFile('app/api/taxonomy/subcategories/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  const store = getMockStore();
  const { searchParams } = new URL(req.url);
  const parentCategoryCode = searchParams.get('parentCategoryCode');
  let result = store.subcategories;
  if (parentCategoryCode) {
    result = result.filter((s: any) => s.parentCategoryCode === parentCategoryCode);
  }
  return NextResponse.json({ success: true, data: result });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();
    const existingIndex = store.subcategories.findIndex((s: any) => s.code === body.code);
    if (existingIndex >= 0) {
      store.subcategories[existingIndex] = { ...store.subcategories[existingIndex], ...body };
    } else {
      store.subcategories.push({
        code: body.code || 'SUB_' + Date.now(),
        name: body.name,
        parentCategoryCode: body.parentCategoryCode || 'CAT_MFG_IND',
        sectorCode: body.sectorCode || 'MFG',
        mappedTags: body.mappedTags || [],
        activeLeads: 0,
        status: body.status || 'active'
      });
    }
    return NextResponse.json({ success: true, data: store.subcategories });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
`);

// 6. /api/taxonomy/tags/route.ts
writeFile('app/api/taxonomy/tags/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET() {
  const store = getMockStore();
  return NextResponse.json({ success: true, data: store.tags });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();

    if (body.action === 'merge') {
      const { sourceTag, targetTag } = body;
      const target = store.tags.find((t: any) => t.name.toLowerCase() === targetTag.toLowerCase());
      const source = store.tags.find((t: any) => t.name.toLowerCase() === sourceTag.toLowerCase());
      if (target && source) {
        target.usageCount += source.usageCount;
        store.tags = store.tags.filter((t: any) => t.name.toLowerCase() !== sourceTag.toLowerCase());
      }
      return NextResponse.json({ success: true, message: 'Tags merged successfully', data: store.tags });
    }

    const existingIndex = store.tags.findIndex((t: any) => t.name.toLowerCase() === body.name.toLowerCase());
    if (existingIndex >= 0) {
      store.tags[existingIndex] = { ...store.tags[existingIndex], ...body };
    } else {
      store.tags.push({
        name: body.name,
        subcategoryCode: body.subcategoryCode || 'SUB_CNC',
        categoryCode: body.categoryCode || 'CAT_MFG_IND',
        usageCount: body.usageCount || 0,
        status: body.status || 'active'
      });
    }
    return NextResponse.json({ success: true, data: store.tags });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
`);

// 7. /api/taxonomy/form-builder/route.ts
writeFile('app/api/taxonomy/form-builder/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  const store = getMockStore();
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('classificationCode') || 'manufacturing-industrial';
  const schema = store.formSchemas[code] || {
    id: 'schema_' + code,
    classificationCode: code,
    classificationName: code.replace(/-/g, ' ').toUpperCase(),
    leadTypeCode: 'buy',
    version: 1,
    fields: [],
    updatedAt: new Date().toISOString()
  };
  return NextResponse.json({ success: true, data: schema, allSchemas: store.formSchemas });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();
    const code = body.classificationCode || 'manufacturing-industrial';
    const currentVersion = store.formSchemas[code]?.version || 0;
    
    store.formSchemas[code] = {
      ...body,
      version: currentVersion + 1,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Form schema published successfully',
      data: store.formSchemas[code]
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
`);

// 8. /api/taxonomy/import/route.ts
writeFile('app/api/taxonomy/import/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET() {
  const store = getMockStore();
  return NextResponse.json({
    success: true,
    data: {
      versions: store.taxonomyVersions
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();
    const { action, rows, conflictMode, description } = body;

    if (action === 'publish') {
      const newVersionCode = 'v' + (4 + store.taxonomyVersions.length * 0.1).toFixed(1) + '.0-RELEASE';
      const versionRecord = {
        version: newVersionCode,
        importedBy: 'Super Admin (admin@xpoindia.com)',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        newRecords: rows?.length || 18,
        updatedRecords: 4,
        status: 'Published',
        description: description || 'Master Excel taxonomy atomic import and publication.'
      };

      store.taxonomyVersions.unshift(versionRecord);

      return NextResponse.json({
        success: true,
        message: 'Taxonomy snapshot ' + newVersionCode + ' published atomically!',
        version: versionRecord
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: 48,
        validRows: 44,
        duplicateRows: 3,
        invalidRows: 1,
        conflictStrategy: conflictMode || 'update_existing'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
`);

// 9. /api/crm/contacts/route.ts
writeFile('app/api/crm/contacts/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  const store = getMockStore();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('q')?.toLowerCase();
  const status = searchParams.get('status');
  const country = searchParams.get('country');

  let list = [...store.crmContacts];

  if (search) {
    list = list.filter((c: any) =>
      c.company.toLowerCase().includes(search) ||
      c.name.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search) ||
      c.whatsapp.includes(search)
    );
  }

  if (status && status !== 'all') {
    list = list.filter((c: any) => c.status === status);
  }

  if (country && country !== 'all') {
    list = list.filter((c: any) => c.country === country);
  }

  return NextResponse.json({
    success: true,
    data: list,
    stats: {
      total: store.crmContacts.length,
      notContacted: store.crmContacts.filter((c: any) => c.status === 'not_contacted').length,
      contacted: store.crmContacts.filter((c: any) => c.status === 'contacted').length,
      registered: store.crmContacts.filter((c: any) => c.status === 'registered').length,
      subscribed: store.crmContacts.filter((c: any) => c.status === 'subscribed').length,
      optedInConsent: store.crmContacts.filter((c: any) => c.consentStatus === 'opted_in').length,
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();

    if (body.action === 'updateStatus') {
      const contact = store.crmContacts.find((c: any) => c.id === body.id);
      if (contact) {
        contact.status = body.status;
        contact.lastContacted = new Date().toISOString();
        return NextResponse.json({ success: true, message: 'Status updated', data: contact });
      }
      return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
    }

    if (body.action === 'optOut') {
      const contact = store.crmContacts.find((c: any) => c.id === body.id);
      if (contact) {
        contact.consentStatus = 'opted_out';
        contact.status = 'opted_out';
        return NextResponse.json({ success: true, message: 'Contact opted out', data: contact });
      }
    }

    const newContact = {
      id: 'crm_' + Date.now(),
      name: body.name,
      company: body.company,
      phone: body.phone,
      whatsapp: body.whatsapp || body.phone,
      email: body.email,
      website: body.website || '',
      country: body.country || 'India',
      city: body.city || '',
      industry: body.industry || 'Manufacturing',
      sectorCode: body.sectorCode || 'MFG',
      source: body.source || 'manual',
      status: 'not_contacted',
      consentStatus: 'opted_in',
      campaignHistoryCount: 0,
      notes: body.notes || '',
      createdAt: new Date().toISOString()
    };
    store.crmContacts.unshift(newContact);

    return NextResponse.json({ success: true, data: newContact });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
`);

// 10. /api/crm/import/route.ts
writeFile('app/api/crm/import/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();
    const rows = body.rows || [];

    let importedCount = 0;
    rows.forEach((r: any) => {
      const exists = store.crmContacts.some((c: any) => c.email === r.email || c.whatsapp === r.whatsapp);
      if (!exists && r.company) {
        store.crmContacts.unshift({
          id: 'crm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          name: r.name || 'Decision Maker',
          company: r.company,
          phone: r.phone || r.whatsapp || '+91 9000000000',
          whatsapp: r.whatsapp || r.phone || '+91 9000000000',
          email: r.email || 'contact@' + r.company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
          website: r.website || '',
          country: r.country || 'India',
          city: r.city || '',
          industry: r.industry || 'Industrial Goods',
          sectorCode: r.sectorCode || 'MFG',
          source: 'xlsx_import',
          status: 'not_contacted',
          consentStatus: 'opted_in',
          campaignHistoryCount: 0,
          createdAt: new Date().toISOString()
        });
        importedCount++;
      }
    });

    return NextResponse.json({
      success: true,
      message: \`Successfully imported \${importedCount} new company prospects!\`,
      importedCount,
      totalContacts: store.crmContacts.length
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
`);

// 11. /api/whatsapp/connect/route.ts
writeFile('app/api/whatsapp/connect/route.ts', `
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      provider: 'Meta Cloud API (WABA)',
      status: 'Connected',
      phoneNumber: '+91 98200 99881',
      displayPhoneNumber: '+91 98200 99881',
      wabaId: 'WABA_8819200192931',
      phoneNumberId: 'PNID_5528190021',
      qualityRating: 'High (Green)',
      messagingTier: 'Tier 2 (10,000 unique recipients / 24h)',
      webhookStatus: 'Active & Verified (200 OK)',
      lastSynced: '28 Sep 2026, 17:00 IST'
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === 'test') {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp Handshake Test Successful! Verified 200 OK from Meta Cloud API Graph v20.0.',
        latencyMs: 142,
        verifiedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'WABA credentials and webhook verified successfully.'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
`);

// 12. /api/whatsapp/campaigns/route.ts
writeFile('app/api/whatsapp/campaigns/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET() {
  const store = getMockStore();
  return NextResponse.json({
    success: true,
    data: store.whatsappCampaigns
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();

    const newCampaign = {
      id: 'camp_' + (store.whatsappCampaigns.length + 101),
      name: body.name || 'Untitled Campaign',
      type: body.type || 'Company Invitation',
      audienceName: body.audienceName || 'All Valid CRM Opt-Ins',
      eligibleRecipients: body.eligibleRecipients || 120,
      scheduledDate: body.scheduledDate || 'Immediate Dispatch',
      sent: body.scheduledDate ? 0 : (body.eligibleRecipients || 120),
      delivered: body.scheduledDate ? 0 : Math.round((body.eligibleRecipients || 120) * 0.98),
      replies: 0,
      spend: body.spend || Math.round((body.eligibleRecipients || 120) * 0.88),
      status: body.scheduledDate ? 'scheduled' : 'running',
      templateId: body.templateId || 'tpl_001',
      templateName: body.templateName || 'xpo_direct_platform_invitation',
      createdAt: new Date().toISOString()
    };

    store.whatsappCampaigns.unshift(newCampaign);

    return NextResponse.json({
      success: true,
      message: 'Bulk WhatsApp Campaign scheduled successfully!',
      data: newCampaign
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
`);

// 13. /api/whatsapp/templates/route.ts
writeFile('app/api/whatsapp/templates/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET() {
  const store = getMockStore();
  return NextResponse.json({
    success: true,
    data: store.whatsappTemplates
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();

    if (body.action === 'sync') {
      return NextResponse.json({
        success: true,
        message: 'Synchronised 3 Meta WABA Message Templates successfully.',
        data: store.whatsappTemplates
      });
    }

    const newTemplate = {
      id: 'tpl_' + (store.whatsappTemplates.length + 1).toString().padStart(3, '0'),
      name: body.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      category: body.category || 'MARKETING',
      language: body.language || 'en_US',
      headerType: body.headerType || 'TEXT',
      headerText: body.headerText || '',
      bodyText: body.bodyText,
      footerText: body.footerText || 'XPO India Platform • Reply STOP to unsubscribe',
      buttons: body.buttons || [{ type: 'URL', text: 'View on XPO', url: 'https://xpoindia.com' }],
      variables: body.variables || [],
      status: 'APPROVED',
      updatedAt: new Date().toISOString()
    };

    store.whatsappTemplates.unshift(newTemplate);

    return NextResponse.json({
      success: true,
      message: 'Message Template submitted and approved by Meta WABA API!',
      data: newTemplate
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
`);

// 14. /api/whatsapp/inbox/route.ts
writeFile('app/api/whatsapp/inbox/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET() {
  const store = getMockStore();
  return NextResponse.json({
    success: true,
    data: store.whatsappConversations
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();
    const { conversationId, text } = body;

    const conv = store.whatsappConversations.find((c: any) => c.id === conversationId);
    if (!conv) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    const newMsg = {
      id: 'msg_' + Date.now(),
      conversationId,
      sender: 'outbound',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    conv.messages.push(newMsg);
    conv.lastMessage = text;
    conv.lastMessageTime = 'Just now';

    return NextResponse.json({
      success: true,
      message: 'Message sent via WhatsApp Cloud API',
      data: newMsg
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
`);

// 15. /api/whatsapp/automations/route.ts
writeFile('app/api/whatsapp/automations/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET() {
  const store = getMockStore();
  return NextResponse.json({
    success: true,
    data: store.whatsappAutomations
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();

    if (body.action === 'toggle') {
      const auto = store.whatsappAutomations.find((a: any) => a.id === body.id);
      if (auto) {
        auto.status = auto.status === 'active' ? 'inactive' : 'active';
        return NextResponse.json({ success: true, data: auto });
      }
    }

    if (body.action === 'test') {
      return NextResponse.json({
        success: true,
        message: 'Automation rule triggered successfully in sandbox! Payload dispatches 1 preview WhatsApp message.'
      });
    }

    const newAuto = {
      id: 'auto_' + (store.whatsappAutomations.length + 1).toString().padStart(3, '0'),
      name: body.name,
      trigger: body.trigger,
      conditions: body.conditions || 'None',
      templateName: body.templateName || 'xpo_lead_match_alert',
      status: 'active',
      lastExecuted: 'Never'
    };

    store.whatsappAutomations.unshift(newAuto);

    return NextResponse.json({
      success: true,
      message: 'WhatsApp automation rule created and activated!',
      data: newAuto
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
`);

console.log('All V4 API Routes Created successfully!');
