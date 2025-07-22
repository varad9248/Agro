const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hbuouietuzahmohejeec.supabase.co';           // अपनी env फाइल में रखें
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhidW91aWV0dXphaG1vaGVqZWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5Mjc2NjksImV4cCI6MjA2ODUwMzY2OX0.reMftLodZ8j-dXl2hj5i5gV92GFDpMAEE3ZoP-g_PHE'; // service role key

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;
