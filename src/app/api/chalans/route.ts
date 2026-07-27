import { NextResponse } from 'next/server';
import { getJson, saveJson } from '@/lib/jsonStore';

export const dynamic = 'force-dynamic';

const STORE_ID = 'chalans';

export async function GET() {
  try {
    const data = await getJson(STORE_ID, []);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chalan_number, customer_name, chalan_date, delivery_address, contact_person, phone, items } = body;

    const newChalan = {
      id: 'ch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      chalan_number,
      customer_name,
      chalan_date,
      delivery_address,
      contact_person,
      phone,
      items: items || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let data = await getJson(STORE_ID, []);
    data.unshift(newChalan); // Add to beginning like the DB sorting
    await saveJson(STORE_ID, data);

    return NextResponse.json({ success: true, chalan: newChalan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    await saveJson(STORE_ID, data);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const isSuperAdmin = req.headers.get('x-super-admin') === 'true';
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized to delete' }, { status: 403 });
    }

    let data = await getJson(STORE_ID, []);
    data = data.filter((c: any) => c.id !== id);
    await saveJson(STORE_ID, data);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
