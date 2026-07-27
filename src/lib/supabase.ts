/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Validate if credentials are real or placeholder
export const isMockMode =
  !supabaseUrl ||
  supabaseUrl.includes('your-project-id') ||
  (!supabaseAnonKey && !supabaseServiceKey);

// Real Supabase Client
// On the server, this will use the service role key if available (bypassing RLS).
// On the client, this will fall back to the anon key.
export const supabase = createClient(
  isMockMode ? 'https://placeholder.supabase.co' : supabaseUrl,
  isMockMode ? 'placeholder-key' : (supabaseServiceKey || supabaseAnonKey)
);

// MOCK DATA LAYER (Local Storage fallback)
const DEFAULT_ORDERS = [
  {
    id: 'o1',
    order_number: 'ORD-20260601-001',
    customer_name: 'Apex Chemical Industries',
    order_date: '2026-06-01',
    status: 'Completed',
    total_amount: 14500.00,
    notes: 'Urgent delivery. Grade-A Hydrochloric Acid.',
    created_at: new Date('2026-06-01T10:00:00Z').toISOString(),
    updated_at: new Date('2026-06-01T10:00:00Z').toISOString(),
    items: [
      { id: 'oi1', product_name: 'Hydrochloric Acid 35%', quantity: 1000, unit: 'Liter', rate: 10, total: 10000 },
      { id: 'oi2', product_name: 'Sulfuric Acid 98%', quantity: 500, unit: 'kg', rate: 9, total: 4500 }
    ]
  },
  {
    id: 'o2',
    order_number: 'ORD-20260602-002',
    customer_name: 'Global Biotech Corp',
    order_date: '2026-06-02',
    status: 'Pending',
    total_amount: 8750.00,
    notes: 'Require certificate of analysis.',
    created_at: new Date('2026-06-02T11:30:00Z').toISOString(),
    updated_at: new Date('2026-06-02T11:30:00Z').toISOString(),
    items: [
      { id: 'oi3', product_name: 'Sodium Hydroxide (Caustic Soda)', quantity: 25, unit: 'Drum', rate: 350, total: 8750 }
    ]
  },
  {
    id: 'o3',
    order_number: 'ORD-20260603-003',
    customer_name: 'Pioneer Paint Ltd',
    order_date: '2026-06-03',
    status: 'Cancelled',
    total_amount: 3200.00,
    notes: 'Customer requested cancellation due to storage constraints.',
    created_at: new Date('2026-06-03T09:15:00Z').toISOString(),
    updated_at: new Date('2026-06-03T09:15:00Z').toISOString(),
    items: [
      { id: 'oi4', product_name: 'Acetone Purified', quantity: 200, unit: 'Liter', rate: 16, total: 3200 }
    ]
  }
];

const DEFAULT_CHALANS = [
  {
    id: 'c1',
    chalan_number: '001',
    customer_name: 'Apex Chemical Industries',
    chalan_date: '2026-06-01',
    delivery_address: 'Ganda, Savar, Dhaka',
    contact_person: 'Md. Rahim',
    phone: '01711223344',
    items: [
      { product_name: 'Hydrochloric Acid 35%', unit: 'Liter', quantity: 1000 },
      { product_name: 'Sulfuric Acid 98%', unit: 'kg', quantity: 500 }
    ],
    created_at: new Date('2026-06-01T14:20:00Z').toISOString(),
    updated_at: new Date('2026-06-01T14:20:00Z').toISOString()
  },
  {
    id: 'c2',
    chalan_number: '002',
    customer_name: 'Global Biotech Corp',
    chalan_date: '2026-06-02',
    delivery_address: 'Mirpur, Dhaka',
    contact_person: 'Dr. Asif',
    phone: '01822334455',
    items: [
      { product_name: 'Sodium Hydroxide (Caustic Soda)', unit: 'Drum', quantity: 25 }
    ],
    created_at: new Date('2026-06-02T14:22:00Z').toISOString(),
    updated_at: new Date('2026-06-02T14:22:00Z').toISOString()
  }
];

const DEFAULT_DOCUMENTS = [
  {
    id: 'd1',
    name: 'Hydrochloric_Acid_CoA_Batch_552.pdf',
    file_path: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'application/pdf',
    file_size: 29845,
    associated_type: 'chalan',
    associated_id: 'c1',
    created_at: new Date('2026-06-01T10:05:00Z').toISOString()
  },
  {
    id: 'd2',
    name: 'Apex_Chemical_Purchase_Order_1292.png',
    file_path: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=300&auto=format&fit=crop',
    file_type: 'image/png',
    file_size: 145020,
    associated_type: 'order',
    associated_id: 'o1',
    created_at: new Date('2026-06-01T09:30:00Z').toISOString()
  }
];

