
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://your-project.supabase.co', 'your-anon-key'); // I'll replace these with placeholders in my head or try to find them

async function check() {
    try {
        console.log("Checking latest notes...");
        const { data: notes, error } = await supabase.from('notes').select('*').order('created_at', { ascending: false }).limit(5);
        if (error) {
            console.error("Error fetching notes:", error);
            return;
        }
        console.log("Latest 5 notes:", JSON.stringify(notes, null, 2));
    } catch (e) {
        console.error("Exception:", e);
    }
}

// I can't run this without the actual URL and Key if they aren't in the env.
// But I can try to read them from .env if it exists.
