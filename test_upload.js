const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  const fileContent = "hello world";
  const filePath = `vault/test_upload_${Date.now()}.txt`;
  
  console.log("Uploading to storage...");
  const { data, error } = await supabase.storage
    .from("chemical-factory-vault")
    .upload(filePath, fileContent);
    
  if (error) {
    console.error("Storage upload error:", error.message);
  } else {
    console.log("Storage upload success:", data);
  }
}

testUpload();
