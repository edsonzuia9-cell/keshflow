import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ikypieyzfwogmptsjbfq.supabase.co";
const supabaseKey = "sb_publishable_palEfaLH5Wm0Vjixxjrhlg_CwmOZSLV";

export const supabase = createClient(supabaseUrl, supabaseKey);