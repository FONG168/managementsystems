// Data Migration Script
// Run this in browser console AFTER configuring your database

async function migrateLocalStorageToDatabase() {
    console.log('🔄 Starting data migration from localStorage to database...');
    
    try {
        // Check if database is configured
        if (window.app.database.useLocalStorage) {
            console.error('❌ Database not configured! Please configure database first using Ctrl+Shift+D');
            return;
        }
        
        // Get current localStorage data
        const localData = localStorage.getItem('employeeManagerState');
        if (!localData) {
            console.log('ℹ️ No localStorage data found to migrate');
            return;
        }
        
        const state = JSON.parse(localData);
        console.log('📦 Found localStorage data:', {
            staff: state.staff?.length || 0,
            logs: Object.keys(state.logs || {}).length,
            settings: Object.keys(state.settings || {}).length
        });
        
        // Migrate data
        console.log('📤 Uploading to database...');
        
        if (state.staff?.length > 0) {
            await window.app.database.saveStaff(state.staff);
            console.log('✅ Staff data migrated');
        }
        
        if (state.logs && Object.keys(state.logs).length > 0) {
            await window.app.database.saveLogs(state.logs);
            console.log('✅ Logs data migrated');
        }
        
        if (state.settings) {
            await window.app.database.saveSettings(state.settings);
            console.log('✅ Settings migrated');
        }
        
        console.log('🎉 Migration complete! Both browsers will now show the same data.');
        console.log('💡 You can now safely clear localStorage if needed.');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

// Run migration
migrateLocalStorageToDatabase();
