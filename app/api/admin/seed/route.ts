import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import { User, Category, Plan, Lead, Response, Subscription, Payment, Connection } from '@/lib/db/models';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // 1. Clear existing seed data if needed or perform upsert
    console.log('[SEED] Starting XPO India database seed...');

    const superadminPass = await bcrypt.hash('XPOAdmin@2024', 10);
    const creatorPass = await bcrypt.hash('Creator@2024', 10);
    const absorberPass = await bcrypt.hash('Absorber@2024', 10);

    // Upsert Demo Superadmin
    const adminUser = await User.findOneAndUpdate(
      { email: 'admin@xpoindia.com' },
      {
        name: 'Super Admin',
        email: 'admin@xpoindia.com',
        password: superadminPass,
        role: 'superadmin',
        phone: '+91 9876543210',
        accountType: 'business',
        country: 'IN',
        isVerified: true,
        emailVerified: true,
        status: 'active',
      },
      { upsert: true, new: true }
    );

    // Upsert Demo Lead Creator
    const creatorUser = await User.findOneAndUpdate(
      { email: 'creator@xpoindia.com' },
      {
        name: 'Rajesh Sharma (Industrial Supplies)',
        email: 'creator@xpoindia.com',
        password: creatorPass,
        role: 'lead_creator',
        company: 'Sharma Heavy Engineering Ltd',
        phone: '+91 9820011223',
        accountType: 'business',
        country: 'IN',
        isVerified: true,
        emailVerified: true,
        status: 'active',
      },
      { upsert: true, new: true }
    );

    // Upsert Demo Lead Absorber
    const absorberUser = await User.findOneAndUpdate(
      { email: 'absorber@xpoindia.com' },
      {
        name: 'Anil Patel (Patel Precision Tech)',
        email: 'absorber@xpoindia.com',
        password: absorberPass,
        role: 'lead_absorber',
        company: 'Patel Precision Manufacturing & Tech',
        phone: '+91 9910044556',
        accountType: 'business',
        country: 'IN',
        isVerified: true,
        emailVerified: true,
        status: 'active',
      },
      { upsert: true, new: true }
    );

    // 2. Seed Categories
    const categoriesData = [
      { name: 'Manufacturing & Industrial', slug: 'manufacturing-industrial', icon: 'Factory', description: 'CNC, machining, fabrication, casting, raw metals, packaging, OEM' },
      { name: 'IT, Software & Digital', slug: 'it-software-digital', icon: 'Code', description: 'Web/App development, AI/ML, cloud DevOps, cybersecurity, UI/UX' },
      { name: 'Professional & Legal Services', slug: 'professional-services', icon: 'Briefcase', description: 'Corporate compliance, taxation, patent/trademark filing, auditing' },
      { name: 'Logistics & Supply Chain', slug: 'logistics-supply-chain', icon: 'Truck', description: 'Freight forwarding, cold chain storage, customs brokerage, warehousing' },
      { name: 'Wholesale & Bulk Trade', slug: 'wholesale-trade', icon: 'ShoppingBag', description: 'Bulk textiles, agricultural commodities, FMCG distribution, export-import' },
      { name: 'Healthcare & Pharma', slug: 'healthcare-pharma', icon: 'Activity', description: 'Active pharmaceutical ingredients (API), medical equipment, clinical supplies' }
    ];

    const categoryMap: Record<string, any> = {};
    for (const cat of categoriesData) {
      const c = await Category.findOneAndUpdate(
        { slug: cat.slug },
        { ...cat, isActive: true },
        { upsert: true, new: true }
      );
      categoryMap[cat.slug] = c;
    }

    // 3. Seed Subscription Plans (Domestic Razorpay ₹999 + International PayPal $49)
    const plansData = [
      {
        name: 'Lead Creator Annual (India)',
        slug: 'creator-annual-inr',
        role: 'creator',
        price: 999,
        currency: 'INR',
        billingCycle: 'annual',
        leadsPerMonth: 50,
        responsesPerMonth: 100,
        connectionsLimit: 200,
        features: [
          'Post up to 50 active leads/month',
          'Instant WhatsApp & Email lead broadcast',
          'Unrestricted access to absorber proposals',
          'Direct contact reveal (Phone, WhatsApp, Email)',
          'Razorpay AutoPay annual renewal supported',
          'Zero commercial transaction commissions'
        ],
        razorpayPlanId: 'plan_xpo_creator_annual',
        isActive: true,
      },
      {
        name: 'Lead Creator Annual (Global)',
        slug: 'creator-annual-usd',
        role: 'creator',
        price: 49,
        currency: 'USD',
        billingCycle: 'annual',
        leadsPerMonth: 100,
        responsesPerMonth: 200,
        connectionsLimit: 500,
        features: [
          'Global international reach across 190+ countries',
          'Post up to 100 leads/month',
          'PayPal AutoPay recurring billing support',
          'Priority listing in global discovery feeds',
          'Dedicated account manager support'
        ],
        paypalPlanId: 'P-XPO-CREATOR-GLOBAL-49',
        isActive: true,
      },
      {
        name: 'Lead Absorber Annual (India)',
        slug: 'absorber-annual-inr',
        role: 'absorber',
        price: 999,
        currency: 'INR',
        billingCycle: 'annual',
        leadsPerMonth: 0,
        responsesPerMonth: 100,
        connectionsLimit: 150,
        features: [
          'Real-time access to high-intent buyer leads',
          'Submit up to 100 proposals/month',
          'Direct contact reveal upon creator handshake',
          'WhatsApp instant lead notifications',
          'Razorpay AutoPay annual renewal supported',
          'Zero middleman commission on closed deals'
        ],
        razorpayPlanId: 'plan_xpo_absorber_annual',
        isActive: true,
      },
      {
        name: 'Lead Absorber Annual (Global)',
        slug: 'absorber-annual-usd',
        role: 'absorber',
        price: 49,
        currency: 'USD',
        billingCycle: 'annual',
        leadsPerMonth: 0,
        responsesPerMonth: 200,
        connectionsLimit: 300,
        features: [
          'Access international buyer demands & contracts',
          'Submit 200 proposals/month worldwide',
          'PayPal AutoPay recurring billing support',
          'Verified Global Provider trust badge',
          'Export inquiries & bilateral trade alerts'
        ],
        paypalPlanId: 'P-XPO-ABSORBER-GLOBAL-49',
        isActive: true,
      }
    ];

    const planMap: Record<string, any> = {};
    for (const p of plansData) {
      const savedPlan = await Plan.findOneAndUpdate(
        { slug: p.slug },
        p,
        { upsert: true, new: true }
      );
      planMap[p.slug] = savedPlan;
    }

    // 4. Seed Subscriptions for Demo Users
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    await Subscription.findOneAndUpdate(
      { user: creatorUser._id },
      {
        user: creatorUser._id,
        plan: planMap['creator-annual-inr']._id,
        status: 'active',
        gateway: 'razorpay',
        currentPeriodStart: new Date(),
        currentPeriodEnd: oneYearFromNow,
        autoRenew: true,
      },
      { upsert: true }
    );

    await Subscription.findOneAndUpdate(
      { user: absorberUser._id },
      {
        user: absorberUser._id,
        plan: planMap['absorber-annual-inr']._id,
        status: 'active',
        gateway: 'razorpay',
        currentPeriodStart: new Date(),
        currentPeriodEnd: oneYearFromNow,
        autoRenew: true,
      },
      { upsert: true }
    );

    // 5. Seed Leads
    const sampleLeads = [
      {
        xpoId: 'XPO-10021',
        title: 'Requirement for 5,000 Precision CNC Machined Aluminum Flanges',
        description: 'We urgently require certified manufacturing vendors capable of delivering 5,000 units of aircraft-grade 6061-T6 aluminum flanges with anodized finish. Must meet ISO 9001 standards. Detailed technical CAD schematics available upon connection.',
        type: 'buy',
        status: 'live',
        creator: creatorUser._id,
        category: categoryMap['manufacturing-industrial']?._id,
        sector: categoryMap['manufacturing-industrial']?._id,
        subCategory: 'CNC Machining & Milling',
        country: 'IN',
        city: 'Pune, Maharashtra',
        budgetMin: 350000,
        budgetMax: 500000,
        budgetCurrency: 'INR',
        tags: ['CNC', 'Aluminum', 'Flanges', 'Machining', 'ISO9001'],
      },
      {
        xpoId: 'XPO-10022',
        title: 'Full-Stack Next.js SaaS Platform Architecture & Cloud Migration',
        description: 'Looking for a specialized tech consultancy or agency to architect a microservices-based logistics tracking SaaS, deploy multi-region AWS infrastructure, and optimize MongoDB pipelines.',
        type: 'service',
        status: 'live',
        creator: creatorUser._id,
        category: categoryMap['it-software-digital']?._id,
        sector: categoryMap['it-software-digital']?._id,
        subCategory: 'Cloud Architecture & Web',
        country: 'IN',
        city: 'Bengaluru, Karnataka',
        budgetMin: 600000,
        budgetMax: 950000,
        budgetCurrency: 'INR',
        tags: ['Next.js', 'AWS', 'Microservices', 'Logistics'],
      },
      {
        xpoId: 'XPO-10023',
        title: 'Cold Storage Refrigerated Logistics for 200 Tons Pharma Consignment',
        description: 'Immediate contract for dedicated temperature-controlled logistics (-20°C to 4°C) across Western India pharma distribution hubs. GPS temperature monitoring sensors mandatory.',
        type: 'service',
        status: 'live',
        creator: creatorUser._id,
        category: categoryMap['logistics-supply-chain']?._id,
        sector: categoryMap['logistics-supply-chain']?._id,
        subCategory: 'Refrigerated Transport',
        country: 'IN',
        city: 'Ahmedabad, Gujarat',
        budgetMin: 400000,
        budgetMax: 700000,
        budgetCurrency: 'INR',
        tags: ['Cold Storage', 'Pharma Logistics', 'Temperature Controlled'],
      },
      {
        xpoId: 'XPO-10024',
        title: 'Corporate Legal Compliance & International Trademark Filing',
        description: 'Seeking corporate law firm for bilateral trademark registration across UAE, EU, and India for our consumer brand, along with supply-chain vendor cross-border contracts.',
        type: 'service',
        status: 'live',
        creator: creatorUser._id,
        category: categoryMap['professional-services']?._id,
        sector: categoryMap['professional-services']?._id,
        subCategory: 'Intellectual Property',
        country: 'IN',
        city: 'Mumbai, Maharashtra',
        budgetMin: 150000,
        budgetMax: 250000,
        budgetCurrency: 'INR',
        tags: ['IP', 'Trademark', 'International Law', 'Compliance'],
      },
      {
        xpoId: 'XPO-10025',
        title: 'Bulk Export of 10,000 Meters Certified Organic Cotton Greige Fabric',
        description: 'Overseas buyer looking for GOTS-certified textile mills for ongoing quarterly supply of 10,000m 60s count organic cotton plain weave fabric for garment manufacturing.',
        type: 'buy',
        status: 'live',
        creator: creatorUser._id,
        category: categoryMap['wholesale-trade']?._id,
        sector: categoryMap['wholesale-trade']?._id,
        subCategory: 'Textiles & Fabrics',
        country: 'IN',
        city: 'Coimbatore, Tamil Nadu',
        budgetMin: 800000,
        budgetMax: 1200000,
        budgetCurrency: 'INR',
        tags: ['Cotton', 'GOTS', 'Textile Export', 'Greige Fabric'],
      }
    ];

    let createdLead1: any = null;
    for (let i = 0; i < sampleLeads.length; i++) {
      const ld = sampleLeads[i];
      const savedLead = await Lead.findOneAndUpdate(
        { xpoId: ld.xpoId },
        ld,
        { upsert: true, new: true }
      );
      if (i === 0) createdLead1 = savedLead;
    }

    // 6. Seed Sample Proposal / Response
    let createdResponse: any = null;
    if (createdLead1) {
      createdResponse = await Response.findOneAndUpdate(
        { lead: createdLead1._id, absorber: absorberUser._id },
        {
          lead: createdLead1._id,
          absorber: absorberUser._id,
          message: 'We have 15+ years experience in aerospace and industrial precision CNC machining. We operate 5-axis Mazak machines and hold ISO 9001:2015 certification. Ready to schedule technical review.',
          portfolioLink: 'https://patelprecision.com/portfolio',
          experienceYears: '15+ years',
          status: 'connected',
          isViewed: true,
          viewedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      // Seed Connection handshake
      await Connection.findOneAndUpdate(
        { lead: createdLead1._id, absorber: absorberUser._id },
        {
          lead: createdLead1._id,
          creator: creatorUser._id,
          absorber: absorberUser._id,
          response: createdResponse._id,
          status: 'connected',
          contactRevealedAt: new Date(),
        },
        { upsert: true, new: true }
      );
    }

    // 7. Seed Payments / Transaction Ledger (Razorpay + PayPal + AutoPay)
    const samplePayments = [
      {
        user: creatorUser._id,
        plan: planMap['creator-annual-inr']._id,
        gateway: 'razorpay',
        type: 'subscription',
        gatewayOrderId: 'order_rzp_demo_101',
        gatewayPaymentId: 'pay_rzp_live_998811',
        gatewaySubscriptionId: 'sub_rzp_autopay_001',
        amount: 999,
        currency: 'INR',
        status: 'captured',
        metadata: {
          isAutoPay: true,
          paymentMethod: 'UPI / Recurring e-Mandate',
          accountType: 'business',
          customerName: creatorUser.name,
        }
      },
      {
        user: absorberUser._id,
        plan: planMap['absorber-annual-inr']._id,
        gateway: 'razorpay',
        type: 'subscription',
        gatewayOrderId: 'order_rzp_demo_102',
        gatewayPaymentId: 'pay_rzp_live_998812',
        gatewaySubscriptionId: 'sub_rzp_autopay_002',
        amount: 999,
        currency: 'INR',
        status: 'captured',
        metadata: {
          isAutoPay: true,
          paymentMethod: 'HDFC Corporate NetBanking AutoPay',
          accountType: 'business',
          customerName: absorberUser.name,
        }
      },
      {
        user: creatorUser._id,
        plan: planMap['creator-annual-usd']._id,
        gateway: 'paypal',
        type: 'subscription',
        gatewayOrderId: 'PP-ORDER-EXP-2024-001',
        gatewayPaymentId: 'PP-PAY-CAPTURED-77112',
        gatewaySubscriptionId: 'I-PP-SUB-AUTOPAY-GLOBAL-1',
        amount: 49,
        currency: 'USD',
        status: 'captured',
        metadata: {
          isAutoPay: true,
          paymentMethod: 'PayPal Balance / International Card',
          country: 'United States',
          customerName: 'Global Sourcing Inc (Rajesh Sharma Partner)',
        }
      },
      {
        user: absorberUser._id,
        plan: planMap['absorber-annual-usd']._id,
        gateway: 'paypal',
        type: 'one_time',
        gatewayOrderId: 'PP-ORDER-EXP-2024-002',
        gatewayPaymentId: 'PP-PAY-CAPTURED-77113',
        amount: 49,
        currency: 'USD',
        status: 'captured',
        metadata: {
          isAutoPay: false,
          paymentMethod: 'Mastercard International',
          country: 'United Kingdom',
          customerName: 'Euro-Asia Trade Corp',
        }
      },
      {
        user: absorberUser._id,
        plan: planMap['absorber-annual-inr']._id,
        gateway: 'razorpay',
        type: 'subscription',
        gatewayOrderId: 'order_rzp_failed_003',
        amount: 999,
        currency: 'INR',
        status: 'failed',
        metadata: {
          isAutoPay: true,
          failureReason: 'Bank network timeout during OTP',
          customerName: absorberUser.name,
        }
      },
      {
        user: creatorUser._id,
        plan: planMap['creator-annual-inr']._id,
        gateway: 'razorpay',
        type: 'one_time',
        gatewayOrderId: 'order_rzp_pend_004',
        amount: 999,
        currency: 'INR',
        status: 'pending',
        metadata: {
          isAutoPay: false,
          customerName: creatorUser.name,
        }
      }
    ];

    for (const p of samplePayments) {
      await Payment.findOneAndUpdate(
        { gatewayOrderId: p.gatewayOrderId },
        p,
        { upsert: true }
      );
    }

    console.log('[SEED] Database seed completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'XPO India demo database seeded successfully!',
      credentials: {
        superadmin: { email: 'admin@xpoindia.com', password: 'XPOAdmin@2024', role: 'superadmin' },
        creator: { email: 'creator@xpoindia.com', password: 'Creator@2024', role: 'lead_creator' },
        absorber: { email: 'absorber@xpoindia.com', password: 'Absorber@2024', role: 'lead_absorber' },
      },
      counts: {
        categories: categoriesData.length,
        plans: plansData.length,
        leads: sampleLeads.length,
        payments: samplePayments.length,
      }
    });
  } catch (error: any) {
    console.error('[POST /api/admin/seed]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}