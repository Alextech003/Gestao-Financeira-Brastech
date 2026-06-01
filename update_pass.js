import { createClient } from '@supabase/supabase-js';

const url = 'https://duapakdmebalyajpgbav.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1YXBha2RtZWJhbHlhanBnYmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxODQ1NjksImV4cCI6MjA4Mzc2MDU2OX0.M-6iqqBoKgSa-tdBmda66CftzxpeibTSXtmgFYQXvw4';

const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase.from('users').select('*');
  console.log('Users:', data);
  if (error) {
    console.error('Error fetching users:', error);
  } else {
     const adm = data.find(u => u.name === 'Adm Master' || u.name === 'adm master' || u.email === 'admin' || u.role === 'ADMIN');
     if (adm) {
        console.log('Found Adm Master:', adm);
        const { error: updateError } = await supabase.from('users').update({ password: '8070' }).eq('id', adm.id);
        if (updateError) {
          console.error('Update error:', updateError);
        } else {
          console.log('Successfully updated password for', adm.email);
        }
     } else {
       console.log('User Adm Master not found. All users:', data.map(u => u.name));
     }
  }
}

main();
