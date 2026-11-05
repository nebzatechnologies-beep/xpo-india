// ==============================================================================
// XPO India — Superadmin Console (Complete & Comprehensive Design System Implementation)
// Directly inspired by and faithfully implementing AdminWeb.dc.html
// ==============================================================================

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

export type SuperadminScreen =
  | 'home'
  | 'reqs'
  | 'contacts'
  | 'members'
  | 'money'
  | 'plans'
  | 'cats'
  | 'auto'
  | 'site'
  | 'settings';

export interface ReqItem {
  id: string;
  code: string;
  client: string;
  title: string;
  cat: string;
  city: string;
  country: string;
  tl: string;
  budget: string;
  budgetN: number;
  st: 'held' | 'live' | 'nomatch' | 'done' | 'closed' | 'changes';
  d: number;
  wave: number;
  interested: number;
  offered: number;
  keyword?: string;
  _s: string;
}

export interface ContactItem {
  id: string;
  name: string;
  role: 'Partner' | 'Client';
  city: string;
  country: string;
  phone: string;
  cat: string;
  cons: 'Opted in' | 'Missing';
  stage: 'Uploaded' | 'Invited' | 'Registered';
  batch: string;
  d: number;
  _s: string;
}

export interface MemberItem {
  id: string;
  name: string;
  role: 'Partner' | 'Client';
  city: string;
  country: string;
  phone: string;
  email: string;
  cat: string;
  kyc: 'Verified' | 'In review' | 'Pending';
  plan: string;
  used: number;
  cap: number;
  d: number;
  last: number;
  st: 'Active' | 'Paused';
  _s: string;
}

export interface PaymentItem {
  id: string;
  who: string;
  role: 'Partner' | 'Client';
  plan: string;
  amt: number;
  gst: number;
  gw: 'Razorpay card' | 'UPI AutoPay' | 'PayPal' | 'Stripe';
  st: 'Captured' | 'Failed' | 'Refunded';
  d: number;
  tm: string;
  cur: '₹' | '$';
  region: 'India' | 'Outside India';
  _s: string;
}

export interface ConvoItem {
  id: string;
  name: string;
  role: 'Partner' | 'Client';
  phone: string;
  st: string;
  lang: string;
  mins: number;
  paused: boolean;
  last: string;
  d: number;
  _s: string;
}

export interface SubItem {
  id: string;
  name: string;
  role: 'Partner' | 'Client';
  plan: string;
  region: string;
  zone: 'India' | 'Overseas';
  price: number;
  cur: '₹' | '$';
  d: number;
  renew: number;
  used: number;
  st: 'Active' | 'Renewal failed' | 'Cancelling' | 'Expired';
  pay: string;
  _s: string;
}

export interface SectorItem {
  name: string;
  open: boolean;
  cats: {
    name: string;
    p: number;
    r: number;
    on: boolean;
    subs: [string, number, string, string][];
    syn: string[];
    types: string[];
  }[];
}

