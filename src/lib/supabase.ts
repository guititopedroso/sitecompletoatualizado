import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jyiqpbozwyyruzbizusf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5aXFwYm96d3l5cnV6Yml6dXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MjM4NjQsImV4cCI6MjA4OTM5OTg2NH0.nlNLKyphrE7BRJsgOo08Z6XU1_LtpO7_FzJDAl3Kc5w";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
