import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import { Lead, User, Category, WhatsAppMessage } from '@/lib/db/models';
import { generateLeadId } from '@/lib/utils/id-generator';
import { ok, err } from '@/lib/utils/api-response';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      senderPhone,
      senderName,
      requirementTitle,
      description,
      categorySlug,
      budgetMin,
      budgetMax,
      budgetCurrency = 'INR',
      country = 'India',
      city,
      attachments = [],
    } = body;

    if (!senderPhone || !requirementTitle || !description) {
      return err('Phone number, title, and description are required', 400);
    }

    // Find or create User by WhatsApp phone number
    let user = await User.findOne({ phone: senderPhone });
    if (!user) {
      user = await User.create({
        name: senderName || `WhatsApp User ${senderPhone.slice(-4)}`,
        email: `wa_${senderPhone.replace(/\D/g, '')}@xpoindia.com`,
        phone: senderPhone,
        role: 'creator',
        accountType: 'individual',
        country,
        city,
        status: 'active',
      });
    }

    // Resolve category
    let category = await Category.findOne({ slug: categorySlug });
    if (!category) {
      category = await Category.findOne({ level: 1 }) || await Category.findOne();
    }

    let xpoId = generateLeadId();
    while (await Lead.exists({ xpoId })) {
      xpoId = generateLeadId();
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const lead = await Lead.create({
      xpoId,
      title: requirementTitle.trim(),
      description: description.trim(),
      type: 'service',
      status: 'live',
      creator: user._id,
      category: category?._id,
      country,
      city,
      budgetMin: budgetMin ? Number(budgetMin) : undefined,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
      budgetCurrency,
      attachments,
      source: 'whatsapp',
      expiresAt,
    });

    // Log WhatsApp message
    await WhatsAppMessage.create({
      messageId: `wamid_${Date.now()}`,
      direction: 'inbound',
      from: senderPhone,
      to: process.env.WHATSAPP_PHONE_NUMBER || '+919876543210',
      type: 'text',
      content: `[Post Lead Request] Title: ${requirementTitle}`,
      status: 'delivered',
      relatedLead: lead._id,
    });

    return ok({
      success: true,
      message: 'Lead created successfully via WhatsApp workflow',
      leadId: lead.xpoId,
      lead,
    }, 201);
  } catch (error) {
    console.error('[POST /api/whatsapp/lead]', error);
    return err('Failed to post lead via WhatsApp', 500);
  }
}
