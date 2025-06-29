// Database configuration script
// Production-ready database setup for Supabase

// These should be replaced with your actual Supabase credentials
// In production, these will be loaded from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kxkshweslyvpgadvbayd.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4a3Nod2VzbHl2cGdhZHZiYXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDA5MzksImV4cCI6MjA2Njc3NjkzOX0.qiQxFFfRvuQAOUnXjpBOQEYv_m6NQieY85_f40MsPxs';

async function configureDatabase() {
    try {
        console.log('Configuring database...');
        
        // Store credentials
        localStorage.setItem('supabase_url', SUPABASE_URL);
        localStorage.setItem('supabase_key', SUPABASE_KEY);
        
        // Initialize database connection
        if (window.app && window.app.database) {
            const success = await window.app.database.initialize(SUPABASE_URL, SUPABASE_KEY);
            if (success) {
                console.log('✅ Database configured successfully!');
                
                // Update UI
                window.app.updateDatabaseStatus();
                
                // Save current data to database
                await window.app.saveState();
                console.log('✅ Current data saved to database!');
                
                alert('Database configured successfully! Your data is now being saved to Supabase.');
                
                // Close database config modal if open
                const modal = document.querySelector('[data-modal="database-config"]');
                if (modal) {
                    modal.remove();
                }
                
                return true;
            } else {
                console.error('❌ Failed to configure database');
                alert('Failed to configure database. Please check your credentials.');
                return false;
            }
        } else {
            console.error('❌ App not ready');
            alert('App not ready. Please refresh the page and try again.');
            return false;
        }
    } catch (error) {
        console.error('❌ Configuration error:', error);
        alert('Configuration error: ' + error.message);
        return false;
    }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    // Wait for app to be ready
    setTimeout(() => {
        if (window.app) {
            configureDatabase();
        } else {
            console.log('Waiting for app to load...');
            setTimeout(() => {
                if (window.app) {
                    configureDatabase();
                } else {
                    console.log('Run configureDatabase() manually when app is ready');
                }
            }, 2000);
        }
    }, 1000);
}
