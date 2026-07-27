const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://qfhkgfhjtuodtgggcyyf.supabase.co', 'sb_publishable_2irXLTkwxTGq2i-6MKvCnw_03Q8is-c');

async function run() {
  const { data: updatedUser, error } = await supabase
    .from('custom_users')
    .update({ role: 'User' })
    .eq('email', 'asrafulislamai8932454@gmail.com')
    .select('*')
    .single();

  console.log("Error:", error);
  console.log("Updated:", updatedUser);
}
run();
