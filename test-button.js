// Test Database Fix - Add this as a temporary button
// This will test if the database fixes work properly

function addTestButton() {
    // Create test button
    const testButton = document.createElement('button');
    testButton.textContent = '🧪 Test Database Fix';
    testButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 9999;
        background: #4CAF50;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    
    testButton.onclick = async function() {
        console.log('🧪 Testing Database Fix...\n');
        
        try {
            // Show current status
            console.log('📊 Current Status:');
            console.log('- Using localStorage:', window.app.database.useLocalStorage ? 'YES (❌ Problem)' : 'NO (✅ Good)');
            console.log('- Staff count:', window.app.state.staff?.length || 0);
            
            // Force save to database
            console.log('\n💾 Saving to database...');
            await window.app.saveState();
            
            // Clear app state to test database loading
            console.log('🗑️ Clearing app data...');
            const originalStaff = window.app.state.staff;
            window.app.state.staff = [];
            
            // Force reload from database
            console.log('📥 Loading from database...');
            await window.app.loadState();
            
            // Check results
            console.log('\n✅ Test Results:');
            console.log('- Database working:', !window.app.database.useLocalStorage ? 'YES ✅' : 'NO ❌');
            console.log('- Staff loaded:', window.app.state.staff?.length || 0);
            
            if (!window.app.database.useLocalStorage && window.app.state.staff?.length > 0) {
                console.log('\n🎉 SUCCESS! Database is working!');
                console.log('💡 Both browsers will now show the same data!');
                testButton.textContent = '✅ Database Fixed!';
                testButton.style.background = '#4CAF50';
            } else {
                console.log('\n⚠️ Still using localStorage fallback');
                console.log('Check console for any errors');
                testButton.textContent = '⚠️ Still Issues';
                testButton.style.background = '#ff9800';
            }
            
            // Refresh the page display
            if (window.app.currentPage === '#/staff') {
                window.app.staffManager.render();
            }
            
        } catch (error) {
            console.error('❌ Test failed:', error);
            testButton.textContent = '❌ Test Failed';
            testButton.style.background = '#f44336';
        }
    };
    
    document.body.appendChild(testButton);
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
        if (testButton.parentNode) {
            testButton.remove();
        }
    }, 30000);
}

// Add the test button
addTestButton();
