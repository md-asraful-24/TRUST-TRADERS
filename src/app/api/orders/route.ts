import { NextResponse } from 'next/server';
import { getJson, saveJson } from '@/lib/jsonStore';

export const dynamic = 'force-dynamic';

const STORE_ID = 'orders';

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
    const { order_number, customer_name, order_date, status, total_amount, notes, items } = body;

    const newOrderData = {
      id: 'ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      order_number,
      customer_name,
      order_date,
      status,
      total_amount,
      notes,
      items: items || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let data = await getJson(STORE_ID, []);
    data.unshift(newOrderData); // Add to beginning like the DB sorting
    await saveJson(STORE_ID, data);

    return NextResponse.json({ success: true, order: newOrderData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, order_number, customer_name, order_date, status, total_amount, notes, items } = body;

    // If no ID is passed, this might be a mass update in mock mode
    if (!id && Array.isArray(body)) {
        await saveJson(STORE_ID, body);
        return NextResponse.json({ success: true });
    }

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    let data = await getJson(STORE_ID, []);
    const index = data.findIndex((o: any) => o.id === id);
    if (index !== -1) {
      data[index] = {
        ...data[index],
        order_number,
        customer_name,
        order_date,
        status,
        total_amount,
        notes,
        items: items || data[index].items,
        updated_at: new Date().toISOString()
      };
      await saveJson(STORE_ID, data);
    }

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
    data = data.filter((o: any) => o.id !== id);
    await saveJson(STORE_ID, data);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
