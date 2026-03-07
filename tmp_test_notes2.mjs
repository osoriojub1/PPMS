import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = "https://txntzkfvcdgruwlhrnkl.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4bnR6a2Z2Y2RncnV3bGhybmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1OTQ2MjUsImV4cCI6MjA4ODE3MDYyNX0.oai9BgEH_ZSUpjZU4OzEwIFASSnRgoTg5xJjkwu1Ycs";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log("Fetching notes policies or structure...");
    // Let's just create a note with patient_id and see what happens, or check the RLS policy
}

check();
