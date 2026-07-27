import { supabase, isMockMode } from './supabase';
import { getJson, saveJson } from './jsonStore';
import crypto from 'crypto';

export interface UserRecord {
  id: string;
  email: string;
  password?: string;
  role: string;
  status: string;
  created_at: string;
}

const STORE_ID = 'users';

const DEFAULT_SUPER_ADMIN_PASSWORD_HASH = crypto.createHash('sha256').update('12345678').digest('hex');

const DEFAULT_USERS: UserRecord[] = [
  {
    id: '1',
    email: 'asrafulislamai1983@gmail.com',
    role: 'Admin',
    status: 'Active',
    password: DEFAULT_SUPER_ADMIN_PASSWORD_HASH,
    created_at: new Date('2026-07-01T10:00:00Z').toISOString()
  }
];

export async function getUsers(): Promise<UserRecord[]> {
  try {
    if (!isMockMode) {
      const { data, error } = await supabase
        .from('custom_users')
        .select('id, email, role, status, created_at, password')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as UserRecord[];
      }
    }
  } catch (err) {
    console.warn('Supabase fetch custom_users failed, using jsonStore fallback:', err);
  }

  // Fallback to jsonStore ONLY if in mock mode
  if (isMockMode) {
    let users = await getJson(STORE_ID, []);
    if (!users || users.length === 0) {
      users = DEFAULT_USERS;
      await saveJson(STORE_ID, users).catch(() => {});
    }
    return users as UserRecord[];
  }

  return [];
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const emailLower = email.toLowerCase().trim();

  try {
    if (!isMockMode) {
      const { data, error } = await supabase
        .from('custom_users')
        .select('*')
        .eq('email', emailLower)
        .single();

      if (!error && data) {
        return data as UserRecord;
      }
    }
  } catch (err) {
    console.warn('Supabase findUserByEmail failed, using jsonStore fallback:', err);
  }

  // Fallback ONLY in mock mode
  if (isMockMode) {
    const users = await getUsers();
    const found = users.find(u => u.email.toLowerCase().trim() === emailLower);
    return found || null;
  }

  return null;
}

export async function createUser(userData: { email: string; password?: string; role: string; status: string }): Promise<UserRecord> {
  const emailLower = userData.email.toLowerCase().trim();
  const newUser: UserRecord = {
    id: crypto.randomUUID(),
    email: emailLower,
    password: userData.password || '',
    role: userData.role,
    status: userData.status,
    created_at: new Date().toISOString()
  };

  // Try Supabase insert
  let supabaseSuccess = false;
  try {
    if (!isMockMode) {
      const { data, error } = await supabase
        .from('custom_users')
        .insert([{
          id: newUser.id,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
          status: newUser.status,
          created_at: newUser.created_at
        }])
        .select()
        .single();

      if (!error && data) {
        supabaseSuccess = true;
      } else if (error) {
        console.warn('Supabase insert custom_users error:', error.message);
      }
    }
  } catch (err) {
    console.warn('Supabase insert custom_users exception:', err);
  }

  // Sync to jsonStore ONLY in mock mode
  if (isMockMode) {
    const users = await getUsers();
    const existingIdx = users.findIndex(u => u.email.toLowerCase().trim() === emailLower);
    if (existingIdx !== -1) {
      users[existingIdx] = { ...users[existingIdx], ...newUser };
    } else {
      users.unshift(newUser);
    }
    await saveJson(STORE_ID, users).catch(err => console.error('Failed to sync user to jsonStore:', err));
  }

  return newUser;
}

export async function updateUser(id: string | null, email: string | null, updates: Partial<UserRecord>): Promise<UserRecord | null> {
  let updatedRecord: UserRecord | null = null;

  try {
    if (!isMockMode) {
      let query = supabase.from('custom_users').update(updates);
      if (id) query = query.eq('id', id);
      else if (email) query = query.eq('email', email.toLowerCase().trim());

      const { data, error } = await query.select().single();
      if (!error && data) {
        updatedRecord = data as UserRecord;
      }
    }
  } catch (err) {
    console.warn('Supabase updateUser exception:', err);
  }

  // Sync to jsonStore ONLY in mock mode
  if (isMockMode) {
    const users = await getUsers();
    const index = users.findIndex(u => (id && u.id === id) || (email && u.email.toLowerCase().trim() === email.toLowerCase().trim()));
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      updatedRecord = users[index];
      await saveJson(STORE_ID, users).catch(err => console.error('Failed to update user in jsonStore:', err));
    }
  }

  return updatedRecord;
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    if (!isMockMode) {
      await supabase.from('custom_users').delete().eq('id', id);
    }
  } catch (err) {
    console.warn('Supabase deleteUser exception:', err);
  }

  // Sync to jsonStore ONLY in mock mode
  if (isMockMode) {
    let users = await getUsers();
    users = users.filter(u => u.id !== id);
    await saveJson(STORE_ID, users).catch(err => console.error('Failed to delete user in jsonStore:', err));
  }
  return true;
}
