import { NextResponse } from 'next/server';
import { getUsers, updateUser, deleteUser } from '@/lib/userStore';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  try {
    const users = await getUsers();
    const cleanUsers = users.map(({ password, ...u }) => u);
    return NextResponse.json(cleanUsers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const roleHeader = req.headers.get('x-user-role');
    const isSuperAdmin = req.headers.get('x-super-admin') === 'true';
    if (roleHeader !== 'Admin' && !isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized to modify users' }, { status: 403 });
    }

    const { id, role, status } = await req.json();

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const updates: any = {};
    if (role !== undefined) updates.role = role;
    if (status !== undefined) updates.status = status;

    const data = await updateUser(id, null, updates);

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const isSuperAdmin = req.headers.get('x-super-admin') === 'true';
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Only Super Admin can delete users' }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const users = await getUsers();
    const userToDel = users.find(u => u.id === id);

    const superAdminEmail = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'asrafulislamai1983@gmail.com').toLowerCase();
    if (userToDel?.email.toLowerCase().trim() === superAdminEmail) {
      return NextResponse.json({ error: 'Cannot delete the Super Admin' }, { status: 403 });
    }

    await deleteUser(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