const INITIAL_TAXONOMY: SectorItem[] = [
  {
    "name": "Technology & Software",
    "open": true,
    "cats": [
      {
        "name": "Web & Mobile Development",
        "p": 3726,
        "r": 410,
        "on": true,
        "subs": [
          [
            "Full-Stack & SaaS Engineering",
            785,
            "react, node.js, next.js, saas, mern",
            "web app, software developer"
          ],
          [
            "iOS, Android & Cross-Platform",
            91,
            "flutter, react native, kotlin, swift",
            "app developer, mobile app"
          ],
          [
            "E-commerce stores",
            827,
            "shopify, woocommerce, magento, razorpay",
            "online store, ecommerce website"
          ],
          [
            "Business websites",
            702,
            "wordpress, landing page, cms",
            "company website, website banana"
          ],
          [
            "Web portals & marketplaces",
            456,
            "multi-vendor, b2b portal, booking",
            "portal development"
          ],
          [
            "Website maintenance & hosting",
            865,
            "amc, hosting, ssl, backups",
            "website support"
          ]
        ],
        "syn": [
          "web app",
          "software developer",
          "app developer",
          "mobile app",
          "online store",
          "ecommerce website",
          "company website",
          "website banana",
          "portal development",
          "website support"
        ],
        "types": [
          "Freelancer",
          "Agency / Studio"
        ]
      },
      {
        "name": "Enterprise Software & ERP",
        "p": 1304,
        "r": 143,
        "on": true,
        "subs": [
          [
            "ERP implementation",
            92,
            "sap, odoo, tally prime, erpnext",
            "erp software"
          ],
          [
            "CRM setup",
            206,
            "salesforce, zoho, hubspot",
            "crm software"
          ],
          [
            "Custom business software",
            113,
            "inventory, billing, hrms",
            "software banwana"
          ],
          [
            "Microsoft 365 & Google Workspace",
            449,
            "email setup, migration, licences",
            "office 365"
          ],
          [
            "POS & billing systems",
            444,
            "retail pos, restaurant billing",
            "billing software"
          ]
        ],
        "syn": [
          "erp software",
          "crm software",
          "software banwana",
          "office 365",
          "billing software"
        ],
        "types": [
          "Agency / Studio",
          "Consultant / Professional"
        ]
      },
      {
        "name": "Cloud, Data & AI",
        "p": 2289,
        "r": 252,
        "on": true,
        "subs": [
          [
            "Cloud & DevOps",
            537,
            "aws, azure, gcp, kubernetes, ci/cd",
            "cloud migration"
          ],
          [
            "Data engineering & BI",
            876,
            "power bi, tableau, sql, etl",
            "dashboard, mis reports"
          ],
          [
            "AI, ML & automation",
            422,
            "chatbot, llm, computer vision, rpa",
            "ai solution, automation"
          ],
          [
            "Data entry & processing",
            454,
            "ocr, catalog upload, typing",
            "data entry operator"
          ]
        ],
        "syn": [
          "cloud migration",
          "dashboard",
          "mis reports",
          "ai solution",
          "automation",
          "data entry operator"
        ],
        "types": [
          "Freelancer",
          "Agency / Studio",
          "Consultant / Professional"
        ]
      },
      {
        "name": "IT Infrastructure & Hardware",
        "p": 2622,
        "r": 288,
        "on": true,
        "subs": [
          [
            "Networking & Wi-Fi",
            702,
            "lan, cabling, firewall, routers",
            "networking contractor"
          ],
          [
            "CCTV & access control",
            493,
            "ip cameras, biometric, nvr",
            "cctv installation"
          ],
          [
            "Servers & data centres",
            323,
            "rack, ups, storage",
            "server setup"
          ],
          [
            "Laptops & IT hardware supply",
            774,
            "dell, hp, lenovo, rental",
            "computer dealer"
          ],
          [
            "IT support & AMC",
            330,
            "helpdesk, annual maintenance",
            "computer repair"
          ]
        ],
        "syn": [
          "networking contractor",
          "cctv installation",
          "server setup",
          "computer dealer",
          "computer repair"
        ],
        "types": [
          "Trader / Distributor",
          "Contractor",
          "Service provider"
        ]
      },
      {
        "name": "Cybersecurity",
        "p": 1476,
        "r": 162,
        "on": true,
        "subs": [
          [
            "Audits & VAPT",
            883,
            "penetration testing, vulnerability scan",
            "security audit"
          ],
          [
            "Compliance (ISO 27001, SOC 2)",
            399,
            "iso 27001, soc 2, dpdp",
            "information security"
          ],
          [
            "Managed security (SOC)",
            194,
            "siem, monitoring, edr",
            "cyber security service"
          ]
        ],
        "syn": [
          "security audit",
          "information security",
          "cyber security service"
        ],
        "types": [
          "Agency / Studio",
          "Consultant / Professional"
        ]
      },
      {
        "name": "Software Testing & QA",
        "p": 878,
        "r": 97,
        "on": true,
        "subs": [
          [
            "Manual testing",
            92,
            "test cases, uat",
            "software tester"
          ],
          [
            "Automation testing",
            66,
            "selenium, cypress, appium",
            "test automation"
          ],
          [
            "Performance & load testing",
            720,
            "jmeter, k6",
            "load testing"
          ]
        ],
        "syn": [
          "software tester",
          "test automation",
          "load testing"
        ],
        "types": [
          "Freelancer",
          "Agency / Studio"
        ]
      }
    ]
  },
  {
    "name": "Design, Media & Marketing",
    "open": false,
    "cats": [
      {
        "name": "Brand Identity & UI/UX",
        "p": 1358,
        "r": 149,
        "on": true,
        "subs": [
          [
            "Logo & brand kits",
            180,
            "logo, brand guidelines, visiting card",
            "logo design, branding"
          ],
          [
            "UI/UX design",
            61,
            "figma, wireframes, prototypes",
            "app design, website design"
          ],
          [
            "Packaging design",
            311,
            "labels, boxes, pouches",
            "label design"
          ],
          [
            "Graphic design",
            544,
            "brochures, posters, social creatives",
            "designer, creatives"
          ],
          [
            "Illustration & 3D",
            262,
            "mascot, 3d render, product render",
            "3d design"
          ]
        ],
        "syn": [
          "logo design",
          "branding",
          "app design",
          "website design",
          "label design",
          "designer",
          "creatives",
          "3d design"
        ],
        "types": [
          "Freelancer",
          "Agency / Studio"
        ]
      },
      {
        "name": "Performance Marketing & SEO",
        "p": 3709,
        "r": 408,
        "on": true,
        "subs": [
          [
            "Google & Meta ads",
            547,
            "ppc, google ads, facebook ads, lead gen",
            "digital marketing, ads"
          ],
          [
            "SEO",
            586,
            "on-page, backlinks, local seo, gmb",
            "google ranking"
          ],
          [
            "Social media management",
            619,
            "instagram, linkedin, reels",
            "social media marketing"
          ],
          [
            "Marketplace marketing",
            903,
            "amazon ads, flipkart, meesho",
            "amazon seller ads"
          ],
          [
            "Email & WhatsApp marketing",
            503,
            "campaigns, automation, bulk messaging",
            "bulk sms"
          ],
          [
            "Influencer marketing",
            551,
            "creators, ugc",
            "influencer campaign"
          ]
        ],
        "syn": [
          "digital marketing",
          "ads",
          "google ranking",
          "social media marketing",
          "amazon seller ads",
          "bulk sms",
          "influencer campaign"
        ],
        "types": [
          "Freelancer",
          "Agency / Studio"
        ]
      },
      {
        "name": "Content & Communication",
        "p": 1750,
        "r": 192,
        "on": true,
        "subs": [
          [
            "Content writing",
            209,
            "blogs, website copy, seo content",
            "content writer"
          ],
          [
            "Copywriting",
            765,
            "ads copy, taglines",
            "copywriter"
          ],
          [
            "Translation & localisation",
            274,
            "hindi, regional languages, foreign languages",
            "translator, anuvad"
          ],
          [
            "Public relations",
            118,
            "press release, media coverage",
            "pr agency"
          ],
          [
            "Technical writing",
            384,
            "manuals, documentation",
            "technical writer"
          ]
        ],
        "syn": [
          "content writer",
          "copywriter",
          "translator",
          "anuvad",
          "pr agency",
          "technical writer"
        ],
        "types": [
          "Freelancer",
          "Agency / Studio"
        ]
      },
      {
        "name": "Video & Photography",
        "p": 3448,
        "r": 379,
        "on": true,
        "subs": [
          [
            "Product photography",
            730,
            "catalogue, white background, amazon images",
            "product shoot"
          ],
          [
            "Corporate films",
            513,
            "ad film, documentary",
            "video production"
          ],
          [
            "Reels & short videos",
            508,
            "reels shoot, youtube shorts",
            "reels shoot"
          ],
          [
            "Video editing & motion graphics",
            529,
            "after effects, animation, explainer",
            "video editor"
          ],
          [
            "Event photography",
            255,
            "conferences, exhibitions",
            "event photographer"
          ],
          [
            "Drone shoots",
            913,
            "aerial, site progress",
            "drone camera"
          ]
        ],
        "syn": [
          "product shoot",
          "video production",
          "reels shoot",
          "video editor",
          "event photographer",
          "drone camera"
        ],
        "types": [
          "Freelancer",
          "Agency / Studio"
        ]
      },
      {
        "name": "Advertising & Outdoor",
        "p": 1169,
        "r": 129,
        "on": true,
        "subs": [
          [
            "Hoardings & outdoor media",
            403,
            "billboards, transit ads",
            "hoarding advertising"
          ],
          [
            "Signage & display boards",
            356,
            "acp, led signage, glow sign",
            "sign board"
          ],
          [
            "Radio, TV & print ads",
            410,
            "media buying, newspaper ads",
            "advertising agency"
          ]
        ],
        "syn": [
          "hoarding advertising",
          "sign board",
          "advertising agency"
        ],
        "types": [
          "Agency / Studio",
          "Contractor"
        ]
      },
      {
        "name": "Audio & Music",
        "p": 1306,
        "r": 144,
        "on": true,
        "subs": [
          [
            "Voice-over",
            307,
            "ivr, ads, e-learning",
            "voice artist"
          ],
          [
            "Jingles & music production",
            713,
            "jingle, background score",
            "music composer"
          ],
          [
            "Podcast production",
            286,
            "editing, recording",
            "podcast"
          ]
        ],
        "syn": [
          "voice artist",
          "music composer",
          "podcast"
        ],
        "types": [
          "Freelancer",
          "Agency / Studio"
        ]
      }
    ]
  },
  {
    "name": "Manufacturing & Industrial",
    "open": false,
    "cats": [
      {
        "name": "Industrial Packaging",
        "p": 3224,
        "r": 355,
        "on": true,
        "subs": [
          [
            "Corrugated boxes",
            127,
            "3-ply, 5-ply, printed cartons",
            "box, carton, dabba, petti"
          ],
          [
            "Mono cartons",
            244,
            "duplex board, pharma cartons",
            "printed box"
          ],
          [
            "Flexible pouches",
            736,
            "stand-up pouch, zipper, laminates",
            "pouch packing"
          ],
          [
            "Plastic packaging",
            629,
            "pet jars, containers, crates",
            "plastic container"
          ],
          [
            "Labels & stickers",
            199,
            "barcode labels, bopp tape",
            "sticker printing"
          ],
          [
            "Protective packaging",
            645,
            "bubble wrap, foam, pallets, stretch film",
            "packing material"
          ],
          [
            "Wooden pallets & boxes",
            644,
            "export pallets, crates, fumigated",
            "wooden packing"
          ]
        ],
        "syn": [
          "box",
          "carton",
          "dabba",
          "petti",
          "printed box",
          "pouch packing",
          "plastic container",
          "sticker printing",
          "packing material",
          "wooden packing"
        ],
        "types": [
          "Manufacturer",
          "Trader / Distributor"
        ]
      },
      {
        "name": "CNC Machining & Metal Fabrication",
        "p": 2863,
        "r": 315,
        "on": true,
        "subs": [
          [
            "CNC machined parts",
            244,
            "vmc, turning, milling, precision",
            "cnc job work"
          ],
          [
            "Sheet metal",
            343,
            "bending, punching, enclosures",
            "sheet metal fabrication"
          ],
          [
            "Structural fabrication",
            382,
            "ms structure, mezzanine, sheds",
            "fabrication work"
          ],
          [
            "Laser & plasma cutting",
            819,
            "fiber laser, cnc cutting",
            "laser cutting"
          ],
          [
            "Welding & job work",
            554,
            "tig, mig, arc",
            "welding work"
          ],
          [
            "Castings & forgings",
            521,
            "sand casting, die casting, forging",
            "casting supplier"
          ]
        ],
        "syn": [
          "cnc job work",
          "sheet metal fabrication",
          "fabrication work",
          "laser cutting",
          "welding work",
          "casting supplier"
        ],
        "types": [
          "Manufacturer",
          "Contractor",
          "OEM supplier"
        ]
      },
      {
        "name": "Plastics & Rubber",
        "p": 2538,
        "r": 279,
        "on": true,
        "subs": [
          [
            "Injection moulding",
            325,
            "pp, abs, nylon, custom parts",
            "plastic parts, moulding"
          ],
          [
            "Blow moulding",
            456,
            "bottles, cans, jerry cans",
            "plastic bottles"
          ],
          [
            "Moulds & tooling",
            675,
            "mould making, die design",
            "mould maker"
          ],
          [
            "Rubber products",
            217,
            "gaskets, seals, o-rings",
            "rubber parts"
          ],
          [
            "Plastic extrusion",
            865,
            "pipes, profiles, sheets",
            "pvc pipes"
          ]
        ],
        "syn": [
          "plastic parts",
          "moulding",
          "plastic bottles",
          "mould maker",
          "rubber parts",
          "pvc pipes"
        ],
        "types": [
          "Manufacturer",
          "OEM supplier"
        ]
      },
      {
        "name": "Textiles & Garments",
        "p": 3670,
        "r": 404,
        "on": true,
        "subs": [
          [
            "Uniforms & workwear",
            572,
            "school, corporate, industrial uniforms",
            "uniform maker"
          ],
          [
            "Private-label apparel",
            616,
            "t-shirts, hoodies, cut & sew",
            "garment manufacturer"
          ],
          [
            "Fabrics & yarn",
            121,
            "cotton, polyester, denim",
            "kapda, fabric supplier"
          ],
          [
            "Home textiles",
            731,
            "bedsheets, towels, curtains",
            "home furnishing"
          ],
          [
            "Embroidery & printing",
            781,
            "screen printing, dtf, sublimation",
            "t-shirt printing"
          ],
          [
            "Technical textiles",
            849,
            "nonwoven, geotextile, ppe",
            "nonwoven fabric"
          ]
        ],
        "syn": [
          "uniform maker",
          "garment manufacturer",
          "kapda",
          "fabric supplier",
          "home furnishing",
          "t-shirt printing",
          "nonwoven fabric"
        ],
        "types": [
          "Manufacturer",
          "Exporter",
          "Trader / Distributor"
        ]
      },
      {
        "name": "Leather & Footwear",
        "p": 1672,
        "r": 184,
        "on": true,
        "subs": [
          [
            "Leather goods",
            900,
            "bags, wallets, belts",
            "leather products"
          ],
          [
            "Footwear",
            684,
            "safety shoes, sandals, sports shoes",
            "shoes manufacturer"
          ],
          [
            "Finished leather",
            88,
            "tannery, hides",
            "leather supplier"
          ]
        ],
        "syn": [
          "leather products",
          "shoes manufacturer",
          "leather supplier"
        ],
        "types": [
          "Manufacturer",
          "Exporter"
        ]
      },
      {
        "name": "Paper & Stationery",
        "p": 994,
        "r": 109,
        "on": true,
        "subs": [
          [
            "Paper products",
            281,
            "paper bags, cups, plates",
            "paper bag"
          ],
          [
            "Office stationery",
            172,
            "notebooks, files, pens",
            "stationery supplier"
          ],
          [
            "Tissue & hygiene paper",
            541,
            "tissue rolls, napkins",
            "tissue paper"
          ]
        ],
        "syn": [
          "paper bag",
          "stationery supplier",
          "tissue paper"
        ],
        "types": [
          "Manufacturer",
          "Trader / Distributor"
        ]
      }
    ]
  },
  {
    "name": "Engineering & Industrial Services",
    "open": false,
    "cats": [
      {
        "name": "Machinery & Equipment",
        "p": 3803,
        "r": 418,
        "on": true,
        "subs": [
          [
            "Packaging machines",
            759,
            "filling, sealing, labelling",
            "packing machine"
          ],
          [
            "Food processing machines",
            910,
            "grinders, roasters, mixers",
            "food machinery"
          ],
          [
            "Machine tools",
            674,
            "lathe, vmc, press",
            "machine tool dealer"
          ],
          [
            "Material handling",
            711,
            "forklifts, conveyors, cranes, pallet trucks",
            "forklift rental"
          ],
          [
            "Pumps, valves & compressors",
            296,
            "centrifugal pumps, air compressors",
            "pump supplier"
          ],
          [
            "Used & refurbished machinery",
            453,
            "second-hand machines",
            "old machine"
          ]
        ],
        "syn": [
          "packing machine",
          "food machinery",
          "machine tool dealer",
          "forklift rental",
          "pump supplier",
          "old machine"
        ],
        "types": [
          "Manufacturer",
          "Trader / Distributor",
          "Importer"
        ]
      },
      {
        "name": "Industrial Maintenance",
        "p": 1954,
        "r": 215,
        "on": true,
        "subs": [
          [
            "Machine repair & AMC",
            829,
            "breakdown, preventive maintenance",
            "machine repair"
          ],
          [
            "Industrial electrical maintenance",
            193,
            "panels, motors, rewinding",
            "motor rewinding"
          ],
          [
            "Boiler & utility services",
            629,
            "boilers, chillers, cooling towers",
            "boiler service"
          ],
          [
            "Calibration & testing",
            303,
            "nabl, instruments, ndt",
            "calibration lab"
          ]
        ],
        "syn": [
          "machine repair",
          "motor rewinding",
          "boiler service",
          "calibration lab"
        ],
        "types": [
          "Contractor",
          "Service provider"
        ]
      },
      {
        "name": "Design & Engineering",
        "p": 3024,
        "r": 333,
        "on": true,
        "subs": [
          [
            "Mechanical design (CAD)",
            643,
            "solidworks, autocad, 3d models",
            "cad drawing"
          ],
          [
            "Product design & development",
            786,
            "industrial design, dfm",
            "product designer"
          ],
          [
            "Structural engineering",
            613,
            "staad pro, structural drawings",
            "structural engineer"
          ],
          [
            "Electrical & instrumentation design",
            384,
            "sld, plc, scada",
            "electrical design"
          ],
          [
            "HVAC & MEP design",
            598,
            "mep drawings, plumbing design",
            "mep consultant"
          ]
        ],
        "syn": [
          "cad drawing",
          "product designer",
          "structural engineer",
          "electrical design",
          "mep consultant"
        ],
        "types": [
          "Freelancer",
          "Agency / Studio",
          "Consultant / Professional"
        ]
      },
      {
        "name": "Automation & Controls",
        "p": 1350,
        "r": 148,
        "on": true,
        "subs": [
          [
            "PLC & SCADA",
            248,
            "siemens, allen bradley, hmi",
            "plc programming"
          ],
          [
            "Industrial IoT",
            140,
            "sensors, monitoring, iiot",
            "iot solution"
          ],
          [
            "Robotics",
            179,
            "robotic arms, agv",
            "robot automation"
          ],
          [
            "Control panels",
            783,
            "mcc, pcc, vfd panels",
            "panel manufacturer"
          ]
        ],
        "syn": [
          "plc programming",
          "iot solution",
          "robot automation",
          "panel manufacturer"
        ],
        "types": [
          "Contractor",
          "Agency / Studio",
          "Trader / Distributor"
        ]
      },
      {
        "name": "Testing, Inspection & Certification",
        "p": 2299,
        "r": 253,
        "on": true,
        "subs": [
          [
            "Quality inspection",
            363,
            "third-party inspection, pre-shipment",
            "quality check"
          ],
          [
            "Lab testing",
            836,
            "materials, food, textiles",
            "testing lab"
          ],
          [
            "Product certification",
            573,
            "bis, ce, ul, rohs",
            "bis certificate"
          ],
          [
            "ISO certification",
            527,
            "iso 9001, 14001, 45001",
            "iso consultant"
          ]
        ],
        "syn": [
          "quality check",
          "testing lab",
          "bis certificate",
          "iso consultant"
        ],
        "types": [
          "Consultant / Professional",
          "Service provider"
        ]
      }
    ]
  },
  {
    "name": "Construction & Real Estate",
    "open": false,
    "cats": [
      {
        "name": "Civil Contractors",
        "p": 3786,
        "r": 416,
        "on": true,
        "subs": [
          [
            "Industrial sheds & PEB",
            517,
            "pre-engineered building, warehouses",
            "shed construction"
          ],
          [
            "Residential construction",
            807,
            "houses, villas, apartments",
            "house construction, ghar banana"
          ],
          [
            "Commercial buildings",
            876,
            "offices, showrooms, hospitals",
            "building contractor"
          ],
          [
            "Roads & site development",
            188,
            "paving, rcc roads, compound walls",
            "road contractor"
          ],
          [
            "Renovation & repairs",
            494,
            "waterproofing, plastering, painting",
            "repair work"
          ],
          [
            "Labour contractors",
            904,
            "masons, helpers, skilled labour",
            "labour supply"
          ]
        ],
        "syn": [
          "shed construction",
          "house construction",
          "ghar banana",
          "building contractor",
          "road contractor",
          "repair work",
          "labour supply"
        ],
        "types": [
          "Contractor"
        ]
      },
      {
        "name": "Interiors & Fit-out",
        "p": 3376,
        "r": 371,
        "on": true,
        "subs": [
          [
            "Office interiors",
            912,
            "workstations, cabins, false ceiling",
            "office interior fit-out"
          ],
          [
            "Retail & showrooms",
            859,
            "store fixtures, displays",
            "shop interior"
          ],
          [
            "Home interiors",
            191,
            "modular kitchen, wardrobes",
            "home interior"
          ],
          [
            "False ceiling & partitions",
            105,
            "gypsum, grid ceiling, glass partitions",
            "pop work"
          ],
          [
            "Flooring",
            524,
            "vinyl, epoxy, wooden, carpet",
            "flooring contractor"
          ],
          [
            "Painting & wall finishes",
            785,
            "texture, wallpaper",
            "painter"
          ]
        ],
        "syn": [
          "office interior fit-out",
          "shop interior",
          "home interior",
          "pop work",
          "flooring contractor",
          "painter"
        ],
        "types": [
          "Contractor",
          "Manufacturer",
          "Agency / Studio"
        ]
      },
      {
        "name": "Architecture & Planning",
        "p": 2400,
        "r": 264,
        "on": true,
        "subs": [
          [
            "Architectural design",
            814,
            "plans, elevations, 3d views",
            "architect"
          ],
          [
            "Interior design",
            711,
            "concepts, 3d renders",
            "interior designer"
          ],
          [
            "Landscape design",
            86,
            "gardens, terraces",
            "landscaping"
          ],
          [
            "Approvals & liaison",
            303,
            "building permission, noc",
            "plan approval"
          ],
          [
            "Surveying",
            486,
            "land survey, total station, dgps",
            "land surveyor"
          ]
        ],
        "syn": [
          "architect",
          "interior designer",
          "landscaping",
          "plan approval",
          "land surveyor"
        ],
        "types": [
          "Consultant / Professional",
          "Freelancer",
          "Agency / Studio"
        ]
      },
      {
        "name": "Building Services (MEP)",
        "p": 1834,
        "r": 202,
        "on": true,
        "subs": [
          [
            "Electrical contracting",
            635,
            "wiring, ht/lt, earthing",
            "electrician contractor"
          ],
          [
            "Plumbing & sanitation",
            321,
            "pipelines, stp, fittings",
            "plumber"
          ],
          [
            "HVAC & air conditioning",
            508,
            "vrv, ducting, chillers",
            "ac installation"
          ],
          [
            "Fire safety systems",
            234,
            "sprinklers, hydrants, alarms, fire noc",
            "fire fighting"
          ],
          [
            "Lifts & elevators",
            136,
            "passenger lifts, goods lifts",
            "lift company"
          ]
        ],
        "syn": [
          "electrician contractor",
          "plumber",
          "ac installation",
          "fire fighting",
          "lift company"
        ],
        "types": [
          "Contractor"
        ]
      },
      {
        "name": "Building Materials",
        "p": 3563,
        "r": 392,
        "on": true,
        "subs": [
          [
            "Cement & concrete",
            835,
            "rmc, opc, ppc",
            "cement dealer"
          ],
          [
            "Steel & TMT bars",
            721,
            "tmt, structural steel",
            "sariya, steel supplier"
          ],
          [
            "Bricks, blocks & aggregates",
            752,
            "aac blocks, fly ash bricks, sand",
            "eent, bricks"
          ],
          [
            "Doors, windows & hardware",
            103,
            "upvc, aluminium windows, locks",
            "windows supplier"
          ],
          [
            "Paints & waterproofing",
            271,
            "emulsion, membranes",
            "paint dealer"
          ],
          [
            "Roofing & cladding",
            881,
            "metal roofing, acp cladding",
            "roof sheets"
          ]
        ],
        "syn": [
          "cement dealer",
          "sariya",
          "steel supplier",
          "eent",
          "bricks",
          "windows supplier",
          "paint dealer",
          "roof sheets"
        ],
        "types": [
          "Manufacturer",
          "Trader / Distributor"
        ]
      },
      {
        "name": "Real Estate Services",
        "p": 2122,
        "r": 233,
        "on": true,
        "subs": [
          [
            "Commercial leasing",
            708,
            "office space, warehouse leasing",
            "property broker"
          ],
          [
            "Industrial land & plots",
            463,
            "midc, industrial plots",
            "land deal"
          ],
          [
            "Property management",
            416,
            "facility, rentals",
            "property manager"
          ],
          [
            "Valuation",
            535,
            "property valuation, bank valuation",
            "valuer"
          ]
        ],
        "syn": [
          "property broker",
          "land deal",
          "property manager",
          "valuer"
        ],
        "types": [
          "Service provider",
          "Consultant / Professional"
        ]
      }
    ]
  },
  {
    "name": "Energy, Power & Utilities",
    "open": false,
    "cats": [
      {
        "name": "Solar & Electrical EPC",
        "p": 1797,
        "r": 198,
        "on": true,
        "subs": [
          [
            "Rooftop solar",
            555,
            "net metering, on-grid, subsidy",
            "solar panel, solar lagwana"
          ],
          [
            "Ground-mounted solar",
            283,
            "open access, mw plants",
            "solar farm"
          ],
          [
            "Solar water heaters & pumps",
            74,
            "solar pump, heater",
            "solar pump"
          ],
          [
            "Solar O&M",
            885,
            "cleaning, monitoring",
            "solar maintenance"
          ]
        ],
        "syn": [
          "solar panel",
          "solar lagwana",
          "solar farm",
          "solar pump",
          "solar maintenance"
        ],
        "types": [
          "Contractor",
          "Trader / Distributor"
        ]
      },
      {
        "name": "Power Equipment",
        "p": 1916,
        "r": 211,
        "on": true,
        "subs": [
          [
            "Diesel generators",
            113,
            "dg sets, rental, amc",
            "generator"
          ],
          [
            "UPS & inverters",
            851,
            "online ups, batteries",
            "inverter"
          ],
          [
            "Transformers & switchgear",
            140,
            "distribution transformer, vcb",
            "transformer"
          ],
          [
            "Cables & wires",
            812,
            "lt cables, ht cables, house wires",
            "cable supplier"
          ]
        ],
        "syn": [
          "generator",
          "inverter",
          "transformer",
          "cable supplier"
        ],
        "types": [
          "Manufacturer",
          "Trader / Distributor"
        ]
      },
      {
        "name": "Energy Efficiency",
        "p": 1500,
        "r": 165,
        "on": true,
        "subs": [
          [
            "Energy audits",
            702,
            "bee, power quality",
            "energy audit"
          ],
          [
            "LED lighting retrofits",
            719,
            "led lights, street lights",
            "led lights"
          ],
          [
            "EV charging",
            79,
            "chargers, installation",
            "ev charger"
          ]
        ],
        "syn": [
          "energy audit",
          "led lights",
          "ev charger"
        ],
        "types": [
          "Consultant / Professional",
          "Contractor"
        ]
      },
      {
        "name": "Water & Utilities",
        "p": 740,
        "r": 81,
        "on": true,
        "subs": [
          [
            "Water treatment plants",
            250,
            "ro, wtp, softener",
            "ro plant"
          ],
          [
            "Sewage & effluent treatment",
            431,
            "stp, etp, zld",
            "stp plant"
          ],
          [
            "Borewell & water supply",
            59,
            "borewell drilling, tankers",
            "borewell"
          ]
        ],
        "syn": [
          "ro plant",
          "stp plant",
          "borewell"
        ],
        "types": [
          "Contractor",
          "Manufacturer"
        ]
      }
    ]
  },
  {
    "name": "Trade, Export & Import",
    "open": false,
    "cats": [
      {
        "name": "Export Services",
        "p": 2084,
        "r": 229,
        "on": true,
        "subs": [
          [
            "Export documentation",
            391,
            "iec, invoices, shipping bill, coo",
            "export paperwork"
          ],
          [
            "Buyer sourcing abroad",
            206,
            "buyer leads, trade fairs, b2b",
            "foreign buyers"
          ],
          [
            "Export certifications",
            548,
            "apeda, fssai, fda, halal, organic",
            "export license"
          ],
          [
            "Export incentives & schemes",
            741,
            "rodtep, epcg, advance licence",
            "export benefits"
          ],
          [
            "Export finance",
            198,
            "pre-shipment credit, lc, factoring",
            "export loan"
          ]
        ],
        "syn": [
          "export paperwork",
          "foreign buyers",
          "export license",
          "export benefits",
          "export loan"
        ],
        "types": [
          "Consultant / Professional",
          "Exporter"
        ]
      },
      {
        "name": "Import & Sourcing",
        "p": 1830,
        "r": 201,
        "on": true,
        "subs": [
          [
            "China & Asia sourcing",
            185,
            "alibaba, factory audit, sourcing agent",
            "import from china"
          ],
          [
            "Europe & USA sourcing",
            701,
            "machinery, brands, distributors",
            "import agent"
          ],
          [
            "Quality inspection abroad",
            813,
            "pre-shipment inspection",
            "inspection agency"
          ],
          [
            "Import compliance",
            131,
            "bis, wpc, lmpc, epr",
            "import license"
          ]
        ],
        "syn": [
          "import from china",
          "import agent",
          "inspection agency",
          "import license"
        ],
        "types": [
          "Importer",
          "Trader / Distributor",
          "Consultant / Professional"
        ]
      },
      {
        "name": "Wholesale & Distribution",
        "p": 1841,
        "r": 203,
        "on": true,
        "subs": [
          [
            "FMCG distribution",
            295,
            "super stockist, distributor, cnf",
            "distributor chahiye"
          ],
          [
            "Industrial supplies (MRO)",
            207,
            "tools, fasteners, bearings, safety items",
            "industrial supplier"
          ],
          [
            "Electronics & mobile accessories",
            137,
            "chargers, cables, gadgets",
            "mobile accessories wholesale"
          ],
          [
            "Building & hardware trading",
            155,
            "sanitary, tiles, hardware",
            "hardware wholesaler"
          ],
          [
            "Raw material trading",
            491,
            "polymers, steel, chemicals, paper",
            "raw material supplier"
          ],
          [
            "Surplus & liquidation stock",
            556,
            "closeout, deadstock",
            "stock lot"
          ]
        ],
        "syn": [
          "distributor chahiye",
          "industrial supplier",
          "mobile accessories wholesale",
          "hardware wholesaler",
          "raw material supplier",
          "stock lot"
        ],
        "types": [
          "Trader / Distributor",
          "Importer"
        ]
      },
      {
        "name": "Export Products",
        "p": 3115,
        "r": 343,
        "on": true,
        "subs": [
          [
            "Spices & agro exports",
            566,
            "chilli, turmeric, cumin, rice",
            "masala export"
          ],
          [
            "Engineering goods exports",
            340,
            "auto parts, castings, pumps",
            "engineering export"
          ],
          [
            "Textile & garment exports",
            757,
            "readymade garments, home textiles",
            "garment export"
          ],
          [
            "Handicraft exports",
            659,
            "brass, wood, decor",
            "handicraft export"
          ],
          [
            "Chemical & pharma exports",
            793,
            "api, intermediates, dyes",
            "chemical export"
          ]
        ],
        "syn": [
          "masala export",
          "engineering export",
          "garment export",
          "handicraft export",
          "chemical export"
        ],
        "types": [
          "Exporter",
          "Manufacturer"
        ]
      }
    ]
  },
  {
    "name": "Logistics & Supply Chain",
    "open": false,
    "cats": [
      {
        "name": "Logistics & Warehousing",
        "p": 1766,
        "r": 194,
        "on": true,
        "subs": [
          [
            "3PL warehousing",
            275,
            "storage, fulfilment, inventory",
            "godown, warehouse"
          ],
          [
            "Full truckload (FTL)",
            209,
            "trucks, containers, trailers",
            "truck booking, transport"
          ],
          [
            "Part load (PTL)",
            447,
            "ltl, shared trucks",
            "part load transport"
          ],
          [
            "Cold chain",
            325,
            "reefer trucks, cold storage",
            "cold storage"
          ],
          [
            "E-commerce fulfilment",
            510,
            "pick-pack, returns, last mile",
            "fulfilment centre"
          ]
        ],
        "syn": [
          "godown",
          "warehouse",
          "truck booking",
          "transport",
          "part load transport",
          "cold storage",
          "fulfilment centre"
        ],
        "types": [
          "Service provider",
          "Contractor"
        ]
      },
      {
        "name": "Freight & Customs",
        "p": 2260,
        "r": 249,
        "on": true,
        "subs": [
          [
            "Customs clearance (CHA)",
            564,
            "customs broker, bill of entry",
            "cha agent"
          ],
          [
            "Sea freight",
            445,
            "fcl, lcl, freight forwarder",
            "shipping"
          ],
          [
            "Air freight",
            525,
            "air cargo, express",
            "air cargo"
          ],
          [
            "Project cargo",
            726,
            "odc, heavy lift",
            "odc transport"
          ]
        ],
        "syn": [
          "cha agent",
          "shipping",
          "air cargo",
          "odc transport"
        ],
        "types": [
          "Service provider",
          "Consultant / Professional"
        ]
      },
      {
        "name": "Courier & Last Mile",
        "p": 1729,
        "r": 190,
        "on": true,
        "subs": [
          [
            "Domestic courier",
            533,
            "b2b courier, documents",
            "courier service"
          ],
          [
            "International courier",
            825,
            "dhl, fedex, samples",
            "international courier"
          ],
          [
            "Intra-city delivery",
            371,
            "bike delivery, tempo",
            "local delivery"
          ]
        ],
        "syn": [
          "courier service",
          "international courier",
          "local delivery"
        ],
        "types": [
          "Service provider"
        ]
      },
      {
        "name": "Fleet & Vehicles",
        "p": 1600,
        "r": 176,
        "on": true,
        "subs": [
          [
            "Vehicle rental",
            509,
            "tempo, pickup, cars with driver",
            "gaadi rent"
          ],
          [
            "Fleet management",
            916,
            "gps tracking, fastag",
            "fleet tracking"
          ],
          [
            "Packers & movers",
            175,
            "office shifting, relocation",
            "packers movers"
          ]
        ],
        "syn": [
          "gaadi rent",
          "fleet tracking",
          "packers movers"
        ],
        "types": [
          "Service provider",
          "Trader / Distributor"
        ]
      }
    ]
  },
  {
    "name": "Finance, Legal & Compliance",
    "open": false,
    "cats": [
      {
        "name": "Accounting & Compliance",
        "p": 3733,
        "r": 411,
        "on": true,
        "subs": [
          [
            "GST & tax filing",
            507,
            "gstr-1, gstr-3b, income tax, tds",
            "gst return, ca"
          ],
          [
            "Bookkeeping",
            902,
            "tally, zoho books, monthly accounts",
            "accountant"
          ],
          [
            "Company incorporation",
            414,
            "pvt ltd, llp, opc, startup india",
            "company registration"
          ],
          [
            "Audit & assurance",
            271,
            "statutory audit, internal audit",
            "auditor"
          ],
          [
            "Payroll compliance",
            751,
            "pf, esi, professional tax",
            "pf esi"
          ],
          [
            "MSME & licences",
            888,
            "udyam, fssai, trade licence, shop act",
            "license registration"
          ]
        ],
        "syn": [
          "gst return",
          "ca",
          "accountant",
          "company registration",
          "auditor",
          "pf esi",
          "license registration"
        ],
        "types": [
          "Consultant / Professional",
          "Freelancer"
        ]
      },
      {
        "name": "Legal Services",
        "p": 1973,
        "r": 217,
        "on": true,
        "subs": [
          [
            "Contracts & agreements",
            134,
            "nda, vendor agreements, leases",
            "lawyer, agreement"
          ],
          [
            "Trademarks & IP",
            749,
            "trademark, patent, copyright",
            "trademark registration"
          ],
          [
            "Debt recovery",
            282,
            "legal notice, cheque bounce, msme samadhan",
            "recovery"
          ],
          [
            "Corporate legal",
            281,
            "roc, due diligence, shareholder",
            "corporate lawyer"
          ],
          [
            "Employment & labour law",
            527,
            "policies, posh, disputes",
            "labour law"
          ]
        ],
        "syn": [
          "lawyer",
          "agreement",
          "trademark registration",
          "recovery",
          "corporate lawyer",
          "labour law"
        ],
        "types": [
          "Consultant / Professional"
        ]
      },
      {
        "name": "Funding & Finance",
        "p": 1641,
        "r": 181,
        "on": true,
        "subs": [
          [
            "Business loans",
            77,
            "msme loan, working capital, od",
            "loan chahiye"
          ],
          [
            "Machinery & equipment finance",
            275,
            "leasing, emi",
            "machine loan"
          ],
          [
            "Investor fundraising",
            279,
            "pitch deck, angel, vc",
            "funding"
          ],
          [
            "Government subsidies",
            394,
            "pmegp, cgtmse, state schemes",
            "subsidy"
          ],
          [
            "Invoice discounting",
            616,
            "treds, factoring",
            "bill discounting"
          ]
        ],
        "syn": [
          "loan chahiye",
          "machine loan",
          "funding",
          "subsidy",
          "bill discounting"
        ],
        "types": [
          "Consultant / Professional",
          "Service provider"
        ]
      },
      {
        "name": "Insurance",
        "p": 1580,
        "r": 174,
        "on": true,
        "subs": [
          [
            "Business & fire insurance",
            207,
            "property, stock, fire",
            "factory insurance"
          ],
          [
            "Marine & transit insurance",
            770,
            "cargo, export",
            "transit insurance"
          ],
          [
            "Employee health insurance",
            446,
            "group health, gpa",
            "group insurance"
          ],
          [
            "Liability insurance",
            157,
            "product liability, d&o, cyber",
            "liability cover"
          ]
        ],
        "syn": [
          "factory insurance",
          "transit insurance",
          "group insurance",
          "liability cover"
        ],
        "types": [
          "Service provider",
          "Consultant / Professional"
        ]
      }
    ]
  },
  {
    "name": "People & Training",
    "open": false,
    "cats": [
      {
        "name": "HR & Staffing",
        "p": 2450,
        "r": 270,
        "on": true,
        "subs": [
          [
            "Contract staffing",
            356,
            "temporary staff, outsourcing",
            "manpower supply"
          ],
          [
            "Recruitment",
            527,
            "executive search, bulk hiring",
            "placement agency"
          ],
          [
            "Payroll outsourcing",
            456,
            "salary processing, compliance",
            "payroll"
          ],
          [
            "Background verification",
            759,
            "bgv, police verification",
            "employee verification"
          ],
          [
            "Blue-collar hiring",
            352,
            "drivers, helpers, telecallers",
            "workers chahiye"
          ]
        ],
        "syn": [
          "manpower supply",
          "placement agency",
          "payroll",
          "employee verification",
          "workers chahiye"
        ],
        "types": [
          "Service provider",
          "Consultant / Professional"
        ]
      },
      {
        "name": "Corporate Training",
        "p": 1457,
        "r": 160,
        "on": true,
        "subs": [
          [
            "Sales & soft skills",
            475,
            "communication, negotiation",
            "sales training"
          ],
          [
            "Technical training",
            548,
            "software, machinery, safety",
            "technical training"
          ],
          [
            "Leadership & coaching",
            360,
            "executive coaching, workshops",
            "business coach"
          ],
          [
            "Safety training",
            74,
            "fire, first aid, ehs",
            "safety training"
          ]
        ],
        "syn": [
          "sales training",
          "technical training",
          "business coach",
          "safety training"
        ],
        "types": [
          "Freelancer",
          "Consultant / Professional"
        ]
      },
      {
        "name": "Outsourcing & Back Office",
        "p": 1673,
        "r": 184,
        "on": true,
        "subs": [
          [
            "Call centre & telecalling",
            743,
            "inbound, outbound, lead calling",
            "telecaller"
          ],
          [
            "Virtual assistants",
            108,
            "admin support, scheduling",
            "virtual assistant"
          ],
          [
            "Customer support outsourcing",
            822,
            "chat, email support",
            "bpo"
          ]
        ],
        "syn": [
          "telecaller",
          "virtual assistant",
          "bpo"
        ],
        "types": [
          "Service provider",
          "Agency / Studio"
        ]
      }
    ]
  },
  {
    "name": "Agriculture & Food",
    "open": false,
    "cats": [
      {
        "name": "Food Processing",
        "p": 3237,
        "r": 356,
        "on": true,
        "subs": [
          [
            "Spices & masala",
            377,
            "blended masala, whole spices",
            "masala manufacturer"
          ],
          [
            "Ready-to-eat & snacks",
            827,
            "namkeen, chips, rte",
            "snacks manufacturer"
          ],
          [
            "Bakery & confectionery",
            379,
            "biscuits, cakes, chocolates",
            "bakery"
          ],
          [
            "Dairy products",
            426,
            "milk, paneer, ghee",
            "dairy supplier"
          ],
          [
            "Beverages",
            507,
            "juices, packaged water, soda",
            "drinking water"
          ],
          [
            "Edible oils & flour",
            721,
            "atta, besan, cold-pressed oil",
            "oil mill, atta chakki"
          ]
        ],
        "syn": [
          "masala manufacturer",
          "snacks manufacturer",
          "bakery",
          "dairy supplier",
          "drinking water",
          "oil mill",
          "atta chakki"
        ],
        "types": [
          "Manufacturer",
          "Exporter"
        ]
      },
      {
        "name": "Agri Produce & Inputs",
        "p": 1870,
        "r": 206,
        "on": true,
        "subs": [
          [
            "Fresh fruits & vegetables",
            264,
            "onion, potato, mango, export grade",
            "sabzi supplier"
          ],
          [
            "Grains & pulses",
            254,
            "rice, wheat, dal",
            "anaj, grain trader"
          ],
          [
            "Seeds & fertiliser",
            773,
            "hybrid seeds, organic manure",
            "khad, beej"
          ],
          [
            "Agrochemicals",
            152,
            "pesticides, bio-stimulants",
            "pesticide dealer"
          ],
          [
            "Organic produce",
            427,
            "certified organic, millets",
            "organic food"
          ]
        ],
        "syn": [
          "sabzi supplier",
          "anaj",
          "grain trader",
          "khad",
          "beej",
          "pesticide dealer",
          "organic food"
        ],
        "types": [
          "Trader / Distributor",
          "Exporter",
          "Manufacturer"
        ]
      },
      {
        "name": "Farm Equipment & Services",
        "p": 1262,
        "r": 139,
        "on": true,
        "subs": [
          [
            "Tractors & implements",
            436,
            "rotavator, harvester",
            "tractor"
          ],
          [
            "Drip & irrigation",
            287,
            "drip, sprinkler, polyhouse",
            "drip irrigation"
          ],
          [
            "Farm management",
            539,
            "contract farming, agronomy",
            "farming consultant"
          ]
        ],
        "syn": [
          "tractor",
          "drip irrigation",
          "farming consultant"
        ],
        "types": [
          "Trader / Distributor",
          "Service provider"
        ]
      },
      {
        "name": "Animal Husbandry & Fisheries",
        "p": 1754,
        "r": 193,
        "on": true,
        "subs": [
          [
            "Poultry",
            487,
            "broiler, layers, feed",
            "poultry farm"
          ],
          [
            "Cattle feed",
            437,
            "pellets, fodder",
            "pashu aahar"
          ],
          [
            "Fisheries & seafood",
            830,
            "shrimp, processing, export",
            "seafood export"
          ]
        ],
        "syn": [
          "poultry farm",
          "pashu aahar",
          "seafood export"
        ],
        "types": [
          "Manufacturer",
          "Trader / Distributor"
        ]
      },
      {
        "name": "Catering & Food Services",
        "p": 1543,
        "r": 170,
        "on": true,
        "subs": [
          [
            "Corporate catering",
            231,
            "canteen, meals, pantry",
            "office canteen"
          ],
          [
            "Event catering",
            622,
            "weddings, conferences",
            "caterer"
          ],
          [
            "Cloud kitchens",
            690,
            "bulk orders, tiffin",
            "tiffin service"
          ]
        ],
        "syn": [
          "office canteen",
          "caterer",
          "tiffin service"
        ],
        "types": [
          "Service provider"
        ]
      }
    ]
  },
  {
    "name": "Healthcare & Pharma",
    "open": false,
    "cats": [
      {
        "name": "Medical Equipment",
        "p": 1994,
        "r": 219,
        "on": true,
        "subs": [
          [
            "Diagnostic devices",
            170,
            "analysers, ecg, imaging",
            "medical machine"
          ],
          [
            "Hospital furniture",
            464,
            "beds, trolleys, stretchers",
            "hospital bed"
          ],
          [
            "Medical consumables",
            495,
            "gloves, syringes, ppe",
            "surgical items"
          ],
          [
            "Equipment maintenance",
            865,
            "biomedical service, amc",
            "biomedical engineer"
          ]
        ],
        "syn": [
          "medical machine",
          "hospital bed",
          "surgical items",
          "biomedical engineer"
        ],
        "types": [
          "Manufacturer",
          "Trader / Distributor",
          "Importer"
        ]
      },
      {
        "name": "Pharma Contract Manufacturing",
        "p": 2034,
        "r": 224,
        "on": true,
        "subs": [
          [
            "Tablets & capsules",
            893,
            "third-party, pcd pharma",
            "pcd franchise"
          ],
          [
            "Liquids & syrups",
            327,
            "oral liquids, suspensions",
            "syrup manufacturer"
          ],
          [
            "Nutraceuticals",
            135,
            "supplements, protein, vitamins",
            "nutraceutical"
          ],
          [
            "Ayurvedic & herbal",
            679,
            "ayush, churna, oils",
            "ayurvedic medicine"
          ]
        ],
        "syn": [
          "pcd franchise",
          "syrup manufacturer",
          "nutraceutical",
          "ayurvedic medicine"
        ],
        "types": [
          "Manufacturer"
        ]
      },
      {
        "name": "Healthcare Services",
        "p": 749,
        "r": 82,
        "on": true,
        "subs": [
          [
            "Corporate health checkups",
            115,
            "annual checkups, camps",
            "health camp"
          ],
          [
            "Diagnostic labs",
            154,
            "pathology, home collection",
            "lab test"
          ],
          [
            "Medical tourism",
            180,
            "treatment abroad, inbound patients",
            "medical tourism"
          ],
          [
            "Hospital consulting",
            300,
            "nabh, setup, operations",
            "hospital consultant"
          ]
        ],
        "syn": [
          "health camp",
          "lab test",
          "medical tourism",
          "hospital consultant"
        ],
        "types": [
          "Service provider",
          "Consultant / Professional"
        ]
      },
      {
        "name": "Regulatory & Clinical",
        "p": 1711,
        "r": 188,
        "on": true,
        "subs": [
          [
            "Drug licences & CDSCO",
            504,
            "manufacturing licence, import licence",
            "drug license"
          ],
          [
            "Clinical research",
            801,
            "cro, trials",
            "clinical trial"
          ],
          [
            "Medical device registration",
            406,
            "mdr, cdsco, ce",
            "device registration"
          ]
        ],
        "syn": [
          "drug license",
          "clinical trial",
          "device registration"
        ],
        "types": [
          "Consultant / Professional"
        ]
      }
    ]
  },
  {
    "name": "Chemicals & Materials",
    "open": false,
    "cats": [
      {
        "name": "Industrial Chemicals",
        "p": 2783,
        "r": 306,
        "on": true,
        "subs": [
          [
            "Solvents & acids",
            853,
            "ipa, acetone, sulphuric acid",
            "chemical supplier"
          ],
          [
            "Dyes & pigments",
            807,
            "reactive dyes, pigments",
            "dye manufacturer"
          ],
          [
            "Specialty chemicals",
            479,
            "additives, adhesives, resins",
            "speciality chemicals"
          ],
          [
            "Water treatment chemicals",
            644,
            "antiscalant, chlorine",
            "water chemicals"
          ]
        ],
        "syn": [
          "chemical supplier",
          "dye manufacturer",
          "speciality chemicals",
          "water chemicals"
        ],
        "types": [
          "Manufacturer",
          "Trader / Distributor",
          "Importer"
        ]
      },
      {
        "name": "Polymers & Plastics Raw Material",
        "p": 1529,
        "r": 168,
        "on": true,
        "subs": [
          [
            "Polymer granules",
            132,
            "pp, hdpe, ldpe, pet",
            "plastic dana"
          ],
          [
            "Recycled polymers",
            505,
            "reprocessed granules",
            "recycled plastic"
          ],
          [
            "Masterbatches",
            892,
            "colour, additive",
            "masterbatch"
          ]
        ],
        "syn": [
          "plastic dana",
          "recycled plastic",
          "masterbatch"
        ],
        "types": [
          "Trader / Distributor",
          "Importer"
        ]
      },
      {
        "name": "Paints, Coatings & Adhesives",
        "p": 955,
        "r": 105,
        "on": true,
        "subs": [
          [
            "Industrial coatings",
            192,
            "powder coating, epoxy",
            "powder coating"
          ],
          [
            "Adhesives & sealants",
            699,
            "hot melt, silicone",
            "gum, adhesive"
          ],
          [
            "Lubricants & oils",
            64,
            "industrial oils, grease",
            "lubricant"
          ]
        ],
        "syn": [
          "powder coating",
          "gum",
          "adhesive",
          "lubricant"
        ],
        "types": [
          "Manufacturer",
          "Trader / Distributor"
        ]
      },
      {
        "name": "Fertiliser & Agro Chemicals",
        "p": 1113,
        "r": 122,
        "on": true,
        "subs": [
          [
            "Bulk fertilisers",
            263,
            "npk, urea, dap",
            "fertiliser manufacturer"
          ],
          [
            "Bio products",
            850,
            "bio-fertiliser, bio-pesticide",
            "organic fertiliser"
          ]
        ],
        "syn": [
          "fertiliser manufacturer",
          "organic fertiliser"
        ],
        "types": [
          "Manufacturer"
        ]
      }
    ]
  },
  {
    "name": "Automotive & Transport Equipment",
    "open": false,
    "cats": [
      {
        "name": "Auto Components",
        "p": 1820,
        "r": 200,
        "on": true,
        "subs": [
          [
            "Engine & transmission parts",
            162,
            "gears, shafts, pistons",
            "auto parts"
          ],
          [
            "Body & sheet metal parts",
            783,
            "pressings, brackets",
            "press parts"
          ],
          [
            "Rubber & plastic auto parts",
            657,
            "bushes, hoses, trims",
            "auto rubber parts"
          ],
          [
            "Auto electricals",
            218,
            "wiring harness, lamps",
            "wiring harness"
          ]
        ],
        "syn": [
          "auto parts",
          "press parts",
          "auto rubber parts",
          "wiring harness"
        ],
        "types": [
          "Manufacturer",
          "OEM supplier",
          "Exporter"
        ]
      },
      {
        "name": "Vehicles & Dealers",
        "p": 1885,
        "r": 207,
        "on": true,
        "subs": [
          [
            "Commercial vehicles",
            816,
            "trucks, buses, three-wheelers",
            "truck dealer"
          ],
          [
            "Electric vehicles",
            276,
            "e-rickshaw, e-scooters, fleets",
            "ev dealer"
          ],
          [
            "Tyres & batteries",
            793,
            "tyre dealer, battery",
            "tyre supplier"
          ]
        ],
        "syn": [
          "truck dealer",
          "ev dealer",
          "tyre supplier"
        ],
        "types": [
          "Trader / Distributor"
        ]
      },
      {
        "name": "Automotive Services",
        "p": 1000,
        "r": 110,
        "on": true,
        "subs": [
          [
            "Fleet maintenance",
            176,
            "workshops, servicing",
            "vehicle repair"
          ],
          [
            "Body building",
            668,
            "truck bodies, containers",
            "body builder"
          ],
          [
            "Vehicle branding",
            156,
            "wraps, stickers",
            "vehicle branding"
          ]
        ],
        "syn": [
          "vehicle repair",
          "body builder",
          "vehicle branding"
        ],
        "types": [
          "Service provider"
        ]
      }
    ]
  },
  {
    "name": "Electronics & Electrical Products",
    "open": false,
    "cats": [
      {
        "name": "Electronics Manufacturing",
        "p": 505,
        "r": 56,
        "on": true,
        "subs": [
          [
            "PCB design & assembly",
            301,
            "smt, pcba, prototypes",
            "pcb"
          ],
          [
            "Box build & EMS",
            80,
            "contract electronics, testing",
            "ems"
          ],
          [
            "Embedded systems",
            124,
            "firmware, iot devices",
            "embedded developer"
          ]
        ],
        "syn": [
          "pcb",
          "ems",
          "embedded developer"
        ],
        "types": [
          "Manufacturer",
          "OEM supplier"
        ]
      },
      {
        "name": "Electrical Products",
        "p": 1617,
        "r": 178,
        "on": true,
        "subs": [
          [
            "Lighting",
            640,
            "led luminaires, panels",
            "lights supplier"
          ],
          [
            "Switches & wiring devices",
            81,
            "modular switches, mcb",
            "electrical shop"
          ],
          [
            "Fans, motors & appliances",
            401,
            "fans, coolers, motors",
            "fan manufacturer"
          ],
          [
            "Batteries & storage",
            495,
            "lithium packs, bms",
            "battery pack"
          ]
        ],
        "syn": [
          "lights supplier",
          "electrical shop",
          "fan manufacturer",
          "battery pack"
        ],
        "types": [
          "Manufacturer",
          "Trader / Distributor"
        ]
      },
      {
        "name": "Electronic Components",
        "p": 1967,
        "r": 216,
        "on": true,
        "subs": [
          [
            "Semiconductors & ICs",
            812,
            "microcontrollers, sensors",
            "components"
          ],
          [
            "Passive components",
            912,
            "resistors, capacitors, connectors",
            "electronic parts"
          ],
          [
            "Displays & modules",
            243,
            "lcd, led modules",
            "display module"
          ]
        ],
        "syn": [
          "components",
          "electronic parts",
          "display module"
        ],
        "types": [
          "Trader / Distributor",
          "Importer"
        ]
      }
    ]
  }
];
const INITIAL_SITE = {
  "sections": [
    {
      "k": "hero",
      "label": "Hero",
      "note": "Headline, subline and requirement box",
      "on": true,
      "lock": true,
      "tab": "hero"
    },
    {
      "k": "why",
      "label": "Why XPO",
      "note": "4 points under the hero",
      "on": true,
      "tab": "content"
    },
    {
      "k": "how",
      "label": "How it works",
      "note": "3 steps for each visitor",
      "on": true,
      "tab": "content"
    },
    {
      "k": "cats",
      "label": "Categories",
      "note": "Sector chips from Categories",
      "on": true,
      "tab": "settings"
    },
    {
      "k": "pricing",
      "label": "Start free",
      "note": "No prices shown publicly · plans appear inside the account",
      "on": true,
      "tab": "content"
    },
    {
      "k": "faq",
      "label": "FAQ",
      "note": "",
      "on": true,
      "tab": "faq"
    },
    {
      "k": "footer",
      "label": "Footer",
      "note": "Copyright line and links",
      "on": true,
      "lock": true,
      "tab": "footer"
    }
  ],
  "hero": {
    "client": {
      "l1": "Describe what you need.",
      "l2": "Verified partners reply fast.",
      "sub": "Post free. Choose who to talk to.",
      "ph": "e.g. 10,000 corrugated boxes in Pune",
      "cta": "Post free",
      "note": "Free to post · no commission"
    },
    "partner": {
      "l1": "Get matching client leads.",
      "l2": "Keep 100% of the deal.",
      "sub": "Pick your work once. Leads come to you.",
      "ph": "e.g. We make corrugated boxes in Pune",
      "cta": "Join free",
      "note": "Your first leads are free"
    }
  },
  "benefits": [
    {
      "t": "Zero commission",
      "d": "Deal directly"
    },
    {
      "t": "Private contacts",
      "d": "Shared only when both agree"
    },
    {
      "t": "Fast replies",
      "d": "5-minute response window"
    },
    {
      "t": "Verified partners",
      "d": "Documents checked by XPO"
    }
  ],
  "steps": {
    "client": [
      {
        "t": "Describe",
        "d": "One sentence. We structure it."
      },
      {
        "t": "Get replies",
        "d": "Matching partners say yes."
      },
      {
        "t": "Connect",
        "d": "Pick one and talk directly."
      }
    ],
    "partner": [
      {
        "t": "Set up",
        "d": "Your work, area and pitch."
      },
      {
        "t": "Say yes",
        "d": "Reply to leads in 5 minutes."
      },
      {
        "t": "Connect",
        "d": "Talk to the client directly."
      }
    ]
  },
  "faqs": [
    {
      "id": "f0",
      "q": "Is posting free?",
      "a": "Yes, always. Your first partner contacts are free too.",
      "on": true
    },
    {
      "id": "f1",
      "q": "When do partners pay?",
      "a": "Only when they say \"I'm interested\". Passing or missing a lead is free.",
      "on": true
    },
    {
      "id": "f2",
      "q": "Who sees my number?",
      "a": "No one, until both sides agree to connect.",
      "on": true
    },
    {
      "id": "f3",
      "q": "How do I pay?",
      "a": "Inside your account or right in WhatsApp: UPI, card, netbanking or PayPal. Outside India: PayPal.",
      "on": true
    },
    {
      "id": "f4",
      "q": "Can I use XPO from outside India?",
      "a": "Yes. Post and reply from anywhere, and pay with PayPal when you need a plan.",
      "on": true
    }
  ],
  "faqOpenFirst": true,
  "more": {
    "label": "Find more answers in our Help centre",
    "url": "/help"
  },
  "copy": "© 2026 XPO India. All rights reserved.",
  "about": "The B2B marketplace where clients describe what they need and verified partners (freelancers, agencies, manufacturers, exporters) reply within minutes.",
  "email": "[support email]",
  "phone": "[support phone]",
  "hours": "Mon–Sat, 9:00–19:00 IST",
  "links": [
    {
      "id": "l0",
      "label": "Terms of use",
      "url": "/terms",
      "on": true
    },
    {
      "id": "l1",
      "label": "Privacy policy",
      "url": "/privacy",
      "on": true
    },
    {
      "id": "l2",
      "label": "Refund policy",
      "url": "/refunds",
      "on": true
    },
    {
      "id": "l3",
      "label": "Contact support",
      "url": "/contact",
      "on": true
    }
  ],
  "seo": {
    "title": "XPO India — Post free, meet verified B2B partners",
    "desc": "Describe what you need in one sentence. Verified partners across India reply within minutes. Posting is free and there is no commission."
  }
};
const INITIAL_AUTO = {
  "hi": "80",
  "lo": "50",
  "maxQ": "4",
  "hold": "10",
  "exp": "30",
  "misses": "2",
  "hours": "Mon–Sat, 9:00–19:00 IST",
  "promise": "Within 30 minutes in coordinator hours",
  "quiet": "21:00–09:00 IST",
  "rate": "500",
  "retries": "3",
  "langs": [
    {
      "k": "English",
      "on": true
    },
    {
      "k": "Hindi",
      "on": true
    },
    {
      "k": "Hinglish",
      "on": true
    },
    {
      "k": "Marathi",
      "on": false
    },
    {
      "k": "Telugu",
      "on": false
    },
    {
      "k": "Tamil",
      "on": false
    }
  ],
  "journeys": {
    "partner": [
      {
        "title": "Welcome · ask what they do",
        "fields": [
          "Categories",
          "Tags",
          "Area"
        ],
        "text": "Welcome, {name}. Let's get you leads in about 2 minutes.\n\nIn one message, tell me what your business does and where you work.",
        "reply": "We build Shopify stores and Android apps. Mumbai, remote across India.",
        "how": "The reply is read by Smart mapping. Sure → step 2; unsure → one follow-up question."
      },
      {
        "title": "Confirm the match",
        "fields": [
          "Categories"
        ],
        "text": "Here's how clients will find you: [match]\n\nTo change anything, just type it.",
        "reply": "Looks right",
        "how": "[match] is filled in by Smart mapping. Typed changes are understood without restarting."
      },
      {
        "title": "Business name and GSTIN",
        "fields": [
          "Business",
          "GSTIN"
        ],
        "skip": true,
        "text": "What's your business name and GSTIN? GST-registered partners get the Verified badge. No GSTIN? Just send the name.",
        "reply": "Klo Tech, 27AABCK4521M1Z3",
        "how": "GSTIN is checked with the GST portal. Mismatches go to Members › KYC queue."
      },
      {
        "title": "Pitch line",
        "fields": [
          "Pitch"
        ],
        "text": "Last: the line clients see when you say yes. I drafted one from what you told me: [draft]\n\nUse it, or type your own.",
        "reply": "Use this line",
        "how": "[draft] is written from their own words, up to 140 characters."
      },
      {
        "title": "Live",
        "fields": [],
        "text": "You're live ✓ Leads arrive here and stay open for 5 minutes. First {free} applications are free.",
        "how": "Plan price is added from Plans."
      }
    ],
    "client": [
      {
        "title": "Welcome · confirm details",
        "fields": [
          "Name",
          "Business",
          "City"
        ],
        "skip": true,
        "text": "Welcome, {name}. I have you as {business}, {city}. Tell me what you need in one message — what, where, by when, and budget if you know it.",
        "reply": "E-commerce site for our 5 stores, 2 lakh, within a month",
        "how": "Known details come from the upload; only missing ones are asked."
      },
      {
        "title": "Draft the requirement",
        "fields": [
          "Title",
          "Category",
          "Timeline",
          "Budget"
        ],
        "text": "[summary]\n\nPost it? To change anything, just type it.",
        "reply": "Post free",
        "how": "[summary] is built by Smart mapping; timeline is mapped to the 4 official options."
      },
      {
        "title": "Posted",
        "fields": [],
        "text": "Posted ✓ [code]. Sent to 3 matching partners. I'll message you here.",
        "how": "Matching starts at once with the wave settings in Settings › Matching."
      }
    ]
  },
  "tpls": [
    {
      "name": "xpo_client_invite_v1",
      "cat": "Marketing",
      "st": "Approved",
      "sent": "1,284",
      "read": "71%",
      "tap": "38%"
    },
    {
      "name": "xpo_partner_invite_v1",
      "cat": "Marketing",
      "st": "Approved",
      "sent": "2,836",
      "read": "68%",
      "tap": "44%"
    },
    {
      "name": "xpo_partner_lead_offer_v1",
      "cat": "Utility",
      "st": "Approved",
      "sent": "11,902",
      "read": "93%",
      "tap": "52%"
    },
    {
      "name": "xpo_client_partner_interested_v2",
      "cat": "Utility",
      "st": "Approved",
      "sent": "6,410",
      "read": "95%",
      "tap": "61%"
    },
    {
      "name": "xpo_mutual_connection_consent_v1",
      "cat": "Utility",
      "st": "Approved",
      "sent": "2,207",
      "read": "96%",
      "tap": "83%"
    },
    {
      "name": "xpo_subscription_upgrade_v1",
      "cat": "Utility",
      "st": "In review",
      "sent": "—",
      "read": "—",
      "tap": "—"
    }
  ],
  "follows": [
    {
      "name": "Partner setup not finished",
      "when": "They stopped mid-onboarding",
      "wait": "24 h",
      "on": true,
      "sent": "612",
      "res": "41%",
      "resWord": "finished"
    },
    {
      "name": "Requirement draft not posted",
      "when": "Client saw the draft but didn't post",
      "wait": "1 h",
      "on": true,
      "sent": "208",
      "res": "57%",
      "resWord": "posted"
    },
    {
      "name": "Connection not accepted",
      "when": "A client asked to connect; the partner hasn't answered",
      "wait": "2 h",
      "on": true,
      "sent": "340",
      "res": "66%",
      "resWord": "accepted"
    },
    {
      "name": "Payment started, not finished",
      "when": "They opened the payment but didn't pay",
      "wait": "15 min",
      "on": true,
      "sent": "118",
      "res": "38%",
      "resWord": "paid"
    },
    {
      "name": "No match yet",
      "when": "Every matching partner was tried",
      "wait": "After last wave",
      "on": true,
      "sent": "96",
      "res": "47%",
      "resWord": "widened"
    },
    {
      "name": "Quiet partner",
      "when": "No reply to 5 leads in a row",
      "wait": "7 d",
      "on": false,
      "sent": "—",
      "res": "—",
      "resWord": "came back"
    }
  ],
  "smart": [
    {
      "t": "Voice notes",
      "d": "Understand voice notes in Hindi, English and Hinglish and turn them into requirements or lead replies",
      "on": true
    },
    {
      "t": "Photos and documents",
      "d": "Read sample photos, spec sheets and catalogues; unsure details are marked \"please confirm\"",
      "on": true
    },
    {
      "t": "Compare as cards",
      "d": "Batch partner replies for 2 minutes into one swipeable card message",
      "on": true
    },
    {
      "t": "One-tap sign-in links",
      "d": "Links in chat open the exact app screen, signed in, for 15 minutes, single use",
      "on": true
    },
    {
      "t": "No double pings",
      "d": "Send each alert where the person is active; clear it everywhere once read",
      "on": true
    },
    {
      "t": "Evening digest",
      "d": "Bundle low-priority updates into one message at 7 pm",
      "on": true
    },
    {
      "t": "Tailored pitches",
      "d": "Draft a pitch for each lead from the partner's profile and past wins",
      "on": true
    },
    {
      "t": "Deal check-in",
      "d": "Ask the client 3 days after connecting; close the request and collect a rating",
      "on": true
    }
  ],
  "keys": [
    {
      "w": "MENU",
      "does": "Shows what they can do",
      "reply": "Post a requirement · My requests · Plan · Talk to a person",
      "on": true,
      "lock": false
    },
    {
      "w": "SUPPORT",
      "does": "Hands the chat to a coordinator",
      "reply": "Connecting you to an XPO coordinator. Usual reply: within 30 minutes.",
      "on": true,
      "lock": false
    },
    {
      "w": "DONE",
      "does": "Closes the open requirement",
      "reply": "Closed. Partners have been told. Need something else? Just type it.",
      "on": true,
      "lock": false
    },
    {
      "w": "STOP",
      "does": "Opts out (required by WhatsApp)",
      "reply": "You're unsubscribed. Reply START any time.",
      "on": true,
      "lock": true
    },
    {
      "w": "START",
      "does": "Opts back in",
      "reply": "Welcome back. Everything is as you left it.",
      "on": true,
      "lock": true
    }
  ]
};