const DEFAULT_COMPANY_INFO = {
  facebook: 'https://facebook.com/trusttraders',
  mobile: '+8801711223344',
  mobile2: '',
  email: 'contact@trusttraders.com',
  location: 'Dhaka, Bangladesh',
  footerText: 'Trust Traders Chemical Factory. All rights reserved.',
  heroBannerUrl: '',
  logoUrl: '',
  heroSubtitle: 'PREMIUM CHEMICAL MANUFACTURING & SUPPLY'
};

const DEFAULT_THEME_SETTINGS = {
  primary: '#0d9488',
  backgroundDark: '#0f172a',
  backgroundLight: '#f8fafc',
  backgroundImageUrl: '',
  heroTitleGradient: 'from-teal-400 to-emerald-300',
  heroLogoBackground: 'bg-slate-900/40 backdrop-blur-md'
};

const DEFAULT_COMPANIES = [
  "Mitali Fasan Ltd",
  "Ovi Tex",
  "Alif Dyeing",
  "General Archive"
];

const DEFAULT_CHEMICALS = [
  "Hydrochloric Acid",
  "Sulfuric Acid",
  "Nitric Acid",
  "Sodium Hydroxide",
  "Hydrogen Peroxide",
  "Acetic Acid"
];

// LocalStorage Database helper
export const mockDb = {
  getThemeSettings: () => {
    if (typeof window === 'undefined') return DEFAULT_THEME_SETTINGS;
    const val = localStorage.getItem('cf_theme_settings');
    if (!val) {
      localStorage.setItem('cf_theme_settings', JSON.stringify(DEFAULT_THEME_SETTINGS));
      return DEFAULT_THEME_SETTINGS;
    }
    return JSON.parse(val);
  },
  saveThemeSettings: (settings: any) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cf_theme_settings', JSON.stringify(settings));
  },
  getCompanyInfo: () => {
    if (typeof window === 'undefined') return DEFAULT_COMPANY_INFO;
    const val = localStorage.getItem('cf_company_info');
    if (!val) {
      localStorage.setItem('cf_company_info', JSON.stringify(DEFAULT_COMPANY_INFO));
      return DEFAULT_COMPANY_INFO;
    }
    return JSON.parse(val);
  },
  saveCompanyInfo: (info: any) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cf_company_info', JSON.stringify(info));
  },
  getOrders: () => {
    if (typeof window === 'undefined') return DEFAULT_ORDERS;
    const val = localStorage.getItem('cf_orders');
    if (!val) {
      localStorage.setItem('cf_orders', JSON.stringify(DEFAULT_ORDERS));
      return DEFAULT_ORDERS;
    }
    return JSON.parse(val);
  },
  saveOrders: (orders: any[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cf_orders', JSON.stringify(orders));
  },
  getChalans: () => {
    if (typeof window === 'undefined') return DEFAULT_CHALANS;
    const val = localStorage.getItem('cf_chalans');
    if (!val) {
      localStorage.setItem('cf_chalans', JSON.stringify(DEFAULT_CHALANS));
      return DEFAULT_CHALANS;
    }
    return JSON.parse(val);
  },
  saveChalans: (chalans: any[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cf_chalans', JSON.stringify(chalans));
  },
  getDocuments: () => {
    if (typeof window === 'undefined') return DEFAULT_DOCUMENTS;
    const val = localStorage.getItem('cf_documents');
    if (!val) {
      localStorage.setItem('cf_documents', JSON.stringify(DEFAULT_DOCUMENTS));
      return DEFAULT_DOCUMENTS;
    }
    return JSON.parse(val);
  },
  saveDocuments: (docs: any[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cf_documents', JSON.stringify(docs));
  },
  getCompanies: () => {
    if (typeof window === 'undefined') return DEFAULT_COMPANIES;
    const val = localStorage.getItem('cf_companies');
    if (!val) {
      localStorage.setItem('cf_companies', JSON.stringify(DEFAULT_COMPANIES));
      return DEFAULT_COMPANIES;
    }
    return JSON.parse(val);
  },
  saveCompanies: (companies: string[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cf_companies', JSON.stringify(companies));
  },
  getChemicals: () => {
    if (typeof window === 'undefined') return DEFAULT_CHEMICALS;
    const val = localStorage.getItem('cf_chemicals');
    if (!val) {
      localStorage.setItem('cf_chemicals', JSON.stringify(DEFAULT_CHEMICALS));
      return DEFAULT_CHEMICALS;
    }
    return JSON.parse(val);
  },
  saveChemicals: (chemicals: string[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cf_chemicals', JSON.stringify(chemicals));
  }
};
