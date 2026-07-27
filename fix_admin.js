const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = 'asrafulislamai1983@gmail.com';
  const password = 'astaful1983'; // The password they typed
  const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

  // Check if exists
  const { data: existing } = await supabase.from('custom_users').select('id').eq('email', email).single();
  
  if (existing) {
    console.log('User exists, updating password...');
    const { error } = await supabase.from('custom_users').update({ password: hashedPassword }).eq('email', email);
    if (error) console.error(error);
    else console.log('Updated successfully');
  } else {
    console.log('User does not exist, creating...');
    const { error } = await supabase.from('custom_users').insert([{
      id: crypto.randomUUID(),
      email: email,
      password: hashedPassword,
      role: 'Admin',
      status: 'Active',
      created_at: new Date().toISOString()
    }]);
    if (error) console.error(error);
    else console.log('Inserted successfully');
  }
}
run();
