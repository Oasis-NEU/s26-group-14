import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mtlccqkfwomagswkkzpg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bGNjcWtmd29tYWdzd2trenBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MzQyNzksImV4cCI6MjA5MTExMDI3OX0.8gYK6vzqCsqujasxzbjEeFiRYdI8d0lRIAL5JTAhkzk'

export const supabase = createClient(supabaseUrl, supabaseKey)