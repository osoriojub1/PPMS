import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://txntzkfvcdgruwlhrnkl.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4bnR6a2Z2Y2RncnV3bGhybmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1OTQ2MjUsImV4cCI6MjA4ODE3MDYyNX0.oai9BgEH_ZSUpjZU4OzEwIFASSnRgoTg5xJjkwu1Ycs";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log("Fetching notes with profiles...");
    const { data, error } = await supabase.from('notes').select('*, profiles(full_name)').limit(1);
    if (error) {
        console.error("Error from Supabase:", JSON.stringify(error, null, 2));
    } else {
        console.log("Success:", data);
    }
}

check();
