import { NextResponse } from 'next/server';
import { getJson, saveJson } from '@/lib/jsonStore';

export const dynamic = 'force-dynamic';

const STORE_ID = 'documents';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const includeFile = url.searchParams.get('include_file');

    const docs = await getJson(STORE_ID, []);

    if (id && includeFile === 'true') {
      const doc = docs.find((d: any) => d.id === id);
      return NextResponse.json({ file_path: doc?.file_path });
    }

    return NextResponse.json(docs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, file_type, file_size, file_path, associated_type, associated_id } = body;

    const docs = await getJson(STORE_ID, []);
    const newDoc = {
      id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name, file_type, file_size, file_path, associated_type, associated_id,
      created_at: new Date().toISOString()
    };
    docs.unshift(newDoc);
    await saveJson(STORE_ID, docs);

    return NextResponse.json({ success: true, document: newDoc });
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

    let docs = await getJson(STORE_ID, []);
    docs = docs.filter((d: any) => d.id !== id);
    await saveJson(STORE_ID, docs);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