function ds(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return days + 'd ago';
  if (days < 30) return Math.floor(days / 7) + 'w ago';
  return Math.floor(days / 30) + 'mo ago';
}

function _F(n: number): string {
  return n.toLocaleString('en-IN');
}

function generateBaselineData(scale = 0.01) {
  let a = 20261102;
  const rnd = () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  function pick<T>(arr: T[]): T { return arr[Math.floor(rnd() * arr.length)]; }
  function wp<T>(pairs: [T, number][]): T {
    const x = rnd();
    let acc = 0;
    for (const p of pairs) {
      acc += p[1];
      if (x < acc) return p[0];
    }
    return pairs[pairs.length - 1][0];
  }

  const FIRST = ['Rahul', 'Anita', 'Pavan', 'Priya', 'Arjun', 'Sneha', 'Vikram', 'Kavya', 'Rohan', 'Meera', 'Aditya', 'Divya', 'Karan', 'Isha', 'Nikhil', 'Pooja', 'Sanjay', 'Neha'];
  const LAST = ['Mehta', 'Rao', 'Sharma', 'Iyer', 'Reddy', 'Patel', 'Nair', 'Gupta', 'Khan', 'Das', 'Joshi', 'Menon', 'Kulkarni', 'Singh'];
  const BA = ['Shree', 'Klo', 'Nova', 'Pixel', 'Vertex', 'Srujan', 'Apex', 'Blue Lotus', 'Sai', 'Prism', 'Zenith', 'Orbit', 'Indus', 'Coastal'];
  const BB = ['Packaging', 'Tech', 'Digital', 'Studio', 'CNC Works', 'Solar', 'Media', 'Traders', 'Logistics', 'Labs', 'Consulting', 'Foods'];
  const IN_CITIES = ['Mumbai', 'Bengaluru', 'Delhi', 'Pune', 'Hyderabad', 'Chennai', 'Ahmedabad', 'Kolkata', 'Jaipur', 'Kochi', 'Indore'];

  const CATS = [
    'Web & Mobile Development',
    'Industrial Packaging & Raw Materials',
    'Performance Marketing & SEO',
    'Solar & Electrical EPC',
    'Accounting & Compliance',
    'Enterprise Software & ERP',
    'Commercial Video & Photography',
    'Precision CNC Machining & Sheet Metal',
    'Interior Fit-Out & Turnkey Contracting',
    'Freight Forwarding & Customs Clearance',
  ];

  const nContacts = Math.max(120, Math.round(18000 * scale));
  const contacts: ContactItem[] = [];
  for (let i = 0; i < nContacts; i++) {
    const role = (wp([['Partner', 0.65], ['Client', 0.35]]) as 'Partner' | 'Client');
    const name = pick(FIRST) + ' ' + pick(LAST);
    const city = pick(IN_CITIES);
    const cat = pick(CATS);
    const cons = (wp([['Opted in', 0.88], ['Missing', 0.12]]) as 'Opted in' | 'Missing');
    const stage = (wp([['Uploaded', 0.3], ['Invited', 0.25], ['Registered', 0.45]]) as 'Uploaded' | 'Invited' | 'Registered');
    const phone = '+91 9' + String(Math.floor(rnd() * 900 + 100)) + '•••• ••' + String(Math.floor(rnd() * 90 + 10));
    const d = Math.floor(rnd() * 30);
    const id = 'C' + (200000 + i);
    contacts.push({
      id,
      name,
      role,
      city,
      country: 'India',
      phone,
      cat,
      cons,
      stage,
      batch: 'batch_' + (i % 4 + 1) + '.xlsx',
      d,
      _s: (name + ' ' + id + ' ' + city + ' ' + cat).toLowerCase(),
    });
  }

  const nMembers = Math.max(45, Math.round(6200 * scale));
  const members: MemberItem[] = [];
  for (let i = 0; i < nMembers; i++) {
    const role = (wp([['Partner', 0.68], ['Client', 0.32]]) as 'Partner' | 'Client');
    const comp = pick(BA) + ' ' + pick(BB);
    const name = comp + ' · ' + pick(FIRST) + ' ' + pick(LAST);
    const city = pick(IN_CITIES);
    const cat = pick(CATS);
    const kyc = (wp([['Verified', 0.75], ['In review', 0.15], ['Pending', 0.1]]) as 'Verified' | 'In review' | 'Pending');
    const plan = role === 'Partner' ? (wp([['Free', 0.4], ['Partner Pro', 0.6]]) as string) : (wp([['Free', 0.55], ['Client Plus', 0.45]]) as string);
    const phone = '+91 9' + String(Math.floor(rnd() * 900 + 100)) + '•••• ••' + String(Math.floor(rnd() * 90 + 10));
    const email = comp.toLowerCase().replace(/\s+/g, '') + '@example.com';
    const d = Math.floor(rnd() * 60);
    const last = Math.floor(rnd() * 10);
    const id = 'M' + (50000 + i);
    members.push({
      id,
      name,
      role,
      city,
      country: 'India',
      phone,
      email,
      cat,
      kyc,
      plan,
      used: Math.floor(rnd() * 15),
      cap: plan === 'Free' ? (role === 'Partner' ? 3 : 5) : 30,
      d,
      last,
      st: i % 25 === 7 ? 'Paused' : 'Active',
      _s: (name + ' ' + id + ' ' + city + ' ' + cat).toLowerCase(),
    });
  }

  members[0] = {
    id: 'M50001',
    name: 'Shree Packaging · Mahesh Kulkarni',
    role: 'Partner',
    city: 'Pune',
    country: 'India',
    phone: '+91 98220•••• ••14',
    email: 'shreepack@example.com',
    cat: 'Industrial Packaging & Raw Materials',
    kyc: 'In review',
    plan: 'Partner Pro',
    used: 2,
    cap: 50,
    d: 3,
    last: 0,
    st: 'Active',
    _s: 'shree packaging mahesh kulkarni pune industrial packaging',
  };

  const nReqs = Math.max(30, Math.round(3900 * scale));
  const reqs: ReqItem[] = [];
  const REQ_TEMPLATES = [
    { title: '10,000 printed 3-ply corrugated boxes', cat: 'Industrial Packaging & Raw Materials', budget: 'Quotes invited', budgetN: 0, city: 'Pune' },
    { title: 'E-commerce website for a 5-store retail chain', cat: 'Web & Mobile Development', budget: '₹2,00,000', budgetN: 200000, city: 'Hyderabad' },
    { title: '50 kW rooftop solar for a warehouse', cat: 'Solar & Electrical EPC', budget: '₹25,00,000', budgetN: 2500000, city: 'Nagpur' },
    { title: 'Custom CRM setup for 40 sales reps', cat: 'Enterprise Software & ERP', budget: '₹4,50,000', budgetN: 450000, city: 'Bengaluru' },
    { title: 'GST annual audit & transfer pricing filing', cat: 'Accounting & Compliance', budget: '₹75,000', budgetN: 75000, city: 'Mumbai' },
    { title: 'Product explainer video with 3D animation', cat: 'Commercial Video & Photography', budget: '₹1,50,000', budgetN: 150000, city: 'Delhi' },
  ];

  for (let i = 0; i < nReqs; i++) {
    const tmpl = pick(REQ_TEMPLATES);
    const client = pick(BA) + ' ' + pick(BB);
    const st = (wp([
      ['live', 0.45],
      ['done', 0.3],
      ['nomatch', 0.1],
      ['closed', 0.1],
      ['held', 0.05],
    ]) as 'held' | 'live' | 'nomatch' | 'done' | 'closed');
    const d = Math.floor(rnd() * 20);
    const wave = st === 'live' ? Math.floor(rnd() * 3) + 1 : (st === 'done' ? 1 : 3);
    const interested = st === 'done' ? 3 : (st === 'live' ? Math.floor(rnd() * 3) : 0);
    const code = 'XPO-REQ-' + (40000 + i);
    reqs.push({
      id: 'R' + i,
      code,
      client,
      title: tmpl.title,
      cat: tmpl.cat,
      city: tmpl.city,
      country: 'India',
      tl: 'Within 2-4 Weeks',
      budget: tmpl.budget,
      budgetN: tmpl.budgetN,
      st,
      d,
      wave,
      interested,
      offered: wave * 3,
      _s: (code + ' ' + client + ' ' + tmpl.title + ' ' + tmpl.city).toLowerCase(),
    });
  }

  reqs[0] = {
    id: 'R0',
    code: 'XPO-REQ-41190',
    client: 'Nova Media · Pavan',
    title: 'Marketing for a fantasy sports and betting app',
    cat: 'Performance Marketing & SEO',
    city: 'Bengaluru',
    country: 'India',
    tl: 'Immediate (Within 7 Days)',
    budget: '₹5,00,000',
    budgetN: 500000,
    st: 'held',
    d: 0,
    wave: 1,
    interested: 0,
    offered: 3,
    keyword: 'betting',
    _s: 'xpo-req-41190 nova media pavan marketing fantasy sports betting bengaluru',
  };

  const nPays = Math.max(60, Math.round(9800 * scale));
  const pays: PaymentItem[] = [];
  for (let i = 0; i < nPays; i++) {
    const m = pick(members);
    const plan = m.role === 'Partner' ? 'Partner Pro Monthly' : 'Client Plus Monthly';
    const gw = (wp([
      ['UPI AutoPay', 0.45],
      ['Razorpay card', 0.35],
      ['PayPal', 0.12],
      ['Stripe', 0.08],
    ]) as 'Razorpay card' | 'UPI AutoPay' | 'PayPal' | 'Stripe');
    const st = (i % 28 === 7 ? 'Failed' : (i % 39 === 5 ? 'Refunded' : 'Captured')) as 'Captured' | 'Failed' | 'Refunded';
    const amt = m.role === 'Partner' ? 999 : 299;
    const gst = Number((amt * 0.18).toFixed(2));
    const d = Math.floor(rnd() * 30);
    const tm = String(10 + (i % 10)) + ':' + String(10 + (i % 50));
    pays.push({
      id: 'PAY-' + (80000 + i),
      who: m.name,
      role: m.role,
      plan,
      amt,
      gst,
      gw,
      st,
      d,
      tm,
      cur: '₹',
      region: 'India',
      _s: (m.name + ' pay-' + (80000 + i) + ' ' + plan + ' ' + gw).toLowerCase(),
    });
  }

  const convos: ConvoItem[] = members.map((m, i) => {
    const st = i === 3 ? 'SUPPORT_REVIEW' : (i % 12 === 2 ? 'OFFER_SENT' : (i % 9 === 1 ? 'ONBOARDING' : 'ACTIVE'));
    const lastMsg = st === 'SUPPORT_REVIEW'
      ? 'Can I add a second store location?'
      : (st === 'OFFER_SENT' ? 'Lead offer · 5 minutes to reply' : (st === 'ONBOARDING' ? 'What does your business do?' : 'You are live. Leads will arrive here.'));
    return {
      id: 'W' + (70000 + i),
      name: m.name,
      role: m.role,
      phone: m.phone,
      st,
      lang: i % 4 === 0 ? 'Hinglish' : (i % 7 === 0 ? 'Hindi' : 'English'),
      mins: i === 3 ? 6 : (i * 18 + 5),
      paused: i === 3,
      last: lastMsg,
      d: Math.floor(i / 3),
      _s: (m.name + ' w' + (70000 + i) + ' ' + st + ' ' + m.phone).toLowerCase(),
    };
  });

  const subs: SubItem[] = members.filter((m) => m.plan !== 'Free').map((m, i) => {
    const st = (i % 14 === 3 ? 'Renewal failed' : (i % 20 === 5 ? 'Cancelling' : 'Active')) as 'Active' | 'Renewal failed' | 'Cancelling' | 'Expired';
    const price = m.role === 'Partner' ? 999 : 299;
    return {
      id: 'S' + (30000 + i),
      name: m.name,
      role: m.role,
      plan: m.plan,
      region: 'India',
      zone: 'India',
      price,
      cur: '₹',
      d: i * 7 + 2,
      renew: (i * 3) % 28 + 1,
      used: m.used,
      st,
      pay: i % 3 === 0 ? 'UPI AutoPay' : 'Razorpay card',
      _s: (m.name + ' s' + (30000 + i) + ' ' + m.plan).toLowerCase(),
    };
  });

  return { contacts, members, reqs, pays, convos, subs };
}

