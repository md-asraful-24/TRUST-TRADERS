import { NextResponse } from 'next/server';
import { getJson, saveJson } from '@/lib/jsonStore';

export const dynamic = 'force-dynamic';

const STORE_ID = 'transactions';

// Read transactions
export async function GET() {
  try {
    const data = await getJson(STORE_ID, []);
    // Sort by date ascending to match old behavior
    data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Add a new transaction
export async function POST(req: Request) {
  try {
    const newTx = await req.json();
    
    if (!newTx.id) {
      newTx.id = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }
    if (!newTx.created_at) {
      newTx.created_at = new Date().toISOString();
    }
    
    let data = await getJson(STORE_ID, []);
    data.push(newTx);
    await saveJson(STORE_ID, data);

    // Sync to Google Sheets via Webhook if configured for this company
    try {
      if (newTx.company) {
        const settings = await getJson('settings', {});
        const webhooks = settings.companyWebhooks || {};
        const webhookUrl = webhooks[newTx.company];

        if (webhookUrl && webhookUrl.startsWith('https://')) {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newTx, action: 'create' }),
          }).catch(err => console.error('Google Sheets Sync Error:', err));
        }
      }
    } catch (webhookErr) {
      console.error('Webhook processing error:', webhookErr);
    }

    return NextResponse.json({ success: true, transaction: newTx });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete a transaction
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    let data = await getJson(STORE_ID, []);
    const txToDelete = data.find((tx: any) => tx.id === id);
    data = data.filter((tx: any) => tx.id !== id);
    await saveJson(STORE_ID, data);

    // Sync DELETE to Google Sheets
    if (txToDelete && txToDelete.company) {
      try {
        const settings = await getJson('settings', {});
        const webhooks = settings.companyWebhooks || {};
        const webhookUrl = webhooks[txToDelete.company];

        if (webhookUrl && webhookUrl.startsWith('https://')) {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...txToDelete, action: 'delete' }),
          }).catch(err => console.error('Google Sheets Sync Delete Error:', err));
        }
      } catch (webhookErr) {
        console.error('Webhook processing error (delete):', webhookErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update a transaction
export async function PUT(req: Request) {
  try {
    const updatedTx = await req.json();
    
    if (!updatedTx.id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    let data = await getJson(STORE_ID, []);
    const index = data.findIndex((tx: any) => tx.id === updatedTx.id);
    if (index !== -1) {
      const oldTx = data[index];
      data[index] = { ...data[index], ...updatedTx };
      await saveJson(STORE_ID, data);

      // Sync UPDATE to Google Sheets
      const companyToSync = updatedTx.company || oldTx.company;
      if (companyToSync) {
        try {
          const settings = await getJson('settings', {});
          const webhooks = settings.companyWebhooks || {};
          const webhookUrl = webhooks[companyToSync];

          if (webhookUrl && webhookUrl.startsWith('https://')) {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'update',
                oldTx: oldTx,
                newTx: data[index]
              }),
            }).catch(err => console.error('Google Sheets Sync Update Error:', err));
          }
        } catch (webhookErr) {
          console.error('Webhook processing error (update):', webhookErr);
        }
      }

      return NextResponse.json({ success: true, transaction: data[index] });
    }

    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
