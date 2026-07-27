import { NextResponse } from 'next/server';
import { getJson, saveJson } from '@/lib/jsonStore';

export const dynamic = 'force-dynamic';

const STORE_ID = 'settings';

export async function GET() {
  try {
    const settings = await getJson(STORE_ID, {});
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const isSuperAdmin = req.headers.get('x-super-admin') === 'true';
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized to modify settings' }, { status: 403 });
    }

    const newSettings = await req.json();
    let currentSettings = await getJson(STORE_ID, {});
    
    const currentTheme = currentSettings.theme || {};
    const currentCompanyInfo = currentSettings.companyInfo || {};
    const currentCompanies = currentSettings.companies || [];
    const currentWebhooks = currentSettings.companyWebhooks || {};

    const updatedTheme = newSettings.theme ? { ...currentTheme, ...newSettings.theme } : currentTheme;
    const updatedCompanyInfo = newSettings.companyInfo ? { ...currentCompanyInfo, ...newSettings.companyInfo } : currentCompanyInfo;
    
    if (newSettings.chemicals) {
      updatedCompanyInfo.chemicals = newSettings.chemicals;
    }
    
    const updatedCompanies = newSettings.companies || currentCompanies;
    const updatedWebhooks = newSettings.companyWebhooks !== undefined ? { ...currentWebhooks, ...newSettings.companyWebhooks } : currentWebhooks;

    const updatedSettings = {
      ...currentSettings,
      theme: updatedTheme,
      companyInfo: updatedCompanyInfo,
      companies: updatedCompanies,
      companyWebhooks: updatedWebhooks
    };
    
    await saveJson(STORE_ID, updatedSettings);
    
    return NextResponse.json({ 
      success: true, 
      settings: updatedSettings 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
