import { createClient } from "@supabase/supabase-js";
import './loadEnv.js';

console.log("SUPABASE URL:", process.env.SUPABASE_URL);

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

export default supabase;
