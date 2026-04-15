import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ndkqahdjxevtwnhvisay.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ka3FhaGRqeGV2dHduaHZpc2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDQwOTgsImV4cCI6MjA5MTY4MDA5OH0.W53-UPN3WhkWEoWf2s7RF4E2jrU3RjvO4gHqbqL9Jh4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
