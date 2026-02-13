
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const supabaseUrl = 'https://ncyvidumewgeikigwyce.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeXZpZHVtZXdnZWlraWd3eWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NjExOTIsImV4cCI6MjA4NjUzNzE5Mn0.qXBKQm-RCUtDkNre5J4RflDM9pxyDip7s5zKH13U1Cw';

export const supabase = createClient(supabaseUrl, supabaseKey);
