
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://txntzkfvcdgruwlhrnkl.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4bnR6a2Z2Y2RncnV3bGhybmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1OTQ2MjUsImV4cCI6MjA4ODE3MDYyNX0.oai9BgEH_ZSUpjZU4OzEwIFASSnRgoTg5xJjkwu1Ycs";

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Testing fetch from profiles table...");
    try {
        const { data, error, status, statusText } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('role', 'mho_admin');

        if (error) {
            console.error("Error fetching profiles. Status:", status, statusText);
            console.error(error);
        } else {
            console.log("Success! Status:", status, statusText);
            console.log("Data length:", data.length);
            console.log("Data:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Crash during fetch:", e);
    }

    process.exit(0);
}

test();
