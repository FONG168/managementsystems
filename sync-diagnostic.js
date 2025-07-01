// Enhanced Data Sync Diagnostic Tool
// Run this in the browser console to check sync status

console.log('🔍 Enhanced Data Sync Diagnostic Tool');
console.log('=====================================');

async function diagnoseSyncStatus() {
    console.log('\n📊 Current Status:');
    
    // Check if app is loaded
    if (!window.app) {
        console.log('❌ App not loaded');
        return;
    }
    
    // Check database configuration
    const db = window.app.database;
    console.log('🔧 Database Configuration:');
    console.log(`   - Use Local Storage: ${db.useLocalStorage}`);
    console.log(`   - Is Configured: ${db.isConfigured}`);
    console.log(`   - Is Offline: ${db.isOffline}`);
    console.log(`   - Auto Sync Enabled: ${db.autoSyncEnabled}`);
    console.log(`   - Sync Interval: ${db.syncIntervalMs}ms`);
    
    // Check connection status
    console.log('\n🌐 Connection Status:');
    const status = db.getConnectionStatus ? db.getConnectionStatus() : 'unknown';
    console.log(`   - Status: ${status}`);
    
    // Test API connection
    console.log('\n🧪 Testing API Connection:');
    try {
        const testResult = await db.testConnection();
        console.log(`   - API Test: ${testResult ? '✅ Success' : '❌ Failed'}`);
    } catch (error) {
        console.log(`   - API Test: ❌ Error - ${error.message}`);
    }
    
    // Check current data
    const state = window.app.getState();
    console.log('\n📋 Current Data:');
    console.log(`   - Staff Count: ${state.staff?.length || 0}`);
    console.log(`   - Log Months: ${Object.keys(state.logs || {}).length}`);
    console.log(`   - Last Modified: ${new Date(state._lastModified || 0).toLocaleString()}`);
    
    // Check localStorage
    console.log('\n💾 Local Storage:');
    const localData = localStorage.getItem('employeeManagerState');
    if (localData) {
        try {
            const parsed = JSON.parse(localData);
            console.log(`   - Staff in localStorage: ${parsed.staff?.length || 0}`);
            console.log(`   - Logs in localStorage: ${Object.keys(parsed.logs || {}).length}`);
            console.log(`   - Local Last Modified: ${new Date(parsed._lastModified || 0).toLocaleString()}`);
        } catch (e) {
            console.log('   - localStorage data corrupt');
        }
    } else {
        console.log('   - No localStorage data found');
    }
    
    // Enhanced sync status
    console.log('\n🔄 Enhanced Sync Status:');
    console.log(`   - Sync Queue Length: ${db.syncQueue?.length || 0}`);
    console.log(`   - Last Sync Time: ${db.lastSyncTime ? new Date(db.lastSyncTime).toLocaleString() : 'Never'}`);
    console.log(`   - Consecutive Failures: ${db.consecutiveFailures || 0}`);
    console.log(`   - Is Syncing: ${db.isSyncing || false}`);
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (db.useLocalStorage) {
        console.log('   📱 Currently using localStorage mode');
        console.log('   🔄 Click "Sync Both Browsers" button to enable real-time sync');
    } else {
        console.log('   🌐 Real-time sync mode active');
        console.log('   ✅ Changes should sync automatically every few seconds');
    }
}

// Action functions
function enableSync() {
    console.log('🔄 Enabling enhanced sync...');
    if (window.app) {
        window.app.forceDatabaseSync().then(() => {
            console.log('✅ Sync enabled successfully');
        }).catch(error => {
            console.log('❌ Sync enable failed:', error);
        });
    }
}

function testDataSync() {
    console.log('🧪 Testing data synchronization...');
    if (window.app) {
        const testData = {
            test: true,
            timestamp: Date.now(),
            browser: navigator.userAgent.substr(0, 50)
        };
        
        // Add test to logs
        const state = window.app.getState();
        const currentDate = new Date();
        const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!state.logs[monthKey]) {
            state.logs[monthKey] = { activities: [], data: {} };
        }
        
        state.logs[monthKey].syncTest = testData;
        
        if (window.app.updateLogsWithSync) {
            window.app.updateLogsWithSync(state.logs, {
                action: 'sync_test',
                testData: testData
            });
            console.log('✅ Test data sent. Check other browser in a few seconds.');
        } else {
            console.log('❌ Enhanced sync not available');
        }
    }
}

function forceRefresh() {
    console.log('🔄 Force refreshing data...');
    if (window.app && window.app.checkForDataUpdates) {
        window.app.checkForDataUpdates();
        console.log('✅ Data refresh triggered');
    }
}

// Export functions globally
window.diagnoseSyncStatus = diagnoseSyncStatus;
window.enableSync = enableSync;
window.testDataSync = testDataSync;
window.forceRefresh = forceRefresh;

// Run initial diagnosis
diagnoseSyncStatus();

console.log('\n🛠️ Available Commands:');
console.log('   - diagnoseSyncStatus() - Run full diagnosis');
console.log('   - enableSync() - Enable enhanced sync');
console.log('   - testDataSync() - Send test data to other browsers');
console.log('   - forceRefresh() - Force refresh data from server');
console.log('\n💡 Tip: Copy this entire script and paste in both browsers to compare status');
