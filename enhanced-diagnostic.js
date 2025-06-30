// Enhanced Database Status Check
// Since database shows as "Connected", let's check why browsers show different data

async function checkDatabaseAndSync() {
    console.log('🔍 Enhanced Database Status Check...\n');
    
    // Check database connection
    if (window.app && window.app.database) {
        console.log('🗄️ Database Status:');
        console.log('- Is Configured:', window.app.database.isConfigured ? '✅ Yes' : '❌ No');
        console.log('- Use LocalStorage:', window.app.database.useLocalStorage ? '⚠️ Yes (fallback)' : '✅ No (using database)');
        console.log('- Supabase Client:', window.app.database.supabase ? '✅ Connected' : '❌ Not connected');
        
        // Check stored credentials
        const supabaseUrl = localStorage.getItem('supabase_url');
        const supabaseKey = localStorage.getItem('supabase_key');
        console.log('- Stored URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
        console.log('- Stored Key:', supabaseKey ? '✅ Found' : '❌ Missing');
        console.log('');
        
        // Test actual database connection
        console.log('🧪 Testing Database Connection...');
        try {
            const testResult = await window.app.database.testConnection();
            console.log('- Connection Test:', testResult ? '✅ Passed' : '❌ Failed');
        } catch (error) {
            console.log('- Connection Test: ❌ Error -', error.message);
        }
        
        // Check what data source is actually being used
        console.log('\n📊 Current Data Loading:');
        try {
            // Try to load staff from database
            const staffFromDB = await window.app.database.loadStaff();
            console.log('- Staff from Database:', staffFromDB?.length || 0, 'records');
            
            // Check localStorage data
            const localData = localStorage.getItem('employeeManagerState');
            if (localData) {
                const state = JSON.parse(localData);
                console.log('- Staff from localStorage:', state.staff?.length || 0, 'records');
                
                // Compare the data
                if (staffFromDB?.length !== state.staff?.length) {
                    console.log('⚠️ MISMATCH: Database and localStorage have different data!');
                    console.log('💡 This could explain why browsers show different data');
                }
            }
        } catch (error) {
            console.log('❌ Error checking data:', error.message);
        }
        
        // Check how app loads data
        console.log('\n🔄 App Data Loading Logic:');
        console.log('- Current staff in app:', window.app.state.staff?.length || 0);
        
        // Force reload from database
        console.log('\n🔄 Testing Database Reload...');
        try {
            await window.app.loadState();
            console.log('✅ Data reloaded successfully');
            console.log('- Staff count after reload:', window.app.state.staff?.length || 0);
        } catch (error) {
            console.log('❌ Reload failed:', error.message);
        }
        
    } else {
        console.log('❌ App or database service not found');
    }
    
    console.log('\n🔧 Next Steps:');
    console.log('1. If database is connected but data differs, run sync script');
    console.log('2. If connection test fails, check Supabase credentials');
    console.log('3. If localStorage/database mismatch, migrate data');
}

// Run the enhanced check
checkDatabaseAndSync();
