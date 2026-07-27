const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://qfhkgfhjtuodtgggcyyf.supabase.co', 'sb_publishable_2irXLTkwxTGq2i-6MKvCnw_03Q8is-c');

async function run() {
  const { data, error } = await supabase.from('custom_users').select('*');
  console.log("Users:", data);
}
run();
