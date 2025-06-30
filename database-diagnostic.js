// Database Configuration Diagnostic Script
// Run this in browser console to check your database status

function checkDatabaseStatus() {
    console.log('🔍 Checking Database Configuration Status...\n');
    
    // Check localStorage for database credentials
    const supabaseUrl = localStorage.getItem('supabase_url');
    const supabaseKey = localStorage.getItem('supabase_key');
    
    console.log('📋 Stored Database Credentials:');
    console.log('- Supabase URL:', supabaseUrl || '❌ Not found');
    console.log('- Supabase Key:', supabaseKey ? '✅ Found (length: ' + supabaseKey.length + ')' : '❌ Not found');
    console.log('');
    
    // Check app database status
    if (window.app && window.app.database) {
        console.log('🗄️ Database Service Status:');
        console.log('- Is Configured:', window.app.database.isConfigured ? '✅ Yes' : '❌ No');
        console.log('- Use LocalStorage:', window.app.database.useLocalStorage ? '⚠️ Yes (fallback mode)' : '✅ No (using database)');
        console.log('- Supabase Client:', window.app.database.supabase ? '✅ Connected' : '❌ Not connected');
        console.log('');
        
        // Check current data source
        if (window.app.database.useLocalStorage) {
            console.log('📊 Current Data Source: localStorage (Browser-specific storage)');
            console.log('⚠️ This explains why different browsers show different data!');
        } else {
            console.log('📊 Current Data Source: Database (Shared across browsers)');
            console.log('✅ All browsers should show the same data');
        }
    } else {
        console.log('❌ App not loaded or database service not found');
    }
    
    console.log('');
    console.log('📋 Data in localStorage:');
    const localData = localStorage.getItem('employeeManagerState');
    if (localData) {
        try {
            const state = JSON.parse(localData);
            console.log('- Staff records:', state.staff?.length || 0);
            console.log('- Log months:', Object.keys(state.logs || {}).length);
            console.log('- Settings:', Object.keys(state.settings || {}).length);
        } catch (e) {
            console.log('- ❌ Error parsing localStorage data');
        }
    } else {
        console.log('- No data in localStorage');
    }
    
    console.log('\n🔧 Recommendations:');
    if (!supabaseUrl || !supabaseKey) {
        console.log('❌ Database not configured. Press Ctrl+Shift+D to configure.');
    } else if (window.app?.database?.useLocalStorage) {
        console.log('⚠️ Database credentials found but not working. Check your Supabase setup.');
    } else {
        console.log('✅ Database is properly configured and working!');
    }
}

// Auto-run the diagnostic
checkDatabaseStatus();
