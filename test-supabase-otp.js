const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qfhkgfhjtuodtgggcyyf.supabase.co';
const supabaseKey = 'sb_publishable_2irXLTkwxTGq2i-6MKvCnw_03Q8is-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: 'asrafulislamai1983@gmail.com',
  });
  console.log('Data:', data);
  console.log('Error:', error);
}

test();
