// Quick diagnostic script to check database status
console.log('🔍 Database Status Check:');
console.log('- Force database mode:', localStorage.getItem('force_database_mode'));
console.log('- Supabase URL:', localStorage.getItem('supabase_url'));
console.log('- Supabase Key exists:', !!localStorage.getItem('supabase_key'));
console.log('- App database status:', window.app?.database?.useLocalStorage);
console.log('- App configured:', window.app?.database?.isConfigured);

// Try to get the database status
if (window.app?.database) {
    console.log('- Connection status:', window.app.database.getConnectionStatus());
}