export function XpoSuperadminApp() {
  const router = useRouter();
  const { signOut } = useAuth();

  const [db, setDb] = useState(() => generateBaselineData(0.01));
  const [tax, _setTax] = useState<SectorItem[]>(INITIAL_TAXONOMY);
  const [site, setSite] = useState(INITIAL_SITE);
  const [siteHist, setSiteHist] = useState([
    { w: '2 Nov, 18:40', who: 'XPO Superadmin', what: 'Added FAQ on overseas use' },
    { w: '28 Oct, 11:05', who: 'XPO Superadmin', what: 'New hero copy for partners' },
  ]);
  const [auto, setAuto] = useState(INITIAL_AUTO);
  const [autoPaused, setAutoPaused] = useState(false);
  const [screen, setScreen] = useState<SuperadminScreen>('home');
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [protoOpen, setProtoOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Table view / filter states
  const [q, setQ] = useState('');
  const [viewTab, setViewTab] = useState<Record<string, string>>({
    reqs: 'all',
    contacts: 'all',
    members: 'all',
    money: 'all',
    plans: 'india',
    cats: 'tree',
    auto: 'over',
    site: 'sections',
    settings: 'match',
  });
  const [filterCity, setFilterCity] = useState('');
  const [filterCat, setFilterCat] = useState('');

  // Selection & Drawer states
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [allSel, setAllSel] = useState(false);
  const [dr, setDr] = useState<{ type: string; item: any } | null>(null);

  // Modals
  const [up, setUp] = useState<number>(0); // 0 = closed, 1 = pick, 2 = review
  const [upRole, setUpRole] = useState<'Partner' | 'Client'>('Partner');
  const [inviteModal, setInviteModal] = useState(false);
  const [selectedMetaTpl, setSelectedMetaTpl] = useState('partner_invitation');

  // Simulator state
  const [simText, setSimText] = useState('hum corrugated box aur mono carton banate hai, Chakan Pune');
  const [simResult, setSimResult] = useState<{ cat: string; role: string; city: string; confidence: number } | null>(null);

  // Categories selection
  const [selectedSectorIdx, setSelectedSectorIdx] = useState(0);
  const [selectedCatIdx, setSelectedCatIdx] = useState(0);

  // Audit log
  const [auditLog, setAuditLog] = useState([
    { ts: 'Today, 11:42', op: 'Pavan (Superadmin)', act: 'Reviewed XPO-REQ-40971 wave 2', cat: 'Moderation' },
    { ts: 'Today, 10:18', op: 'Pavan (Superadmin)', act: 'Opened KYC review for Shree Packaging', cat: 'Members' },
    { ts: 'Today, 09:12', op: 'System Automations', act: 'Held XPO-REQ-41190 on keyword "betting"', cat: 'Safety' },
    { ts: 'Yesterday, 17:05', op: 'Pavan (Superadmin)', act: 'Exported 185 contacts to CSV', cat: 'Contacts' },
    { ts: '28 Oct, 14:20', op: 'Pavan (Superadmin)', act: 'Updated Partner Pro pricing in INR', cat: 'Billing' },
  ]);

  const toast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const logAudit = (act: string, cat: string) => {
    setAuditLog((prev) => [{ ts: 'Just now', op: 'Pavan (Superadmin)', act, cat }, ...prev]);
  };

  // Close menus on outside click
  const handleWrapperClick = () => {
    if (menuOpen) setMenuOpen(false);
  };

  // Top nav item counts
  const heldCount = useMemo(() => db.reqs.filter((r) => r.st === 'held').length, [db.reqs]);
  const kycCount = useMemo(() => db.members.filter((m) => m.kyc === 'In review').length, [db.members]);
  const failedPayCount = useMemo(() => db.pays.filter((p) => p.st === 'Failed').length, [db.pays]);
  const supportConvoCount = useMemo(() => db.convos.filter((c) => c.st === 'SUPPORT_REVIEW').length, [db.convos]);

  // Handle drawer action
  const openItemDrawer = (type: string, item: any) => {
    setDr({ type, item });
  };

  // Run intent simulator
  const runSimulator = (textToTest: string) => {
    const lower = textToTest.toLowerCase();
    let cat = 'General B2B Requirements';
    if (lower.includes('box') || lower.includes('packaging') || lower.includes('carton')) cat = 'Industrial Packaging & Raw Materials';
    else if (lower.includes('web') || lower.includes('app') || lower.includes('software')) cat = 'Web & Mobile Development';
    else if (lower.includes('solar') || lower.includes('epc') || lower.includes('rooftop')) cat = 'Solar & Electrical EPC';
    else if (lower.includes('marketing') || lower.includes('seo') || lower.includes('leads')) cat = 'Performance Marketing & SEO';
    else if (lower.includes('cnc') || lower.includes('metal') || lower.includes('machining')) cat = 'Precision CNC Machining & Sheet Metal';

    const city = lower.includes('pune') ? 'Pune' : (lower.includes('mumbai') ? 'Mumbai' : (lower.includes('bengaluru') ? 'Bengaluru' : (lower.includes('hyderabad') ? 'Hyderabad' : 'All-India')));
    const role = lower.includes('banate') || lower.includes('manufacture') || lower.includes('service') || lower.includes('provide') ? 'Partner' : 'Client';

    setSimResult({ cat, role, city, confidence: 96 });
  };

  return (
    <div
      className={`xt ${dark ? 'dark' : ''} shell`}
      onClick={handleWrapperClick}
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", position: 'relative' }}
    >
      {/* ===================== SIDEBAR ===================== */}
      <aside className="side" style={{ background: 'var(--band)', color: '#fff', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', minHeight: 44 }}>
          <button
            type="button"
            onClick={() => { setScreen('home'); setDr(null); }}
            aria-label="XPO Admin home"
            style={{ display: 'flex', alignItems: 'center', gap: 10, border: 0, background: 'none', cursor: 'pointer', color: '#fff', padding: 0 }}
          >
            <img src="/xpo-logo.png" alt="XPO India" style={{ height: 26, width: 'auto', display: 'block' }} />
          </button>
          <span className="chip" style={{ background: '#2E3138', color: '#E6E7EA', fontSize: 11, fontWeight: 800 }}>SUPERADMIN</span>
        </div>

        <nav aria-label="Admin Navigation" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Section: Operate */}
          <span className="navh">Operate</span>
          <button
            type="button"
            className="nav"
            aria-current={screen === 'home' ? 'page' : undefined}
            onClick={() => { setScreen('home'); setDr(null); }}
            style={{ background: screen === 'home' ? '#2E3138' : 'transparent', color: screen === 'home' ? '#fff' : '#C9CBD1' }}
          >
            <span>Today</span>
            {heldCount + kycCount + failedPayCount > 0 && (
              <span className="chip" style={{ background: '#C8102E', color: '#fff' }}>
                {heldCount + kycCount + failedPayCount}
              </span>
            )}
          </button>
          <button
            type="button"
            className="nav"
            aria-current={screen === 'reqs' ? 'page' : undefined}
            onClick={() => { setScreen('reqs'); setDr(null); }}
            style={{ background: screen === 'reqs' ? '#2E3138' : 'transparent', color: screen === 'reqs' ? '#fff' : '#C9CBD1' }}
          >
            <span>Requirements</span>
            {heldCount > 0 && (
              <span className="chip" style={{ background: '#C8102E', color: '#fff' }}>
                {heldCount} held
              </span>
            )}
          </button>
          <button
            type="button"
            className="nav"
            aria-current={screen === 'contacts' ? 'page' : undefined}
            onClick={() => { setScreen('contacts'); setDr(null); }}
            style={{ background: screen === 'contacts' ? '#2E3138' : 'transparent', color: screen === 'contacts' ? '#fff' : '#C9CBD1' }}
          >
            <span>Contacts</span>
            <span style={{ fontSize: 12, color: '#8A8E97' }}>{db.contacts.length}</span>
          </button>
          <button
            type="button"
            className="nav"
            aria-current={screen === 'members' ? 'page' : undefined}
            onClick={() => { setScreen('members'); setDr(null); }}
            style={{ background: screen === 'members' ? '#2E3138' : 'transparent', color: screen === 'members' ? '#fff' : '#C9CBD1' }}
          >
            <span>Members</span>
            {kycCount > 0 && (
              <span className="chip" style={{ background: '#1F5FBF', color: '#fff' }}>
                {kycCount} KYC
              </span>
            )}
          </button>

          {/* Section: Revenue */}
          <span className="navh" style={{ marginTop: 8 }}>Revenue</span>
          <button
            type="button"
            className="nav"
            aria-current={screen === 'money' ? 'page' : undefined}
            onClick={() => { setScreen('money'); setDr(null); }}
            style={{ background: screen === 'money' ? '#2E3138' : 'transparent', color: screen === 'money' ? '#fff' : '#C9CBD1' }}
          >
            <span>Money</span>
            {failedPayCount > 0 && (
              <span className="chip" style={{ background: '#8E0B20', color: '#fff' }}>
                {failedPayCount} failed
              </span>
            )}
          </button>
          <button
            type="button"
            className="nav"
            aria-current={screen === 'plans' ? 'page' : undefined}
            onClick={() => { setScreen('plans'); setDr(null); }}
            style={{ background: screen === 'plans' ? '#2E3138' : 'transparent', color: screen === 'plans' ? '#fff' : '#C9CBD1' }}
          >
            <span>Plans &amp; Subscriptions</span>
            <span style={{ fontSize: 12, color: '#8A8E97' }}>₹299 / ₹999</span>
          </button>

          {/* Section: Platform */}
          <span className="navh" style={{ marginTop: 8 }}>Platform</span>
          <button
            type="button"
            className="nav"
            aria-current={screen === 'cats' ? 'page' : undefined}
            onClick={() => { setScreen('cats'); setDr(null); }}
            style={{ background: screen === 'cats' ? '#2E3138' : 'transparent', color: screen === 'cats' ? '#fff' : '#C9CBD1' }}
          >
            <span>Categories</span>
            <span style={{ fontSize: 12, color: '#8A8E97' }}>25 sectors</span>
          </button>
          <button
            type="button"
            className="nav"
            aria-current={screen === 'auto' ? 'page' : undefined}
            onClick={() => { setScreen('auto'); setDr(null); }}
            style={{ background: screen === 'auto' ? '#2E3138' : 'transparent', color: screen === 'auto' ? '#fff' : '#C9CBD1' }}
          >
            <span>Automation</span>
            {supportConvoCount > 0 && (
              <span className="chip" style={{ background: '#C8102E', color: '#fff' }}>
                {supportConvoCount}
              </span>
            )}
          </button>
          <button
            type="button"
            className="nav"
            aria-current={screen === 'site' ? 'page' : undefined}
            onClick={() => { setScreen('site'); setDr(null); }}
            style={{ background: screen === 'site' ? '#2E3138' : 'transparent', color: screen === 'site' ? '#fff' : '#C9CBD1' }}
          >
            <span>Website CMS</span>
          </button>
          <button
            type="button"
            className="nav"
            aria-current={screen === 'settings' ? 'page' : undefined}
            onClick={() => { setScreen('settings'); setDr(null); }}
            style={{ background: screen === 'settings' ? '#2E3138' : 'transparent', color: screen === 'settings' ? '#fff' : '#C9CBD1' }}
          >
            <span>Settings</span>
          </button>
        </nav>

        {/* Workspace switch footer */}
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
          <span style={{ color: '#8A8E97', fontWeight: 700, textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '0.08em' }}>Switch Workspace</span>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/dashboard/client" style={{ color: '#9FC1FF', textDecoration: 'none', fontWeight: 700 }}>Client app →</Link>
            <Link href="/dashboard/partner" style={{ color: '#9FC1FF', textDecoration: 'none', fontWeight: 700 }}>Partner app →</Link>
          </div>
        </div>
      </aside>

      {/* ===================== MAIN CONTENT AREA ===================== */}
      <div className="col">
        {/* Top Header */}
        <header className="top" onClick={(e) => e.stopPropagation()}>
          <div className="crumb fx" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
            <span style={{ color: 'var(--tx2)', cursor: 'pointer' }} onClick={() => setScreen('home')}>Superadmin</span>
            <span style={{ color: 'var(--tx3)' }}>/</span>
            <b style={{ color: 'var(--tx)', textTransform: 'capitalize' }}>
              {screen === 'home' ? 'Today' : (screen === 'reqs' ? 'Requirements' : (screen === 'cats' ? 'Categories' : (screen === 'auto' ? 'Automation' : (screen === 'site' ? 'Website CMS' : screen))))}
            </b>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            {/* Quick action buttons depending on screen */}
            {screen === 'contacts' && (
              <button type="button" className="btn b2" onClick={() => setUp(1)}>
                Upload Excel
              </button>
            )}
            {screen === 'cats' && (
              <button type="button" className="btn b2" onClick={() => toast('Taxonomy template downloaded')}>
                Download template
              </button>
            )}
            {screen === 'site' && (
              <button type="button" className="btn b1" onClick={() => {
                setSiteHist((prev) => [{ w: 'Just now', who: 'Pavan (Superadmin)', what: 'Published updates' }, ...prev]);
                toast('Published · xpoindia.com updated');
                logAudit('Published landing page updates', 'Website');
              }}>
                Publish
              </button>
            )}

            {/* Notifications Button */}
            <button
              type="button"
              className="ib"
              aria-label="Notifications"
              onClick={() => toast('Review queue has 5 items needing operator input')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span className="dot">5</span>
            </button>

            {/* Superadmin Menu Button */}
            <button
              type="button"
              className="av"
              aria-label="Superadmin Menu"
              onClick={() => setMenuOpen((m) => !m)}
            >
              SA
            </button>

            {/* Profile Dropdown */}
            {menuOpen && (
              <div className="menu" role="menu" aria-label="Account">
                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--ln)', marginBottom: 6 }}>
                  <b style={{ fontSize: 15, display: 'block' }}>Pavan (Superadmin)</b>
                  <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>XPO India · Marketplace Operations</span>
                </div>
                <button type="button" className="mi" onClick={() => { setScreen('home'); setMenuOpen(false); }}>
                  <span>Review queue &amp; overview</span>
                </button>
                <button type="button" className="mi" onClick={() => { setScreen('members'); setMenuOpen(false); }}>
                  <span>Verification &amp; moderation</span>
                  <span className="chip g">Active</span>
                </button>
                <button type="button" className="mi" onClick={() => { setScreen('plans'); setMenuOpen(false); }}>
                  <span>Account &amp; Plans</span>
                  <span className="chip">₹299 / ₹999</span>
                </button>
                <button type="button" className="mi" onClick={() => { setScreen('settings'); setMenuOpen(false); }}>
                  <span>Settings &amp; wave rules</span>
                </button>
                <button type="button" className="mi" onClick={() => { setDark((d) => !d); setMenuOpen(false); }}>
                  <span>{dark ? 'Light mode' : 'Dark mode'}</span>
                  <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{dark ? 'On' : 'Off'}</span>
                </button>
                <button
                  type="button"
                  className="mi"
                  style={{ color: 'var(--rtx)', borderTop: '1px solid var(--ln)', marginTop: 6 }}
                  onClick={async () => {
                    await signOut();
                    router.push('/superadmin/login');
                  }}
                >
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ===================== PAGE ROUTER ===================== */}
        <main className="pg" style={{ padding: '24px clamp(16px, 4vw, 48px)', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ==================== 1. SCREEN: HOME (TODAY) ==================== */}
          {screen === 'home' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="phead">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Today</h1>
                  <span className="subt">5 tasks waiting · Mon 2 Nov · live platform data</span>
                </div>
                <span className="chip" style={{ background: 'var(--sf3)', color: 'var(--tx2)' }}>Mon 2 Nov · sample data</span>
              </div>

              {/* 4 Top KPI Cards */}
              <div className="g4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="lbl">Active Requirements</span>
                  <b style={{ fontSize: 26, letterSpacing: '-0.01em' }}>14</b>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#16A34A' }}>▲ 18% vs previous 7 days</span>
                </div>
                <div className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="lbl">24h Responses</span>
                  <b style={{ fontSize: 26, letterSpacing: '-0.01em' }}>38</b>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#16A34A' }}>▲ 12% vs previous 7 days</span>
                </div>
                <div className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="lbl">Matches Connected</span>
                  <b style={{ fontSize: 26, letterSpacing: '-0.01em' }}>92</b>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#16A34A' }}>▲ 24% vs previous 7 days</span>
                </div>
                <div className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="lbl">30d Revenue</span>
                  <b style={{ fontSize: 26, letterSpacing: '-0.01em' }}>₹28,400</b>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#16A34A' }}>▲ 31% vs previous 7 days</span>
                </div>
              </div>

              {/* Two Column Layout: Needs You vs 14-day Chart */}
              <div className="two" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
                {/* Needs you queue */}
                <section className="card" style={{ padding: '6px 0', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px 8px' }}>
                    <h2 className="lbl" style={{ margin: 0 }}>Needs you</h2>
                    <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>5 items waiting</span>
                  </div>

                  {/* Todo Item 1: Held requirement */}
                  <button
                    type="button"
                    className="qrow"
                    onClick={() => { setScreen('reqs'); openItemDrawer('req', db.reqs[0]); }}
                  >
                    <span className="qn" style={{ background: 'var(--rbg)', color: 'var(--rtx)' }}>1</span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                      <b style={{ fontSize: 14.5 }}>Held requirement · XPO-REQ-41190</b>
                      <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>Flagged keyword: &quot;betting&quot; &mdash; review and approve</span>
                    </span>
                    <span className="qcta">Review →</span>
                  </button>

                  {/* Todo Item 2: KYC verification */}
                  <button
                    type="button"
                    className="qrow"
                    onClick={() => { setScreen('members'); openItemDrawer('member', db.members[0]); }}
                  >
                    <span className="qn" style={{ background: 'var(--bbg)', color: 'var(--btx)' }}>2</span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                      <b style={{ fontSize: 14.5 }}>KYC verification · Shree Packaging</b>
                      <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>GST Registration Certificate submitted</span>
                    </span>
                    <span className="qcta">Verify →</span>
                  </button>

                  {/* Todo Item 3: Failed renewal */}
                  <button
                    type="button"
                    className="qrow"
                    onClick={() => { setScreen('money'); openItemDrawer('pay', db.pays.find(p => p.st === 'Failed') || db.pays[0]); }}
                  >
                    <span className="qn" style={{ background: 'var(--abg)', color: 'var(--atx)' }}>1</span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                      <b style={{ fontSize: 14.5 }}>Failed payment · ₹999 Partner Pro</b>
                      <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>UPI AutoPay mandate failed · 2 retries left</span>
                    </span>
                    <span className="qcta">Retry link →</span>
                  </button>

                  {/* Todo Item 4: Support Chat */}
                  <button
                    type="button"
                    className="qrow"
                    onClick={() => { setScreen('auto'); openItemDrawer('convo', db.convos.find(c => c.st === 'SUPPORT_REVIEW') || db.convos[0]); }}
                  >
                    <span className="qn" style={{ background: 'var(--pbg)', color: 'var(--ptx)' }}>1</span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                      <b style={{ fontSize: 14.5 }}>Support chat · Can I add a second store location?</b>
                      <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>WhatsApp bot paused · coordinator requested</span>
                    </span>
                    <span className="qcta">Take over →</span>
                  </button>

                  {/* Todo Item 5: Unmapped words */}
                  <button
                    type="button"
                    className="qrow"
                    onClick={() => { setScreen('auto'); setViewTab(prev => ({ ...prev, auto: 'map' })); }}
                  >
                    <span className="qn" style={{ background: 'var(--sf3)', color: 'var(--tx)' }}>4</span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                      <b style={{ fontSize: 14.5 }}>Unmapped words &middot; &quot;dabba printing&quot;, &quot;reels shoot&quot;</b>
                      <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>Map to categories to train automated routing</span>
                    </span>
                    <span className="qcta">Map words →</span>
                  </button>
                </section>

                {/* 14-day Chart */}
                <section className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h2 className="lbl" style={{ margin: 0 }}>Requirements · last 14 days</h2>
                    <span style={{ display: 'flex', gap: 14, fontSize: 12.5, color: 'var(--tx2)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <i style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--inv)' }} /> Posted
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <i style={{ width: 10, height: 10, borderRadius: 3, background: '#1D7A45' }} /> Connected
                      </span>
                    </span>
                  </div>

                  {/* Dual Bar Chart */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, minmax(0, 1fr))', gap: 6, alignItems: 'end', flex: 1, minHeight: 170, borderBottom: '1px solid var(--ln)' }}>
                    {[
                      { l: '20 Oct', p: 40, c: 25 },
                      { l: '21 Oct', p: 55, c: 35 },
                      { l: '22 Oct', p: 60, c: 45 },
                      { l: '23 Oct', p: 70, c: 50 },
                      { l: '24 Oct', p: 45, c: 30 },
                      { l: '25 Oct', p: 35, c: 20 },
                      { l: '26 Oct', p: 65, c: 45 },
                      { l: '27 Oct', p: 80, c: 60 },
                      { l: '28 Oct', p: 75, c: 55 },
                      { l: '29 Oct', p: 90, c: 70 },
                      { l: '30 Oct', p: 85, c: 65 },
                      { l: '31 Oct', p: 95, c: 75 },
                      { l: '1 Nov', p: 60, c: 45 },
                      { l: 'Today', p: 100, c: 80 },
                    ].map((b, idx) => (
                      <div key={idx} title={`${b.l}: ${b.p}% posted, ${b.c}% connected`} style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: '100%' }}>
                        <span style={{ flex: 1, borderRadius: '3px 3px 0 0', background: 'var(--inv)', height: `${b.p}%` }} />
                        <span style={{ flex: 1, borderRadius: '3px 3px 0 0', background: '#1D7A45', height: `${b.c}%` }} />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, minmax(0, 1fr))', gap: 6, marginTop: -8 }}>
                    {['20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '1', 'Today'].map((lab, i) => (
                      <span key={i} style={{ fontSize: 10.5, color: 'var(--tx2)', textAlign: 'center' }}>{lab}</span>
                    ))}
                  </div>
                </section>
              </div>

              {/* Two Column Layout: Funnel vs Payments */}
              <div className="two" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
                {/* Funnel */}
                <section className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <h2 className="lbl" style={{ margin: 0 }}>Funnel · all time</h2>
                  {[
                    { k: 'Contacts uploaded', v: '18,452', p: '100%', w: '100%', c: '#1F5FBF' },
                    { k: 'WhatsApp invites sent', v: '12,380', p: '67%', w: '67%', c: '#1F5FBF' },
                    { k: 'Onboarded members', v: '6,214', p: '50%', w: '50%', c: '#1D7A45' },
                    { k: 'Requirements posted', v: '3,906', p: '63%', w: '63%', c: '#1D7A45' },
                    { k: 'Partners replied', v: '2,810', p: '72%', w: '72%', c: '#16A34A' },
                    { k: 'Connections made', v: '1,140', p: '41%', w: '41%', c: '#16A34A' },
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '170px 1fr 92px', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{f.k}</span>
                      <span style={{ height: 12, borderRadius: 6, background: 'var(--sf3)', overflow: 'hidden' }}>
                        <i style={{ display: 'block', height: '100%', borderRadius: 6, background: f.c, width: f.w }} />
                      </span>
                      <span style={{ fontSize: 13, textAlign: 'right' }}>
                        <b>{f.v}</b> <span style={{ color: 'var(--tx2)' }}>({f.p})</span>
                      </span>
                    </div>
                  ))}
                </section>

                {/* Payments */}
                <section className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h2 className="lbl" style={{ margin: 0 }}>Payments · last 30 days</h2>
                    <button type="button" className="btn bl" onClick={() => setScreen('money')}>Open Money →</button>
                  </div>
                  {[
                    { k: 'UPI AutoPay', v: '₹14,800', n: '51 payments', w: '52%' },
                    { k: 'Razorpay Card / Netbanking', v: '₹8,200', n: '28 payments', w: '29%' },
                    { k: 'PayPal (Global USD)', v: '$420', n: '14 payments', w: '14%' },
                    { k: 'Stripe International', v: '₹1,400', n: '6 payments', w: '5%' },
                  ].map((g, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '170px 1fr 130px', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{g.k}</span>
                      <span style={{ height: 12, borderRadius: 6, background: 'var(--sf3)', overflow: 'hidden' }}>
                        <i style={{ display: 'block', height: '100%', borderRadius: 6, background: '#1F5FBF', width: g.w }} />
                      </span>
                      <span style={{ fontSize: 13, textAlign: 'right' }}>
                        <b>{g.v}</b> <span style={{ color: 'var(--tx2)' }}>· {g.n}</span>
                      </span>
                    </div>
                  ))}
                  <span style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 4 }}>
                    India: Razorpay and UPI AutoPay (₹, excl. GST) · International: PayPal (US$)
                  </span>
                </section>
              </div>
            </div>
          )}

          {/* ==================== 2. SCREEN: REQUIREMENTS ==================== */}
          {screen === 'reqs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="phead">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Requirements</h1>
                  <span className="subt">{db.reqs.length} requirements · 14 matching now · automated 5-min wave engine</span>
                </div>
              </div>

              {/* View Tabs */}
              <div role="tablist" aria-label="Requirement Views" className="views">
                {[
                  { id: 'all', l: 'All', n: db.reqs.length },
                  { id: 'held', l: 'Held / Review', n: db.reqs.filter(r => r.st === 'held').length },
                  { id: 'live', l: 'Live Matching', n: db.reqs.filter(r => r.st === 'live').length },
                  { id: 'nomatch', l: 'No Match', n: db.reqs.filter(r => r.st === 'nomatch').length },
                  { id: 'done', l: 'Connected', n: db.reqs.filter(r => r.st === 'done').length },
                  { id: 'closed', l: 'Closed', n: db.reqs.filter(r => r.st === 'closed' || r.st === 'changes').length },
                ].map((v) => {
                  const on = (viewTab.reqs || 'all') === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="tab"
                      className="vt"
                      aria-selected={on}
                      onClick={() => setViewTab((prev) => ({ ...prev, reqs: v.id }))}
                      style={{ color: on ? 'var(--tx)' : 'var(--tx2)', borderBottomColor: on ? '#C8102E' : 'transparent' }}
                    >
                      {v.l}
                      <span className="vn" style={{ background: on ? 'var(--sf3)' : 'transparent', color: 'var(--tx2)' }}>{v.n}</span>
                    </button>
                  );
                })}
              </div>

              {/* Table Card */}
              <section className="card" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Table Toolbar */}
                <div className="tool">
                  <label className="srchw">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A4F59" strokeWidth="2.2">
                      <circle cx="11" cy="11" r="7"></circle>
                      <path d="m20 20-3.5-3.5"></path>
                    </svg>
                    <span className="sr">Search requirements</span>
                    <input
                      type="search"
                      className="srch"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search code, title, client, or city..."
                    />
                  </label>
                  <select
                    className="sel hide-sm"
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                  >
                    <option value="">All Cities</option>
                    <option value="Pune">Pune</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                  </select>
                  <select
                    className="sel hide-sm"
                    value={filterCat}
                    onChange={(e) => setFilterCat(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    <option value="Web & Mobile Development">Web & Mobile Development</option>
                    <option value="Industrial Packaging & Raw Materials">Industrial Packaging</option>
                    <option value="Performance Marketing & SEO">Performance Marketing</option>
                    <option value="Solar & Electrical EPC">Solar EPC</option>
                  </select>
                  <span style={{ flex: 1 }} />
                  <button type="button" className="tbtn" onClick={() => toast('Exported requirements list')}>Export CSV</button>
                </div>

                {/* Grid Table */}
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '130px minmax(260px, 2fr) minmax(180px, 1.2fr) 110px 140px 110px 140px 100px', minWidth: 1070 }}>
                    <div className="th">Code</div>
                    <div className="th">Requirement</div>
                    <div className="th">Category</div>
                    <div className="th">City</div>
                    <div className="th">Timeline</div>
                    <div className="th">Budget</div>
                    <div className="th">Status</div>
                    <div className="th">Posted</div>

                    {db.reqs
                      .filter((r) => {
                        const v = viewTab.reqs || 'all';
                        if (v === 'held' && r.st !== 'held') return false;
                        if (v === 'live' && r.st !== 'live') return false;
                        if (v === 'nomatch' && r.st !== 'nomatch') return false;
                        if (v === 'done' && r.st !== 'done') return false;
                        if (v === 'closed' && (r.st !== 'closed' && r.st !== 'changes')) return false;
                        if (filterCity && r.city !== filterCity) return false;
                        if (filterCat && r.cat !== filterCat) return false;
                        if (q && !r._s.includes(q.toLowerCase())) return false;
                        return true;
                      })
                      .map((r) => (
                        <React.Fragment key={r.id}>
                          <div className="td mono">{r.code}</div>
                          <div className="td" style={{ cursor: 'pointer' }} onClick={() => openItemDrawer('req', r)}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <b style={{ color: '#C8102E' }}>{r.title}</b>
                              <span style={{ fontSize: 12, color: 'var(--tx2)' }}>{r.client}</span>
                            </div>
                          </div>
                          <div className="td">{r.cat}</div>
                          <div className="td">{r.city}</div>
                          <div className="td">{r.tl}</div>
                          <div className="td mono">{r.budget}</div>
                          <div className="td">
                            <span
                              className="chip"
                              style={
                                r.st === 'held'
                                  ? { background: 'var(--rbg)', color: 'var(--rtx)' }
                                  : r.st === 'live'
                                  ? { background: 'var(--bbg)', color: 'var(--btx)' }
                                  : r.st === 'done'
                                  ? { background: 'var(--gbg)', color: 'var(--gtx)' }
                                  : { background: 'var(--sf3)', color: 'var(--tx2)' }
                              }
                            >
                              {r.st === 'held' ? 'Held' : (r.st === 'live' ? `Wave ${r.wave} · ${r.interested}/3` : (r.st === 'done' ? 'Connected' : r.st))}
                            </span>
                          </div>
                          <div className="td" style={{ color: 'var(--tx2)' }}>{ds(r.d)}</div>
                        </React.Fragment>
                      ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ==================== 3. SCREEN: CONTACTS ==================== */}
          {screen === 'contacts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="phead">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Contacts</h1>
                  <span className="subt">{db.contacts.length} phone contacts · 12 added today · DPDP-compliant</span>
                </div>
                <button type="button" className="btn b1" onClick={() => setUp(1)}>
                  Upload Excel
                </button>
              </div>

              {/* Views */}
              <div role="tablist" aria-label="Contact Views" className="views">
                {[
                  { id: 'all', l: 'All', n: db.contacts.length },
                  { id: 'partner', l: 'Partners', n: db.contacts.filter(c => c.role === 'Partner').length },
                  { id: 'client', l: 'Clients', n: db.contacts.filter(c => c.role === 'Client').length },
                  { id: 'ready', l: 'Ready to Invite', n: db.contacts.filter(c => c.cons === 'Opted in' && c.stage === 'Uploaded').length },
                  { id: 'nocons', l: 'Needs Consent', n: db.contacts.filter(c => c.cons === 'Missing').length },
                  { id: 'joined', l: 'Joined', n: db.contacts.filter(c => c.stage === 'Registered').length },
                ].map((v) => {
                  const on = (viewTab.contacts || 'all') === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="tab"
                      className="vt"
                      aria-selected={on}
                      onClick={() => setViewTab((prev) => ({ ...prev, contacts: v.id }))}
                      style={{ color: on ? 'var(--tx)' : 'var(--tx2)', borderBottomColor: on ? '#C8102E' : 'transparent' }}
                    >
                      {v.l}
                      <span className="vn">{v.n}</span>
                    </button>
                  );
                })}
              </div>

              {/* Table Card */}
              <section className="card" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div className="tool">
                  <label className="srchw">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A4F59" strokeWidth="2.2">
                      <circle cx="11" cy="11" r="7"></circle>
                      <path d="m20 20-3.5-3.5"></path>
                    </svg>
                    <span className="sr">Search contacts</span>
                    <input
                      type="search"
                      className="srch"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search name, phone, city, or category..."
                    />
                  </label>
                  <select className="sel hide-sm" value={filterCity} onChange={(e) => setFilterCity(e.target.value)}>
                    <option value="">All Cities</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Pune">Pune</option>
                    <option value="Delhi">Delhi</option>
                  </select>
                  <span style={{ flex: 1 }} />
                  <button type="button" className="tbtn" onClick={() => setInviteModal(true)}>Invite via WhatsApp</button>
                  <button type="button" className="tbtn" onClick={() => toast('Exporting contacts to CSV')}>Export CSV</button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '48px minmax(200px, 1.8fr) 100px 160px 120px minmax(180px, 1.2fr) 110px 110px 90px', minWidth: 1000 }}>
                    <div className="th">
                      <input
                        type="checkbox"
                        checked={allSel}
                        onChange={(e) => {
                          setAllSel(e.target.checked);
                          const next: Record<string, boolean> = {};
                          if (e.target.checked) db.contacts.forEach((c) => (next[c.id] = true));
                          setSel(next);
                        }}
                      />
                    </div>
                    <div className="th">Name</div>
                    <div className="th">Role</div>
                    <div className="th">Phone</div>
                    <div className="th">City</div>
                    <div className="th">Category</div>
                    <div className="th">Consent</div>
                    <div className="th">Stage</div>
                    <div className="th">Added</div>

                    {db.contacts
                      .filter((c) => {
                        const v = viewTab.contacts || 'all';
                        if (v === 'partner' && c.role !== 'Partner') return false;
                        if (v === 'client' && c.role !== 'Client') return false;
                        if (v === 'ready' && !(c.cons === 'Opted in' && c.stage === 'Uploaded')) return false;
                        if (v === 'nocons' && c.cons !== 'Missing') return false;
                        if (v === 'joined' && c.stage !== 'Registered') return false;
                        if (filterCity && c.city !== filterCity) return false;
                        if (q && !c._s.includes(q.toLowerCase())) return false;
                        return true;
                      })
                      .map((c) => (
                        <React.Fragment key={c.id}>
                          <div className="td">
                            <input
                              type="checkbox"
                              checked={!!sel[c.id]}
                              onChange={(e) => setSel((prev) => ({ ...prev, [c.id]: e.target.checked }))}
                            />
                          </div>
                          <div className="td" style={{ cursor: 'pointer' }} onClick={() => openItemDrawer('contact', c)}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <b style={{ color: '#C8102E' }}>{c.name}</b>
                              <span style={{ fontSize: 11, color: 'var(--tx3)' }}>{c.id}</span>
                            </div>
                          </div>
                          <div className="td">
                            <span className="chip" style={c.role === 'Partner' ? { background: 'var(--bbg)', color: 'var(--btx)' } : { background: 'var(--pbg)', color: 'var(--ptx)' }}>
                              {c.role}
                            </span>
                          </div>
                          <div className="td mono">{c.phone}</div>
                          <div className="td">{c.city}</div>
                          <div className="td">{c.cat}</div>
                          <div className="td">
                            <span className="chip" style={c.cons === 'Opted in' ? { background: 'var(--gbg)', color: 'var(--gtx)' } : { background: 'var(--abg)', color: 'var(--atx)' }}>
                              {c.cons}
                            </span>
                          </div>
                          <div className="td">
                            <span className="chip" style={c.stage === 'Registered' ? { background: 'var(--gbg)', color: 'var(--gtx)' } : (c.stage === 'Invited' ? { background: 'var(--bbg)', color: 'var(--btx)' } : { background: 'var(--sf3)', color: 'var(--tx2)' })}>
                              {c.stage}
                            </span>
                          </div>
                          <div className="td" style={{ color: 'var(--tx2)' }}>{ds(c.d)}</div>
                        </React.Fragment>
                      ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ==================== 4. SCREEN: MEMBERS ==================== */}
          {screen === 'members' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="phead">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Members</h1>
                  <span className="subt">{db.members.length} registered accounts · {kycCount} KYC verifications in review</span>
                </div>
              </div>

              {/* Views */}
              <div role="tablist" aria-label="Member Views" className="views">
                {[
                  { id: 'all', l: 'All', n: db.members.length },
                  { id: 'partner', l: 'Partners', n: db.members.filter(m => m.role === 'Partner').length },
                  { id: 'client', l: 'Clients', n: db.members.filter(m => m.role === 'Client').length },
                  { id: 'kyc', l: 'Needs KYC', n: db.members.filter(m => m.kyc === 'In review').length },
                  { id: 'verified', l: 'Verified', n: db.members.filter(m => m.kyc === 'Verified').length },
                  { id: 'paused', l: 'Paused', n: db.members.filter(m => m.st === 'Paused').length },
                ].map((v) => {
                  const on = (viewTab.members || 'all') === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="tab"
                      className="vt"
                      aria-selected={on}
                      onClick={() => setViewTab((prev) => ({ ...prev, members: v.id }))}
                      style={{ color: on ? 'var(--tx)' : 'var(--tx2)', borderBottomColor: on ? '#C8102E' : 'transparent' }}
                    >
                      {v.l}
                      <span className="vn">{v.n}</span>
                    </button>
                  );
                })}
              </div>

              {/* Table Card */}
              <section className="card" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div className="tool">
                  <label className="srchw">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A4F59" strokeWidth="2.2">
                      <circle cx="11" cy="11" r="7"></circle>
                      <path d="m20 20-3.5-3.5"></path>
                    </svg>
                    <span className="sr">Search members</span>
                    <input
                      type="search"
                      className="srch"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search member name, email, phone, city..."
                    />
                  </label>
                  <span style={{ flex: 1 }} />
                  <button type="button" className="tbtn" onClick={() => toast('Exported members CSV')}>Export CSV</button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 2fr) 100px 110px 140px minmax(160px, 1fr) 110px 120px 90px', minWidth: 1050 }}>
                    <div className="th">Member &amp; Company</div>
                    <div className="th">Role</div>
                    <div className="th">City</div>
                    <div className="th">Phone</div>
                    <div className="th">Category</div>
                    <div className="th">KYC Status</div>
                    <div className="th">Plan</div>
                    <div className="th">Last Active</div>

                    {db.members
                      .filter((m) => {
                        const v = viewTab.members || 'all';
                        if (v === 'partner' && m.role !== 'Partner') return false;
                        if (v === 'client' && m.role !== 'Client') return false;
                        if (v === 'kyc' && m.kyc !== 'In review') return false;
                        if (v === 'verified' && m.kyc !== 'Verified') return false;
                        if (v === 'paused' && m.st !== 'Paused') return false;
                        if (q && !m._s.includes(q.toLowerCase())) return false;
                        return true;
                      })
                      .map((m) => (
                        <React.Fragment key={m.id}>
                          <div className="td" style={{ cursor: 'pointer' }} onClick={() => openItemDrawer('member', m)}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <b style={{ color: '#C8102E' }}>{m.name}</b>
                              <span style={{ fontSize: 11, color: 'var(--tx3)' }}>{m.email}</span>
                            </div>
                          </div>
                          <div className="td">
                            <span className="chip" style={m.role === 'Partner' ? { background: 'var(--bbg)', color: 'var(--btx)' } : { background: 'var(--pbg)', color: 'var(--ptx)' }}>
                              {m.role}
                            </span>
                          </div>
                          <div className="td">{m.city}</div>
                          <div className="td mono">{m.phone}</div>
                          <div className="td">{m.cat}</div>
                          <div className="td">
                            <span
                              className="chip"
                              style={
                                m.kyc === 'Verified'
                                  ? { background: 'var(--gbg)', color: 'var(--gtx)' }
                                  : m.kyc === 'In review'
                                  ? { background: 'var(--bbg)', color: 'var(--btx)' }
                                  : { background: 'var(--sf3)', color: 'var(--tx2)' }
                              }
                            >
                              {m.kyc}
                            </span>
                          </div>
                          <div className="td">
                            <span className="chip" style={{ background: 'var(--sf3)', color: 'var(--tx)' }}>{m.plan}</span>
                          </div>
                          <div className="td" style={{ color: 'var(--tx2)' }}>{ds(m.last)}</div>
                        </React.Fragment>
                      ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ==================== 5. SCREEN: MONEY ==================== */}
          {screen === 'money' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="phead">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Money</h1>
                  <span className="subt">{db.pays.length} transactions · UPI AutoPay, Razorpay card, and PayPal</span>
                </div>
              </div>

              {/* 4 Summary Tiles */}
              <div className="g4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="lbl">30-day Volume</span>
                  <b style={{ fontSize: 24 }}>₹28,400</b>
                  <span style={{ fontSize: 12, color: 'var(--tx2)' }}>Excl. 18% GST</span>
                </div>
                <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="lbl">Today</span>
                  <b style={{ fontSize: 24 }}>₹1,298</b>
                  <span style={{ fontSize: 12, color: 'var(--tx2)' }}>2 successful checkouts</span>
                </div>
                <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="lbl">Failed Renewals</span>
                  <b style={{ fontSize: 24, color: failedPayCount > 0 ? '#8E0B20' : 'inherit' }}>{failedPayCount}</b>
                  <span style={{ fontSize: 12, color: 'var(--tx2)' }}>Retry daily for 3 days</span>
                </div>
                <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="lbl">Active Subscriptions</span>
                  <b style={{ fontSize: 24 }}>{db.subs.filter(s => s.st === 'Active').length}</b>
                  <span style={{ fontSize: 12, color: 'var(--tx2)' }}>Monthly recurring</span>
                </div>
              </div>

              {/* Views */}
              <div role="tablist" aria-label="Payment Views" className="views">
                {[
                  { id: 'all', l: 'All Transactions', n: db.pays.length },
                  { id: '30d', l: '30 Days', n: 72 },
                  { id: 'today', l: 'Today', n: 8 },
                  { id: 'failed', l: 'Failed', n: failedPayCount },
                  { id: 'refunds', l: 'Refunds', n: db.pays.filter(p => p.st === 'Refunded').length },
                ].map((v) => {
                  const on = (viewTab.money || 'all') === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="tab"
                      className="vt"
                      aria-selected={on}
                      onClick={() => setViewTab((prev) => ({ ...prev, money: v.id }))}
                      style={{ color: on ? 'var(--tx)' : 'var(--tx2)', borderBottomColor: on ? '#C8102E' : 'transparent' }}
                    >
                      {v.l}
                      <span className="vn">{v.n}</span>
                    </button>
                  );
                })}
              </div>

              {/* Table Card */}
              <section className="card" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div className="tool">
                  <label className="srchw">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A4F59" strokeWidth="2.2">
                      <circle cx="11" cy="11" r="7"></circle>
                      <path d="m20 20-3.5-3.5"></path>
                    </svg>
                    <span className="sr">Search payments</span>
                    <input
                      type="search"
                      className="srch"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search member, ID, plan, or gateway..."
                    />
                  </label>
                  <span style={{ flex: 1 }} />
                  <button type="button" className="tbtn" onClick={() => toast('Exporting payments audit CSV')}>Export CSV</button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '130px minmax(200px, 1.8fr) 100px minmax(160px, 1.2fr) 100px 140px 110px 100px', minWidth: 1040 }}>
                    <div className="th">Transaction ID</div>
                    <div className="th">Member</div>
                    <div className="th">Role</div>
                    <div className="th">Plan</div>
                    <div className="th">Amount</div>
                    <div className="th">Gateway</div>
                    <div className="th">Status</div>
                    <div className="th">Date</div>

                    {db.pays
                      .filter((p) => {
                        const v = viewTab.money || 'all';
                        if (v === 'failed' && p.st !== 'Failed') return false;
                        if (v === 'refunds' && p.st !== 'Refunded') return false;
                        if (v === 'today' && p.d !== 0) return false;
                        if (q && !p._s.includes(q.toLowerCase())) return false;
                        return true;
                      })
                      .map((p) => (
                        <React.Fragment key={p.id}>
                          <div className="td mono">{p.id}</div>
                          <div className="td" style={{ cursor: 'pointer' }} onClick={() => openItemDrawer('pay', p)}>
                            <b style={{ color: '#C8102E' }}>{p.who}</b>
                          </div>
                          <div className="td">
                            <span className="chip" style={p.role === 'Partner' ? { background: 'var(--bbg)', color: 'var(--btx)' } : { background: 'var(--pbg)', color: 'var(--ptx)' }}>
                              {p.role}
                            </span>
                          </div>
                          <div className="td">{p.plan}</div>
                          <div className="td mono"><b>{p.cur}{p.amt}</b></div>
                          <div className="td">{p.gw}</div>
                          <div className="td">
                            <span
                              className="chip"
                              style={
                                p.st === 'Captured'
                                  ? { background: 'var(--gbg)', color: 'var(--gtx)' }
                                  : p.st === 'Failed'
                                  ? { background: 'var(--rbg)', color: 'var(--rtx)' }
                                  : { background: 'var(--abg)', color: 'var(--atx)' }
                              }
                            >
                              {p.st}
                            </span>
                          </div>
                          <div className="td" style={{ color: 'var(--tx2)' }}>{ds(p.d)} · {p.tm}</div>
                        </React.Fragment>
                      ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ==================== 6. SCREEN: PLANS ==================== */}
          {screen === 'plans' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="phead">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Plans &amp; subscriptions</h1>
                  <span className="subt">India pays in ₹ with GST · overseas pays in US$ through PayPal</span>
                </div>
              </div>

              {/* View Tabs */}
              <div role="tablist" aria-label="Plans Views" className="views">
                {[
                  { id: 'india', l: 'India (₹)' },
                  { id: 'over', l: 'Outside India ($)' },
                  { id: 'subs', l: `Active Subscribers (${db.subs.length})` },
                ].map((v) => {
                  const on = (viewTab.plans || 'india') === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="tab"
                      className="vt"
                      aria-selected={on}
                      onClick={() => setViewTab((prev) => ({ ...prev, plans: v.id }))}
                      style={{ color: on ? 'var(--tx)' : 'var(--tx2)', borderBottomColor: on ? '#C8102E' : 'transparent' }}
                    >
                      {v.l}
                    </button>
                  );
                })}
              </div>

              {viewTab.plans !== 'subs' ? (
                <>
                  <div className="fx" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px' }}>
                    <span><b>Tax:</b> {viewTab.plans === 'india' ? '18% GST added at checkout' : 'No Indian GST applies'}</span>
                    <span><b>Gateways:</b> {viewTab.plans === 'india' ? 'Razorpay (UPI AutoPay, cards, netbanking)' : 'PayPal (Cards & PayPal balance)'}</span>
                    <span><b>Billing period:</b> 30 days monthly recurring</span>
                  </div>

                  <div className="two" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, alignItems: 'start' }}>
                    {/* Client Plan Card */}
                    <section className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <b style={{ fontSize: 18 }}>Client Plus Plan</b>
                        <span style={{ fontSize: 13, color: 'var(--tx2)' }}>Partner contact unlocks</span>
                      </div>
                      <span style={{ fontSize: 13.5, color: 'var(--tx2)' }}>
                        Clients view unlocked partner details after matching. First views are free.
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                        <div className="fld">
                          <span>Free views</span>
                          <input className="inp mono" defaultValue="5" />
                        </div>
                        <div className="fld">
                          <span>Monthly views</span>
                          <input className="inp mono" defaultValue="30" />
                        </div>
                        <div className="fld">
                          <span>Price ({viewTab.plans === 'india' ? '₹' : '$'})</span>
                          <input className="inp mono" defaultValue={viewTab.plans === 'india' ? '299' : '9.99'} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 16, borderTop: '1px solid var(--ln)', paddingTop: 12 }}>
                        <label className="swl">
                          <input type="checkbox" className="swt" defaultChecked />
                          <span style={{ fontSize: 13 }}>Monthly AutoPay</span>
                        </label>
                        <label className="swl">
                          <input type="checkbox" className="swt" />
                          <span style={{ fontSize: 13 }}>Rollover unused</span>
                        </label>
                      </div>
                      <button type="button" className="btn b3" style={{ alignSelf: 'flex-start' }} onClick={() => toast('Client Plan pricing updated')}>
                        Save Client Plan
                      </button>
                    </section>

                    {/* Partner Plan Card */}
                    <section className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <b style={{ fontSize: 18 }}>Partner Pro Plan</b>
                        <span style={{ fontSize: 13, color: 'var(--tx2)' }}>Lead replies &amp; wave alerts</span>
                      </div>
                      <span style={{ fontSize: 13.5, color: 'var(--tx2)' }}>
                        Partners reply to 5-minute lead alerts in their categories. Unused claims stay untouched on miss/pass.
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                        <div className="fld">
                          <span>Free replies</span>
                          <input className="inp mono" defaultValue="3" />
                        </div>
                        <div className="fld">
                          <span>Monthly replies</span>
                          <input className="inp mono" defaultValue="50" />
                        </div>
                        <div className="fld">
                          <span>Price ({viewTab.plans === 'india' ? '₹' : '$'})</span>
                          <input className="inp mono" defaultValue={viewTab.plans === 'india' ? '999' : '19.99'} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 16, borderTop: '1px solid var(--ln)', paddingTop: 12 }}>
                        <label className="swl">
                          <input type="checkbox" className="swt" defaultChecked />
                          <span style={{ fontSize: 13 }}>Monthly AutoPay</span>
                        </label>
                        <label className="swl">
                          <input type="checkbox" className="swt" />
                          <span style={{ fontSize: 13 }}>Rollover unused</span>
                        </label>
                      </div>
                      <button type="button" className="btn b3" style={{ alignSelf: 'flex-start' }} onClick={() => toast('Partner Plan pricing updated')}>
                        Save Partner Plan
                      </button>
                    </section>
                  </div>
                </>
              ) : (
                /* Subscribers Table */
                <section className="card" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(200px, 1.8fr) 100px minmax(140px, 1fr) 100px 140px 120px 110px', minWidth: 930 }}>
                      <div className="th">Sub ID</div>
                      <div className="th">Subscriber</div>
                      <div className="th">Role</div>
                      <div className="th">Plan</div>
                      <div className="th">Price</div>
                      <div className="th">Payment</div>
                      <div className="th">Next Renewal</div>
                      <div className="th">Status</div>

                      {db.subs.map((s) => (
                        <React.Fragment key={s.id}>
                          <div className="td mono">{s.id}</div>
                          <div className="td" style={{ cursor: 'pointer' }} onClick={() => openItemDrawer('sub', s)}>
                            <b style={{ color: '#C8102E' }}>{s.name}</b>
                          </div>
                          <div className="td">
                            <span className="chip" style={s.role === 'Partner' ? { background: 'var(--bbg)', color: 'var(--btx)' } : { background: 'var(--pbg)', color: 'var(--ptx)' }}>
                              {s.role}
                            </span>
                          </div>
                          <div className="td">{s.plan}</div>
                          <div className="td mono"><b>{s.cur}{s.price}</b></div>
                          <div className="td">{s.pay}</div>
                          <div className="td">{s.st === 'Expired' ? '—' : `in ${s.renew} days`}</div>
                          <div className="td">
                            <span
                              className="chip"
                              style={
                                s.st === 'Active'
                                  ? { background: 'var(--gbg)', color: 'var(--gtx)' }
                                  : s.st === 'Renewal failed'
                                  ? { background: 'var(--rbg)', color: 'var(--rtx)' }
                                  : { background: 'var(--abg)', color: 'var(--atx)' }
                              }
                            >
                              {s.st}
                            </span>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ==================== 7. SCREEN: CATEGORIES ==================== */}
          {screen === 'cats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="phead">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Categories</h1>
                  <span className="subt">4-tier taxonomy · 25 sectors, 112 categories, 640 subcategories, and search synonyms</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="btn b2" onClick={() => toast('Downloaded 4-tier taxonomy template (.xlsx)')}>Download template</button>
                  <button type="button" className="btn b2" onClick={() => toast('Exported entire category hierarchy')}>Export</button>
                  <button type="button" className="btn b1" onClick={() => toast('Open category importer dialog')}>Import from Excel</button>
                </div>
              </div>

              {/* 4 Summary Tiles */}
              <div className="g4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="lbl">Sectors</span>
                  <b style={{ fontSize: 24 }}>{tax.length}</b>
                  <span style={{ fontSize: 12, color: 'var(--tx2)' }}>Tier 1 root groups</span>
                </div>
                <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="lbl">Categories</span>
                  <b style={{ fontSize: 24 }}>112</b>
                  <span style={{ fontSize: 12, color: 'var(--tx2)' }}>Matching buckets</span>
                </div>
                <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="lbl">Subcategories</span>
                  <b style={{ fontSize: 24 }}>640</b>
                  <span style={{ fontSize: 12, color: 'var(--tx2)' }}>Specific work items</span>
                </div>
                <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="lbl">Active Partners</span>
                  <b style={{ fontSize: 24 }}>4,210</b>
                  <span style={{ fontSize: 12, color: 'var(--tx2)' }}>Mapped to categories</span>
                </div>
              </div>

              {/* 4-Tier Interactive Tree Browser */}
              <div className="tree2">
                {/* Left: Sectors list */}
                <section className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ padding: 12, borderBottom: '1px solid var(--ln)' }}>
                    <input
                      type="search"
                      className="srch"
                      placeholder="Search sectors..."
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                    {tax.map((sec, si) => {
                      const isSelected = selectedSectorIdx === si;
                      return (
                        <div key={si} style={{ borderBottom: '1px solid var(--ln)' }}>
                          <button
                            type="button"
                            className="sec2"
                            onClick={() => {
                              setSelectedSectorIdx(si);
                              setSelectedCatIdx(0);
                            }}
                            style={{
                              background: isSelected ? 'var(--sf3)' : 'var(--sf)',
                              fontWeight: isSelected ? 800 : 600,
                            }}
                          >
                            <span style={{ width: 14, color: 'var(--tx2)' }}>{isSelected ? '▾' : '▸'}</span>
                            <span style={{ flex: 1, textAlign: 'left', fontSize: 14 }}>{sec.name}</span>
                            <span style={{ fontSize: 12, color: 'var(--tx2)' }}>{sec.cats.length}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Right: Selected Category Details, Subcategories, and Synonyms */}
                <section className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Category Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--ln)', paddingBottom: 14 }}>
                    <div>
                      <span className="lbl">{tax[selectedSectorIdx]?.name}</span>
                      <h2 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800 }}>
                        {tax[selectedSectorIdx]?.cats[selectedCatIdx]?.name || 'Web & Mobile Development'}
                      </h2>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="btn b2" onClick={() => toast('Subcategory modal opened')}>
                        + Add subcategory
                      </button>
                    </div>
                  </div>

                  {/* Subcategories List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <b style={{ fontSize: 15 }}>Subcategories</b>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                      {(tax[selectedSectorIdx]?.cats[selectedCatIdx]?.subs || [
                        ['Full-Stack & SaaS Engineering', 785, 'react, node, next', 'web app'],
                        ['iOS, Android & Cross-Platform', 91, 'flutter, react native', 'mobile app'],
                        ['E-commerce stores', 827, 'shopify, woocommerce', 'online store'],
                        ['Business websites', 702, 'wordpress, landing page', 'company site'],
                      ]).map((sub, sidx) => (
                        <div key={sidx} style={{ padding: 12, borderRadius: 12, border: '1px solid var(--ln)', background: 'var(--sf2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <b style={{ fontSize: 14 }}>{sub[0]}</b>
                          <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>{sub[1]} partners available</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Synonyms & Search Keywords */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--ln)', paddingTop: 16 }}>
                    <b style={{ fontSize: 15 }}>Words people use · helps WhatsApp Smart mapping</b>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(tax[selectedSectorIdx]?.cats[selectedCatIdx]?.syn || ['web app', 'software developer', 'app developer', 'mobile app', 'online store', 'ecommerce website', 'website banana']).map((syn, syni) => (
                        <span key={syni} className="chip" style={{ background: 'var(--sf3)', color: 'var(--tx)' }}>
                          {syn}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Who Offers This */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--ln)', paddingTop: 16 }}>
                    <b style={{ fontSize: 15 }}>Who offers this · sample partners</b>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                      {[
                        { name: 'Klo Tech Pvt Ltd', city: 'Mumbai', verified: true, rating: '4.9 ★', claims: '28 replies' },
                        { name: 'Srujan Digital Studio', city: 'Hyderabad', verified: true, rating: '4.8 ★', claims: '42 replies' },
                        { name: 'Pixel Forge Labs', city: 'Pune', verified: true, rating: '4.7 ★', claims: '19 replies' },
                      ].map((p, pi) => (
                        <div key={pi} style={{ padding: 12, borderRadius: 12, border: '1px solid var(--ln)', background: 'var(--sf)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <b style={{ fontSize: 13.5 }}>{p.name}</b>
                            <span style={{ fontSize: 12, color: 'var(--tx2)' }}>{p.city} · {p.rating}</span>
                          </div>
                          <span className="chip g">Verified</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* ==================== 8. SCREEN: AUTOMATION ==================== */}
          {screen === 'auto' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="phead">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Automation</h1>
                  <span className="subt">WhatsApp assistant · 18-state deterministic engine, lead matching &amp; auto-onboarding</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="chip" style={autoPaused ? { background: 'var(--rbg)', color: 'var(--rtx)' } : { background: 'var(--gbg)', color: 'var(--gtx)' }}>
                    {autoPaused ? 'Paused' : 'Meta API Live'}
                  </span>
                  <button
                    type="button"
                    className="btn b3"
                    onClick={() => {
                      setAutoPaused(p => !p);
                      toast(autoPaused ? 'Automation resumed' : 'All WhatsApp automation paused');
                      logAudit(autoPaused ? 'Resumed WhatsApp automation' : 'Paused all automation', 'Automation');
                    }}
                  >
                    {autoPaused ? 'Resume automation' : 'Pause all'}
                  </button>
                </div>
              </div>

              {/* View Tabs */}
              <div role="tablist" aria-label="Automation Views" className="views">
                {[
                  { id: 'over', l: 'Overview' },
                  { id: 'convos', l: `Conversations (${db.convos.length})` },
                  { id: 'journey', l: 'Try it (Simulator)' },
                  { id: 'map', l: 'Smart mapping' },
                  { id: 'features', l: 'Smart features' },
                  { id: 'rules', l: 'Rules & Safety' },
                ].map((v) => {
                  const on = (viewTab.auto || 'over') === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="tab"
                      className="vt"
                      aria-selected={on}
                      onClick={() => setViewTab((prev) => ({ ...prev, auto: v.id }))}
                      style={{ color: on ? 'var(--tx)' : 'var(--tx2)', borderBottomColor: on ? '#C8102E' : 'transparent' }}
                    >
                      {v.l}
                    </button>
                  );
                })}
              </div>

              {/* Tab 1: Overview */}
              {(viewTab.auto || 'over') === 'over' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* 4 KPIs */}
                  <div className="g4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className="lbl">Sent · 24 h</span>
                      <b style={{ fontSize: 24 }}>412</b>
                      <span style={{ fontSize: 12, color: 'var(--tx2)' }}>Templates &amp; replies</span>
                    </div>
                    <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className="lbl">Delivered</span>
                      <b style={{ fontSize: 24, color: '#16A34A' }}>98.6%</b>
                      <span style={{ fontSize: 12, color: 'var(--tx2)' }}>Meta delivery receipts</span>
                    </div>
                    <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className="lbl">Replied</span>
                      <b style={{ fontSize: 24 }}>41%</b>
                      <span style={{ fontSize: 12, color: 'var(--tx2)' }}>Within 5 minutes</span>
                    </div>
                    <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className="lbl">Needs a person</span>
                      <b style={{ fontSize: 24, color: supportConvoCount > 0 ? '#C8102E' : 'inherit' }}>{supportConvoCount}</b>
                      <span style={{ fontSize: 12, color: 'var(--tx2)' }}>Coordinator queued</span>
                    </div>
                  </div>

                  <div className="two" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
                    {/* Where conversations are now */}
                    <section className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <h2 className="lbl" style={{ margin: 0 }}>Where conversations are now · 18 States</h2>
                      {[
                        { k: 'ACTIVE', n: 42, w: '70%', c: '#16A34A' },
                        { k: 'OFFER_SENT', n: 6, w: '12%', c: '#1F5FBF' },
                        { k: 'MATCHING', n: 4, w: '8%', c: '#1F5FBF' },
                        { k: 'ONBOARDING', n: 5, w: '9%', c: '#F59E0B' },
                        { k: 'REQUIREMENT_DRAFT', n: 3, w: '5%', c: '#F59E0B' },
                        { k: 'CONSENT_PENDING', n: 2, w: '4%', c: '#6B7280' },
                        { k: 'SUPPORT_REVIEW', n: 1, w: '2%', c: '#DC2626' },
                      ].map((st, i) => (
                        <button
                          key={i}
                          type="button"
                          className="strow"
                          onClick={() => {
                            setViewTab(prev => ({ ...prev, auto: 'convos' }));
                            setQ(st.k);
                          }}
                        >
                          <span className="mono" style={{ flex: '0 0 170px' }}>{st.k}</span>
                          <span style={{ flex: 1, height: 10, borderRadius: 5, background: 'var(--sf3)', overflow: 'hidden' }}>
                            <i style={{ display: 'block', height: '100%', background: st.c, width: st.w }} />
                          </span>
                          <b style={{ flex: '0 0 64px', textAlign: 'right', fontSize: 13.5 }}>{st.n}</b>
                        </button>
                      ))}
                    </section>

                    {/* Channel Health Card */}
                    <section className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <h2 className="lbl" style={{ margin: 0 }}>Channel health &amp; compliance</h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--ln)' }}>
                          <span style={{ fontSize: 13.5 }}>Meta Cloud API status</span>
                          <span className="chip g">Connected</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--ln)' }}>
                          <span style={{ fontSize: 13.5 }}>Webhook latency</span>
                          <span style={{ fontWeight: 700, fontSize: 13.5 }}>210 ms</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--ln)' }}>
                          <span style={{ fontSize: 13.5 }}>Quality Rating</span>
                          <span className="chip g">HIGH</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                          <span style={{ fontSize: 13.5 }}>Phone number</span>
                          <span className="mono" style={{ fontSize: 13.5 }}>+91 40 4917 2200</span>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {/* Tab 2: Conversations */}
              {viewTab.auto === 'convos' && (
                <section className="card" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <div className="tool">
                    <label className="srchw">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A4F59" strokeWidth="2.2">
                        <circle cx="11" cy="11" r="7"></circle>
                        <path d="m20 20-3.5-3.5"></path>
                      </svg>
                      <input
                        type="search"
                        className="srch"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Filter conversations..."
                      />
                    </label>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(180px, 1.5fr) 100px 180px 100px minmax(220px, 2fr) 110px', minWidth: 990 }}>
                      <div className="th">Convo ID</div>
                      <div className="th">Contact</div>
                      <div className="th">Role</div>
                      <div className="th">State</div>
                      <div className="th">Language</div>
                      <div className="th">Last Message</div>
                      <div className="th">Action</div>

                      {db.convos.filter(c => !q || c._s.includes(q.toLowerCase())).map((c) => (
                        <React.Fragment key={c.id}>
                          <div className="td mono">{c.id}</div>
                          <div className="td" style={{ cursor: 'pointer' }} onClick={() => openItemDrawer('convo', c)}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <b style={{ color: '#C8102E' }}>{c.name}</b>
                              <span style={{ fontSize: 11, color: 'var(--tx3)' }}>{c.phone}</span>
                            </div>
                          </div>
                          <div className="td">
                            <span className="chip" style={c.role === 'Partner' ? { background: 'var(--bbg)', color: 'var(--btx)' } : { background: 'var(--pbg)', color: 'var(--ptx)' }}>
                              {c.role}
                            </span>
                          </div>
                          <div className="td mono">
                            <span className="chip" style={c.st === 'SUPPORT_REVIEW' ? { background: 'var(--rbg)', color: 'var(--rtx)' } : { background: 'var(--sf3)', color: 'var(--tx)' }}>
                              {c.st}
                            </span>
                          </div>
                          <div className="td">{c.lang}</div>
                          <div className="td" style={{ fontSize: 12.5, color: 'var(--tx2)' }}>{c.last}</div>
                          <div className="td">
                            <button
                              type="button"
                              className="btn b2"
                              style={{ minHeight: 32, padding: '0 8px', fontSize: 12 }}
                              onClick={() => {
                                const newPaused = !c.paused;
                                setDb((prev) => ({
                                  ...prev,
                                  convos: prev.convos.map((item) =>
                                    item.id === c.id ? { ...item, paused: newPaused } : item
                                  ),
                                }));
                                toast(newPaused ? `Assistant paused for ${c.name} · Coordinator takeover active` : `Assistant resumed for ${c.name}`);
                              }}
                            >
                              {c.paused ? 'Resume Bot' : 'Takeover'}
                            </button>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Tab 3: Try It Simulator */}
              {viewTab.auto === 'journey' && (
                <section className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <b style={{ fontSize: 18 }}>Interactive WhatsApp Message Parser</b>
                  <span style={{ fontSize: 13.5, color: 'var(--tx2)' }}>
                    Type any realistic B2B requirement, supplier pitch, or Hindi/English voice transcript to test intent parsing.
                  </span>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <input
                      className="inp"
                      style={{ flex: 1 }}
                      value={simText}
                      onChange={(e) => setSimText(e.target.value)}
                      placeholder="Type or paste a message..."
                    />
                    <button type="button" className="btn b1" onClick={() => runSimulator(simText)}>
                      Parse Message
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12.5, color: 'var(--tx2)', alignSelf: 'center' }}>Try samples:</span>
                    {[
                      'hum corrugated box aur mono carton banate hai, Chakan Pune',
                      'need 5-store shopify website and billing integration within 3 weeks',
                      'rooftop solar 50kw net metering required in Nagpur warehouse',
                      'STOP',
                      'SUPPORT can I talk to an executive?',
                    ].map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="btn b2"
                        style={{ minHeight: 30, fontSize: 12 }}
                        onClick={() => {
                          setSimText(s);
                          runSimulator(s);
                        }}
                      >
                        {s.slice(0, 36)}...
                      </button>
                    ))}
                  </div>

                  {simResult && (
                    <div style={{ padding: 18, borderRadius: 12, background: 'var(--sf2)', border: '1px solid var(--ln)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <b style={{ fontSize: 15, color: 'var(--gtx)' }}>✓ Match Extracted (Confidence: {simResult.confidence}%)</b>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 4 }}>
                        <div>
                          <span className="lbl">Classified Role</span>
                          <p style={{ margin: '4px 0 0', fontWeight: 700 }}>{simResult.role}</p>
                        </div>
                        <div>
                          <span className="lbl">Target Category</span>
                          <p style={{ margin: '4px 0 0', fontWeight: 700 }}>{simResult.cat}</p>
                        </div>
                        <div>
                          <span className="lbl">Target City</span>
                          <p style={{ margin: '4px 0 0', fontWeight: 700 }}>{simResult.city}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Tab 5: Smart Features */}
              {viewTab.auto === 'features' && (
                <section className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <b style={{ fontSize: 18 }}>Smart features · WhatsApp and the app as one</b>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
                    {[
                      { t: 'Voice notes', d: 'Understand voice notes in Hindi, English and Hinglish and turn them into requirements or replies' },
                      { t: 'Photos and documents', d: 'Read sample photos, spec sheets and catalogues with OCR confirmation' },
                      { t: 'Compare as cards', d: 'Batch partner replies for 2 minutes into one swipeable card message' },
                      { t: 'One-tap sign-in links', d: 'Links in chat open the exact app screen, signed in, for 15 minutes, single use' },
                      { t: 'No double pings', d: 'Send each alert where the person is active; clear it everywhere once read' },
                      { t: 'Evening digest', d: 'Bundle low-priority updates into one message at 7 pm' },
                      { t: 'Tailored pitches', d: 'Draft a pitch for each lead from the partner profile and past wins' },
                      { t: 'Deal check-in', d: 'Ask the client 3 days after connecting; close the request and collect a rating' },
                    ].map((f, i) => (
                      <div key={i} style={{ padding: 14, borderRadius: 12, border: '1px solid var(--ln)', background: 'var(--sf2)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <input type="checkbox" className="swt" defaultChecked style={{ marginTop: 2 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <b style={{ fontSize: 14 }}>{f.t}</b>
                          <span style={{ fontSize: 12.5, color: 'var(--tx2)', lineHeight: 1.4 }}>{f.d}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Tab 4: Smart Mapping */}
              {viewTab.auto === 'map' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="two" style={{ alignItems: 'start' }}>
                    <section className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <h2 className="lbl" style={{ margin: 0 }}>Try Intent Resolution</h2>
                      <label className="fld">
                        <span>What a partner or client might type</span>
                        <input
                          className="inp"
                          value={simText}
                          onChange={(e) => setSimText(e.target.value)}
                          placeholder="e.g. 5000 dabba printing Chakan Pune"
                        />
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 54px', gap: 10, alignItems: 'center' }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600 }}>Corrugated &amp; Carton Boxes</span>
                          <span style={{ height: 8, borderRadius: 4, background: 'var(--sf3)', overflow: 'hidden' }}>
                            <i style={{ display: 'block', height: '100%', background: '#1D7A45', width: '92%' }} />
                          </span>
                          <span className="chip g">92%</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 54px', gap: 10, alignItems: 'center' }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600 }}>Commercial Offset Printing</span>
                          <span style={{ height: 8, borderRadius: 4, background: 'var(--sf3)', overflow: 'hidden' }}>
                            <i style={{ display: 'block', height: '100%', background: '#B8860B', width: '48%' }} />
                          </span>
                          <span className="chip a">48%</span>
                        </div>
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--tx2)' }}>
                        Resolved to Corrugated &amp; Carton Boxes &middot; routed directly to packaging partners.
                      </span>
                    </section>

                    <section className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <h2 className="lbl" style={{ margin: 0 }}>How sure before acting</h2>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <label className="fld">
                          <span>Show the match at (%)</span>
                          <input
                            className="inp"
                            value={auto.hi}
                            onChange={(e) => setAuto((prev) => ({ ...prev, hi: e.target.value }))}
                          />
                        </label>
                        <label className="fld">
                          <span>Ask one question at (%)</span>
                          <input
                            className="inp"
                            value={auto.lo}
                            onChange={(e) => setAuto((prev) => ({ ...prev, lo: e.target.value }))}
                          />
                        </label>
                      </div>
                      <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>
                        Below the second threshold the assistant asks what specific item they manufacture or service.
                      </span>
                      <h2 className="lbl" style={{ margin: '6px 0 0' }}>Languages understood</h2>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 20px' }}>
                        {auto.langs.map((l, li) => (
                          <label key={li} className="swl">
                            <input
                              type="checkbox"
                              role="switch"
                              className="swt"
                              checked={l.on}
                              onChange={() => {
                                setAuto((prev) => ({
                                  ...prev,
                                  langs: prev.langs.map((item, idx) =>
                                    idx === li ? { ...item, on: !item.on } : item
                                  ),
                                }));
                              }}
                            />
                            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{l.k}</span>
                          </label>
                        ))}
                      </div>
                    </section>
                  </div>

                  <section className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', borderBottom: '1px solid var(--ln)' }}>
                      <h2 className="lbl" style={{ margin: 0 }}>Words that didn&apos;t map &middot; 4 pending</h2>
                      <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>Teach the assistant once; every future WhatsApp message benefits</span>
                    </div>
                    {[
                      { w: 'dabba printing', n: 18, ex: '500 dabba printing chahiye for mithai shop', opts: ['Corrugated & Carton Boxes', 'Commercial Offset Printing', 'Labels & Stickers'] },
                      { w: 'reels shoot', n: 12, ex: 'fashion brand reels shoot in Bandra', opts: ['Corporate Video & Ad Film Production', 'Commercial Photography', 'Digital Marketing'] },
                      { w: 'cctv amc', n: 9, ex: 'godown CCTV AMC quarterly visit Pune', opts: ['CCTV & Electronic Surveillance', 'IT Hardware & Networking', 'Facility Management'] },
                      { w: 'laser cut sheet', n: 7, ex: 'SS 304 3mm laser cut sheet 50 pcs', opts: ['Sheet Metal Fabrication', 'CNC Machining & Milling', 'Industrial Hardware'] },
                    ].map((u, ui) => (
                      <div key={ui} className="wrow">
                        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                          <b style={{ fontSize: 14 }}>&ldquo;{u.w}&rdquo;</b>
                          <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>{u.n} people &middot; e.g. {u.ex}</span>
                        </span>
                        <select className="sel" aria-label={`Category for ${u.w}`} defaultValue={u.opts[0]}>
                          {u.opts.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                        <button type="button" className="tbtn" onClick={() => toast(`Added "${u.w}" as synonym for ${u.opts[0]}`)}>
                          Add as synonym
                        </button>
                        <button type="button" className="tbtn" onClick={() => toast(`Ignored "${u.w}"`)}>
                          Ignore
                        </button>
                      </div>
                    ))}
                  </section>
                </div>
              )}

              {/* Tab 6: Rules & Safety */}
              {viewTab.auto === 'rules' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <section className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--ln)' }}>
                      <h2 className="lbl" style={{ margin: 0 }}>Keywords &middot; work in any conversation state</h2>
                    </div>
                    {[
                      { w: 'STOP', does: 'Pauses bot immediately, unsubscribes number and marks do-not-contact', reply: 'You have been unsubscribed from XPO India. Reply START anytime to resume.', lock: true },
                      { w: 'HELP', does: 'Gives coordinator contact number and WhatsApp support desk link', reply: 'XPO Help Desk: Call/WhatsApp +91 98200 12345 or reply to this chat with your query.', lock: false },
                      { w: 'RESET', does: 'Clears current draft requirement and restarts fresh prompt', reply: 'Starting fresh. What service or material do you need across India?', lock: false },
                      { w: 'MENU', does: 'Shows quick links to Post Requirement, Partner Directory, and My Requests', reply: '1. Post free requirement\n2. View active leads\n3. Talk to coordinator', lock: false },
                      { w: 'AGENT', does: 'Pauses bot and escalates to human coordinator queue', reply: 'Connecting you to an XPO coordinator right now. Hold on a moment.', lock: false },
                    ].map((k, ki) => (
                      <div key={ki} className="krow">
                        <span className="mono" style={{ fontWeight: 700 }}>{k.w}</span>
                        <span style={{ fontSize: 13, color: 'var(--tx2)' }}>{k.does}</span>
                        <input className="inp" aria-label={`Reply to ${k.w}`} defaultValue={k.reply} />
                        <label className="swl">
                          <input type="checkbox" role="switch" className="swt" defaultChecked disabled={k.lock} aria-label={`${k.w} on or off`} />
                        </label>
                      </div>
                    ))}
                  </section>

                  <div className="two" style={{ alignItems: 'start' }}>
                    <section className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <h2 className="lbl" style={{ margin: 0 }}>Hand over to coordinator</h2>
                      <label className="fld">
                        <span>When assistant is unsure</span>
                        <input
                          className="inp"
                          value={`After ${auto.misses} misses in a row`}
                          onChange={(e) => setAuto((prev) => ({ ...prev, misses: e.target.value.replace(/\D/g, '') || '2' }))}
                        />
                      </label>
                      <label className="fld">
                        <span>Coordinator operational hours</span>
                        <input
                          className="inp"
                          value={auto.hours}
                          onChange={(e) => setAuto((prev) => ({ ...prev, hours: e.target.value }))}
                        />
                      </label>
                      <label className="fld">
                        <span>User SLA promise</span>
                        <input
                          className="inp"
                          value={auto.promise}
                          onChange={(e) => setAuto((prev) => ({ ...prev, promise: e.target.value }))}
                        />
                      </label>
                    </section>

                    <section className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <h2 className="lbl" style={{ margin: 0 }}>Sending limits &amp; Quiet hours</h2>
                      <label className="fld">
                        <span>Quiet hours (no proactive messages)</span>
                        <input
                          className="inp"
                          value={auto.quiet}
                          onChange={(e) => setAuto((prev) => ({ ...prev, quiet: e.target.value }))}
                        />
                      </label>
                      <label className="fld">
                        <span>Meta API throughput limit</span>
                        <input
                          className="inp"
                          value={`${auto.rate} messages / min`}
                          onChange={(e) => setAuto((prev) => ({ ...prev, rate: e.target.value.replace(/\D/g, '') || '500' }))}
                        />
                      </label>
                      <label className="fld">
                        <span>Failed send retries</span>
                        <input
                          className="inp"
                          value={`${auto.retries} retries over 10 min`}
                          onChange={(e) => setAuto((prev) => ({ ...prev, retries: e.target.value.replace(/\D/g, '') || '3' }))}
                        />
                      </label>
                    </section>
                  </div>

                  <section className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <h2 className="lbl" style={{ margin: 0 }}>Payments inside the chat &middot; prices come from Plans</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, alignItems: 'end' }}>
                      <label className="fld">
                        <span>India</span>
                        <select className="inp" defaultValue="Razorpay">
                          <option value="Razorpay">Razorpay (UPI, card) &middot; PayPal as second option</option>
                          <option value="RazorpayOnly">Razorpay only</option>
                        </select>
                      </label>
                      <label className="fld">
                        <span>Outside India</span>
                        <select className="inp" disabled defaultValue="PayPal">
                          <option value="PayPal">PayPal only (US$)</option>
                        </select>
                      </label>
                      <label className="fld">
                        <span>Hold partner lead while paying (min)</span>
                        <input
                          className="inp"
                          value={auto.hold}
                          onChange={(e) => setAuto((prev) => ({ ...prev, hold: e.target.value }))}
                        />
                      </label>
                      <label className="fld">
                        <span>Payment link expires after (min)</span>
                        <input
                          className="inp"
                          value={auto.exp}
                          onChange={(e) => setAuto((prev) => ({ ...prev, exp: e.target.value }))}
                        />
                      </label>
                    </div>
                  </section>
                </div>
              )}
            </div>
          )}

          {/* ==================== 9. SCREEN: WEBSITE CMS ==================== */}
          {screen === 'site' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="phead">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Website CMS</h1>
                  <span className="subt">Landing page · xpoindia.com copy, sections &amp; FAQs</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="chip g">Live: {siteHist[0]?.w}</span>
                  <button
                    type="button"
                    className="btn b1"
                    onClick={() => {
                      setSiteHist(prev => [{ w: 'Just now', who: 'Pavan (Superadmin)', what: 'Updated website copy' }, ...prev]);
                      toast('Website updated · xpoindia.com refreshed');
                      logAudit('Published landing page updates', 'Website');
                    }}
                  >
                    Publish updates
                  </button>
                </div>
              </div>

              {/* View Tabs */}
              <div role="tablist" aria-label="Website Views" className="views">
                {[
                  { id: 'sections', l: 'Sections' },
                  { id: 'hero', l: 'Hero Copy' },
                  { id: 'faq', l: 'FAQs' },
                  { id: 'hist', l: 'Version History' },
                ].map((v) => {
                  const on = (viewTab.site || 'sections') === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="tab"
                      className="vt"
                      aria-selected={on}
                      onClick={() => setViewTab((prev) => ({ ...prev, site: v.id }))}
                      style={{ color: on ? 'var(--tx)' : 'var(--tx2)', borderBottomColor: on ? '#C8102E' : 'transparent' }}
                    >
                      {v.l}
                    </button>
                  );
                })}
              </div>

              {/* Tab 1: Sections Manager */}
              {(viewTab.site || 'sections') === 'sections' && (
                <section className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  {site.sections.map((s, idx) => (
                    <div key={s.k} className="wrow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="mono" style={{ color: 'var(--tx3)', width: 24 }}>{idx + 1}</span>
                        <div>
                          <b style={{ fontSize: 14.5 }}>{s.label}</b>
                          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--tx2)' }}>{s.note}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="chip" style={s.on ? { background: 'var(--gbg)', color: 'var(--gtx)' } : { background: 'var(--sf3)', color: 'var(--tx2)' }}>
                          {s.lock ? 'Locked (Always on)' : (s.on ? 'Shown' : 'Hidden')}
                        </span>
                        {!s.lock && (
                          <input
                            type="checkbox"
                            className="swt"
                            checked={s.on}
                            onChange={(e) => {
                              const next = { ...site };
                              next.sections[idx].on = e.target.checked;
                              setSite(next);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {/* Tab 2: Hero Copy Editor */}
              {viewTab.site === 'hero' && (
                <div className="two" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
                  {/* Client Hero */}
                  <section className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <b style={{ fontSize: 18 }}>Client Hero Headline</b>
                    <div className="fld">
                      <span>Line 1</span>
                      <input className="inp" defaultValue={site.hero.client.l1} />
                    </div>
                    <div className="fld">
                      <span>Line 2</span>
                      <input className="inp" defaultValue={site.hero.client.l2} />
                    </div>
                    <div className="fld">
                      <span>Subline</span>
                      <input className="inp" defaultValue={site.hero.client.sub} />
                    </div>
                    <div className="fld">
                      <span>Requirement Box Placeholder</span>
                      <input className="inp" defaultValue={site.hero.client.ph} />
                    </div>
                    <button type="button" className="btn b3" style={{ alignSelf: 'flex-start' }} onClick={() => toast('Client Hero copy saved')}>
                      Save Client Copy
                    </button>
                  </section>

                  {/* Partner Hero */}
                  <section className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <b style={{ fontSize: 18 }}>Partner Hero Headline</b>
                    <div className="fld">
                      <span>Line 1</span>
                      <input className="inp" defaultValue={site.hero.partner.l1} />
                    </div>
                    <div className="fld">
                      <span>Line 2</span>
                      <input className="inp" defaultValue={site.hero.partner.l2} />
                    </div>
                    <div className="fld">
                      <span>Subline</span>
                      <input className="inp" defaultValue={site.hero.partner.sub} />
                    </div>
                    <div className="fld">
                      <span>Supplier Box Placeholder</span>
                      <input className="inp" defaultValue={site.hero.partner.ph} />
                    </div>
                    <button type="button" className="btn b3" style={{ alignSelf: 'flex-start' }} onClick={() => toast('Partner Hero copy saved')}>
                      Save Partner Copy
                    </button>
                  </section>
                </div>
              )}

              {/* Tab 3: FAQs */}
              {viewTab.site === 'faq' && (
                <section className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  {site.faqs.map((f, _i) => (
                    <div key={f.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--ln)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <b style={{ fontSize: 15 }}>{f.q}</b>
                        <button type="button" className="btn bl" style={{ color: 'var(--rtx)' }} onClick={() => toast('FAQ deleted')}>Delete</button>
                      </div>
                      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--tx2)', lineHeight: 1.5 }}>{f.a}</p>
                    </div>
                  ))}
                  <div style={{ padding: 16 }}>
                    <button type="button" className="btn b2" onClick={() => toast('Add FAQ dialog opened')}>+ Add new question</button>
                  </div>
                </section>
              )}

              {/* Tab 4: Version History */}
              {viewTab.site === 'hist' && (
                <section className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  {siteHist.map((h, i) => (
                    <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid var(--ln)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <b style={{ fontSize: 14 }}>{h.what}</b>
                        <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>{h.who} · {h.w}</span>
                      </div>
                      {i > 0 && (
                        <button type="button" className="btn b2" style={{ minHeight: 32 }} onClick={() => toast('Rolled back to revision')}>Roll back</button>
                      )}
                    </div>
                  ))}
                </section>
              )}
            </div>
          )}

          {/* ==================== 10. SCREEN: SETTINGS ==================== */}
          {screen === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="phead">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Settings</h1>
                  <span className="subt">Wave matching engine rules, payment keys &amp; WhatsApp Meta credentials</span>
                </div>
              </div>

              {/* View Tabs */}
              <div role="tablist" aria-label="Settings Views" className="views">
                {[
                  { id: 'match', l: 'Wave Matching Rules' },
                  { id: 'pay', l: 'Payment Gateways' },
                  { id: 'msg', l: 'WhatsApp Meta API' },
                  { id: 'team', l: 'Team & Audit Log' },
                ].map((v) => {
                  const on = (viewTab.settings || 'match') === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="tab"
                      className="vt"
                      aria-selected={on}
                      onClick={() => setViewTab((prev) => ({ ...prev, settings: v.id }))}
                      style={{ color: on ? 'var(--tx)' : 'var(--tx2)', borderBottomColor: on ? '#C8102E' : 'transparent' }}
                    >
                      {v.l}
                    </button>
                  );
                })}
              </div>

              {/* Tab 1: Wave Rules */}
              {(viewTab.settings || 'match') === 'match' && (
                <section className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <b style={{ fontSize: 18 }}>5-Minute Wave Distribution Rules (PDF 1 Sec 11)</b>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                    <div className="fld">
                      <span>Partners per round</span>
                      <input className="inp mono" defaultValue="3" />
                      <span style={{ fontSize: 11.5, color: 'var(--tx2)' }}>Fixed 3 partners offered per wave</span>
                    </div>
                    <div className="fld">
                      <span>Response window (seconds)</span>
                      <input className="inp mono" defaultValue="300" />
                      <span style={{ fontSize: 11.5, color: 'var(--tx2)' }}>Exactly 300 seconds (5 minutes)</span>
                    </div>
                    <div className="fld">
                      <span>Target claims before closing</span>
                      <input className="inp mono" defaultValue="3" />
                      <span style={{ fontSize: 11.5, color: 'var(--tx2)' }}>Moves to interested upon 3 claims</span>
                    </div>
                    <div className="fld">
                      <span>Delivery fallback clock (sec)</span>
                      <input className="inp mono" defaultValue="60" />
                      <span style={{ fontSize: 11.5, color: 'var(--tx2)' }}>Starts if Meta read receipt delayed</span>
                    </div>
                  </div>
                  <button type="button" className="btn b3" style={{ alignSelf: 'flex-start' }} onClick={() => toast('Wave matching rules saved')}>
                    Save Wave Rules
                  </button>
                </section>
              )}

              {/* Tab 2: Gateways */}
              {viewTab.settings === 'pay' && (
                <div className="two" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
                  <section className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <b style={{ fontSize: 17 }}>Razorpay (India UPI AutoPay &amp; Cards)</b>
                    <div className="fld">
                      <span>Key ID</span>
                      <input className="inp mono" defaultValue="rzp_live_9482019481" />
                    </div>
                    <div className="fld">
                      <span>Key Secret</span>
                      <input className="inp mono" type="password" defaultValue="••••••••••••••••" />
                    </div>
                    <div className="fld">
                      <span>Webhook Secret</span>
                      <input className="inp mono" type="password" defaultValue="••••••••••••••••" />
                    </div>
                    <button type="button" className="btn b3" style={{ alignSelf: 'flex-start' }} onClick={() => toast('Razorpay credentials updated')}>
                      Save Razorpay Keys
                    </button>
                  </section>

                  <section className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <b style={{ fontSize: 17 }}>PayPal (International USD Checkout)</b>
                    <div className="fld">
                      <span>Client ID</span>
                      <input className="inp mono" defaultValue="AY7k8194_live_client" />
                    </div>
                    <div className="fld">
                      <span>Secret</span>
                      <input className="inp mono" type="password" defaultValue="••••••••••••••••" />
                    </div>
                    <button type="button" className="btn b3" style={{ alignSelf: 'flex-start' }} onClick={() => toast('PayPal credentials updated')}>
                      Save PayPal Keys
                    </button>
                  </section>
                </div>
              )}

              {/* Tab 3: WhatsApp Meta API */}
              {viewTab.settings === 'msg' && (
                <section className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <b style={{ fontSize: 17 }}>Meta Cloud API Credentials</b>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                    <div className="fld">
                      <span>Phone Number ID</span>
                      <input className="inp mono" defaultValue="104928172948201" />
                    </div>
                    <div className="fld">
                      <span>WhatsApp Business Account (WABA) ID</span>
                      <input className="inp mono" defaultValue="918274019284710" />
                    </div>
                    <div className="fld" style={{ gridColumn: '1 / -1' }}>
                      <span>System User Permanent Access Token</span>
                      <input className="inp mono" type="password" defaultValue="EAAK...••••••••••••••••" />
                    </div>
                    <div className="fld" style={{ gridColumn: '1 / -1' }}>
                      <span>Webhook Verify Token</span>
                      <input className="inp mono" defaultValue="xpo_india_webhook_secret_2026" />
                    </div>
                  </div>
                  <button type="button" className="btn b3" style={{ alignSelf: 'flex-start' }} onClick={() => toast('Meta API credentials saved & webhook verified')}>
                    Save Meta Credentials
                  </button>
                </section>
              )}

              {/* Tab 4: Team & Audit */}
              {viewTab.settings === 'team' && (
                <section className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--ln)' }}>
                    <b style={{ fontSize: 16 }}>Operator Audit Log</b>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '160px 180px minmax(240px, 2fr) 120px', minWidth: 700 }}>
                      <div className="th">Timestamp</div>
                      <div className="th">Operator</div>
                      <div className="th">Action Taken</div>
                      <div className="th">Category</div>
                      {auditLog.map((log, i) => (
                        <React.Fragment key={i}>
                          <div className="td" style={{ color: 'var(--tx2)' }}>{log.ts}</div>
                          <div className="td"><b>{log.op}</b></div>
                          <div className="td">{log.act}</div>
                          <div className="td">
                            <span className="chip" style={{ background: 'var(--sf3)', color: 'var(--tx)' }}>{log.cat}</span>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ===================== SLIDE-OVER DRAWER ===================== */}
      {dr && (
        <>
          <div className="scrim" onClick={() => setDr(null)} />
          <div className="drawer" role="dialog" aria-modal="true" style={{ animation: 'slideIn 0.2s ease-out' }}>
            <div className="dh">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="lbl">{dr.type.toUpperCase()} DETAILS</span>
                <button type="button" className="btn bl" onClick={() => setDr(null)} style={{ fontSize: 18 }}>×</button>
              </div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{dr.item.title || dr.item.name || dr.item.who || dr.item.code}</h2>
              <div style={{ display: 'flex', gap: 6 }}>
                {dr.item.st && <span className="chip g">{dr.item.st}</span>}
                {dr.item.role && <span className="chip b">{dr.item.role}</span>}
                {dr.item.city && <span className="chip">{dr.item.city}</span>}
              </div>
            </div>

            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflowY: 'auto' }}>
              {/* Alert Callouts */}
              {dr.item.st === 'held' && (
                <div style={{ padding: 12, borderRadius: 10, background: 'var(--rbg)', color: 'var(--rtx)', fontSize: 13, lineHeight: 1.5 }}>
                  <b>Held automatically:</b> Flagged keyword &ldquo;{dr.item.keyword}&rdquo;. Review specifications before distributing to partners.
                </div>
              )}
              {dr.item.kyc === 'In review' && (
                <div style={{ padding: 12, borderRadius: 10, background: 'var(--bbg)', color: 'var(--btx)', fontSize: 13, lineHeight: 1.5 }}>
                  <b>KYC Verification Required:</b> GSTIN Registration Certificate uploaded. Verify details against the GST portal.
                </div>
              )}
              {dr.item.st === 'Failed' && (
                <div style={{ padding: 12, borderRadius: 10, background: 'var(--rbg)', color: 'var(--rtx)', fontSize: 13, lineHeight: 1.5 }}>
                  <b>Payment Failed:</b> Mandate renewal failed. The member was notified and can retry from their billing page.
                </div>
              )}

              {/* Key Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <b style={{ fontSize: 14 }}>Properties</b>
                <div style={{ border: '1px solid var(--ln)', borderRadius: 12, overflow: 'hidden' }}>
                  {Object.entries(dr.item)
                    .filter(([k]) => !k.startsWith('_') && k !== 'title' && k !== 'name')
                    .slice(0, 8)
                    .map(([k, v]) => (
                      <div key={k} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', padding: '10px 14px', borderBottom: '1px solid var(--ln)', fontSize: 13 }}>
                        <span style={{ color: 'var(--tx2)', textTransform: 'capitalize' }}>{k}</span>
                        <b style={{ wordBreak: 'break-all' }}>{String(v)}</b>
                      </div>
                    ))}
                </div>
              </div>

              {/* Requirement Wave Offers */}
              {dr.type === 'req' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <b style={{ fontSize: 14 }}>5-Min Wave Lead Distribution</b>
                  <div style={{ border: '1px solid var(--ln)', borderRadius: 12, overflow: 'hidden' }}>
                    {[
                      { w: 'Wave 1', p: 'Klo Tech · Mumbai', r: 'Interested', c: 'var(--gtx)' },
                      { w: 'Wave 1', p: 'Srujan Digital · Hyderabad', r: 'Waiting (2m left)', c: 'var(--btx)' },
                      { w: 'Wave 1', p: 'Pixel Forge · Pune', r: 'Passed', c: 'var(--tx3)' },
                    ].map((off, oidx) => (
                      <div key={oidx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--ln)', fontSize: 13 }}>
                        <span><b>{off.w}:</b> {off.p}</span>
                        <span style={{ fontWeight: 700, color: off.c }}>{off.r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="df">
              {dr.type === 'req' && dr.item.st === 'held' && (
                <>
                  <button
                    type="button"
                    className="btn b1"
                    onClick={() => {
                      const code = dr.item.code;
                      setDb((prev) => ({
                        ...prev,
                        reqs: prev.reqs.map((r) =>
                          r.code === code ? { ...r, st: 'live', wave: 1 } : r
                        ),
                      }));
                      toast(`Approved ${code} · Wave 1 dispatched to 3 partners`);
                      logAudit(`Approved ${code}`, 'Moderation');
                      setDr(null);
                    }}
                  >
                    Approve requirement
                  </button>
                  <button
                    type="button"
                    className="btn b2"
                    onClick={() => {
                      const code = dr.item.code;
                      setDb((prev) => ({
                        ...prev,
                        reqs: prev.reqs.map((r) =>
                          r.code === code ? { ...r, st: 'changes' } : r
                        ),
                      }));
                      toast(`Changes requested on ${code}`);
                      logAudit(`Requested changes on ${code}`, 'Moderation');
                      setDr(null);
                    }}
                  >
                    Ask for changes
                  </button>
                </>
              )}

              {dr.type === 'member' && dr.item.kyc === 'In review' && (
                <>
                  <button
                    type="button"
                    className="btn bg"
                    onClick={() => {
                      const id = dr.item.id;
                      const name = dr.item.name;
                      setDb((prev) => ({
                        ...prev,
                        members: prev.members.map((m) =>
                          m.id === id ? { ...m, kyc: 'Verified' as const } : m
                        ),
                      }));
                      toast(`${name} verified · Verified badge added`);
                      logAudit(`Verified KYC for ${name}`, 'Members');
                      setDr(null);
                    }}
                  >
                    Verify KYC
                  </button>
                  <button
                    type="button"
                    className="btn b2"
                    onClick={() => {
                      const id = dr.item.id;
                      const name = dr.item.name;
                      setDb((prev) => ({
                        ...prev,
                        members: prev.members.map((m) =>
                          m.id === id ? { ...m, kyc: 'Pending' as const } : m
                        ),
                      }));
                      toast(`KYC rejected for ${name}`);
                      setDr(null);
                    }}
                  >
                    Reject KYC
                  </button>
                </>
              )}

              {dr.type === 'pay' && dr.item.st === 'Failed' && (
                <button
                  type="button"
                  className="btn b3"
                  onClick={() => {
                    toast(`Payment link resent to ${dr.item.who}`);
                    setDr(null);
                  }}
                >
                  Resend Payment Link
                </button>
              )}

              {dr.type === 'contact' && (
                <button
                  type="button"
                  className="btn b1"
                  onClick={() => {
                    toast(`WhatsApp invitation sent to ${dr.item.name}`);
                    setDr(null);
                  }}
                >
                  Send WhatsApp Invite
                </button>
              )}

              <button type="button" className="btn b2" onClick={() => setDr(null)}>
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* ===================== UPLOAD EXCEL MODAL ===================== */}
      {up > 0 && (
        <>
          <div className="scrim" onClick={() => setUp(0)} />
          <div className="modal card" role="dialog" aria-modal="true">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b style={{ fontSize: 18 }}>Upload Excel Contacts ({up === 1 ? 'Step 1: Choose File' : 'Step 2: Validation & Fixes'})</b>
              <button type="button" className="btn bl" onClick={() => setUp(0)}>×</button>
            </div>

            {up === 1 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="fld">
                  <span>Target Role</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ flex: 1, background: upRole === 'Partner' ? '#C8102E' : 'var(--sf2)', color: upRole === 'Partner' ? '#fff' : 'var(--tx)' }}
                      onClick={() => setUpRole('Partner')}
                    >
                      Partners (Suppliers)
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{ flex: 1, background: upRole === 'Client' ? '#C8102E' : 'var(--sf2)', color: upRole === 'Client' ? '#fff' : 'var(--tx)' }}
                      onClick={() => setUpRole('Client')}
                    >
                      Clients (Buyers)
                    </button>
                  </div>
                </div>
                <div className="fld">
                  <span>Excel File (.xlsx / .csv)</span>
                  <div style={{ padding: 24, border: '2px dashed var(--ln2)', borderRadius: 12, textAlign: 'center', background: 'var(--sf2)', cursor: 'pointer' }}>
                    <p style={{ margin: 0, fontWeight: 700 }}>partners_mumbai_nov.xlsx</p>
                    <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>185 rows found · columns auto-mapped</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" className="btn b2" onClick={() => setUp(0)}>Cancel</button>
                  <button type="button" className="btn b1" onClick={() => setUp(2)}>Check rows →</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <div style={{ padding: 12, borderRadius: 10, background: 'var(--gbg)', color: 'var(--gtx)' }}>
                    <b style={{ fontSize: 20 }}>181</b>
                    <p style={{ margin: 0, fontSize: 12.5 }}>Ready to import</p>
                  </div>
                  <div style={{ padding: 12, borderRadius: 10, background: 'var(--abg)', color: 'var(--atx)' }}>
                    <b style={{ fontSize: 20 }}>3</b>
                    <p style={{ margin: 0, fontSize: 12.5 }}>Fixed phone prefix</p>
                  </div>
                  <div style={{ padding: 12, borderRadius: 10, background: 'var(--rbg)', color: 'var(--rtx)' }}>
                    <b style={{ fontSize: 20 }}>1</b>
                    <p style={{ margin: 0, fontSize: 12.5 }}>Skipped duplicate</p>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" className="btn b2" onClick={() => setUp(1)}>Back</button>
                  <button
                    type="button"
                    className="btn b1"
                    onClick={() => {
                      setUp(0);
                      toast('Successfully imported 184 contacts · ready to invite');
                      logAudit('Imported 184 contacts from partners_mumbai_nov.xlsx', 'Contacts');
                    }}
                  >
                    Import 184 contacts
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===================== WHATSAPP INVITE MODAL ===================== */}
      {inviteModal && (
        <>
          <div className="scrim" onClick={() => setInviteModal(false)} />
          <div className="modal card" role="dialog" aria-modal="true">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b style={{ fontSize: 18 }}>Invite Contacts to WhatsApp</b>
              <button type="button" className="btn bl" onClick={() => setInviteModal(false)}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontSize: 13.5, color: 'var(--tx2)' }}>
                Sends Meta-approved WhatsApp template with one-tap verification button.
              </span>
              <div className="fld">
                <span>Select Template</span>
                <select className="sel" value={selectedMetaTpl} onChange={(e) => setSelectedMetaTpl(e.target.value)}>
                  <option value="partner_invitation">partner_invitation (Meta Approved)</option>
                  <option value="client_invitation">client_invitation (Meta Approved)</option>
                  <option value="opportunity_alert">opportunity_alert (Meta Approved)</option>
                </select>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: 'var(--sf2)', border: '1px solid var(--ln)', fontSize: 13, lineHeight: 1.5 }}>
                <b>Template Preview:</b>
                <p style={{ margin: '4px 0 0', color: 'var(--tx2)' }}>
                  &ldquo;Hello &#123;1&#125;, welcome to XPO India. Get verified B2B requirements directly on WhatsApp with zero commission.&rdquo;
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn b2" onClick={() => setInviteModal(false)}>Cancel</button>
                <button
                  type="button"
                  className="btn b1"
                  onClick={() => {
                    setInviteModal(false);
                    toast('Dispatched 42 WhatsApp invitation templates via Meta API');
                    logAudit('Dispatched 42 WhatsApp invitations', 'Contacts');
                  }}
                >
                  Send 42 Invites
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===================== TOAST NOTIFICATION ===================== */}
      {toastMsg && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--inv)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 14,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            zIndex: 100,
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* ===================== PROTOTYPE CONTROLS ===================== */}
      <div
        className="proto"
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 60,
          background: 'var(--sf)',
          border: '1px solid var(--ln2)',
          borderRadius: protoOpen ? 16 : 999,
          boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
          padding: protoOpen ? 16 : '8px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          maxWidth: 320,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setProtoOpen(p => !p)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: '#C8102E' }} />
            <b style={{ fontSize: 13 }}>Prototype Controls {protoOpen ? '▾' : '▸'}</b>
          </div>
        </div>

        {protoOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--ln)', paddingTop: 10 }}>
            <button
              type="button"
              className="ctl"
              onClick={() => {
                db.reqs.unshift({
                  id: 'R' + Date.now(),
                  code: 'XPO-REQ-' + Math.floor(Math.random() * 9000 + 10000),
                  client: 'Apex Traders',
                  title: '100MT Aluminium Extrusions in Pune',
                  cat: 'Manufacturing & Industrial',
                  city: 'Pune',
                  country: 'India',
                  tl: 'Within 2-4 Weeks',
                  budget: '₹40,00,000',
                  budgetN: 4000000,
                  st: 'held',
                  d: 0,
                  wave: 1,
                  interested: 0,
                  offered: 3,
                  keyword: 'advance registration fee',
                  _s: 'apex traders aluminium extrusions pune',
                });
                setDb({ ...db });
                toast('New held requirement triggered · review queue updated');
              }}
            >
              Trigger new held requirement
            </button>
            <button
              type="button"
              className="ctl"
              onClick={() => {
                db.members.unshift({
                  id: 'M' + Date.now(),
                  name: 'Apex Industrial · Karthik Reddy',
                  role: 'Partner',
                  city: 'Bengaluru',
                  country: 'India',
                  phone: '+91 99000•••• ••44',
                  email: 'apex@example.com',
                  cat: 'Industrial Packaging & Raw Materials',
                  kyc: 'In review',
                  plan: 'Partner Pro',
                  used: 1,
                  cap: 50,
                  d: 0,
                  last: 0,
                  st: 'Active',
                  _s: 'apex industrial karthik reddy bengaluru',
                });
                setDb({ ...db });
                toast('New partner KYC review triggered');
              }}
            >
              Trigger partner KYC pending
            </button>
            <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--ln)', paddingTop: 6 }}>
              <button type="button" className="btn b2 sm" style={{ flex: 1 }} onClick={() => router.push('/dashboard/client')}>
                Client app →
              </button>
              <button type="button" className="btn b2 sm" style={{ flex: 1 }} onClick={() => router.push('/dashboard/partner')}>
                Partner app →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default XpoSuperadminApp;
export { XpoSuperadminApp as XPOSuperadminApp };
