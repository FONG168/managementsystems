// Database Configuration Modal Component
export default class DatabaseConfig {
    constructor(app) {
        this.app = app;
        this.database = null; // Will be injected
    }

    setDatabase(database) {
        this.database = database;
    }

    show() {
        const modal = this.createModal();
        document.body.appendChild(modal);
        
        // Show modal
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('.modal-content').classList.remove('scale-95');
            modal.querySelector('.modal-content').classList.add('scale-100');
        }, 10);
    }

    hide() {
        const modal = document.getElementById('database-config-modal');
        if (modal) {
            modal.classList.add('opacity-0');
            modal.querySelector('.modal-content').classList.remove('scale-100');
            modal.querySelector('.modal-content').classList.add('scale-95');
            
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    createModal() {
        const modal = document.createElement('div');
        modal.id = 'database-config-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 opacity-0 transition-opacity duration-300';
        
        modal.innerHTML = `
            <div class="modal-content bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 transform scale-95 transition-transform duration-300">
                <!-- Header -->
                <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                            🗄️ Database Configuration
                        </h3>
                        <button onclick="window.databaseConfig.hide()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <!-- Content -->
                <div class="p-6">
                    <div class="mb-4">
                        <div class="flex items-center mb-2">
                            <span class="w-3 h-3 rounded-full mr-2 ${this.getStatusColor()}"></span>
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Status: ${this.getStatusText()}
                            </span>
                        </div>
                    </div>

                    <form id="database-config-form">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Supabase Project URL
                            </label>
                            <input 
                                type="url" 
                                id="supabase-url" 
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                placeholder="https://your-project.supabase.co"
                                value="${localStorage.getItem('supabase_url') || ''}"
                            >
                        </div>

                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Supabase Anon Key
                            </label>
                            <textarea 
                                id="supabase-key" 
                                rows="3"
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                placeholder="your-anon-key"
                            >${localStorage.getItem('supabase_key') || ''}</textarea>
                        </div>

                        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                            <h4 class="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                                📋 Setup Instructions:
                            </h4>
                            <ol class="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                                <li>Go to <a href="https://supabase.com" target="_blank" class="underline">supabase.com</a> and create a free account</li>
                                <li>Create a new project</li>
                                <li>Go to Settings → API</li>
                                <li>Copy your Project URL and anon public key</li>
                                <li>Run the SQL setup script (provided below)</li>
                            </ol>
                        </div>

                        <details class="mb-4">
                            <summary class="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                📝 SQL Setup Script (click to expand)
                            </summary>
                            <div class="bg-gray-100 dark:bg-gray-900 rounded-lg p-3 mt-2">
                                <pre class="text-xs text-gray-800 dark:text-gray-200 overflow-x-auto"><code>${this.getSQLScript()}</code></pre>
                                <button type="button" onclick="navigator.clipboard.writeText(\`${this.getSQLScript()}\`)" class="mt-2 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
                                    📋 Copy SQL
                                </button>
                            </div>
                        </details>

                        <div class="flex space-x-3">
                            <button 
                                type="submit" 
                                class="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                💾 Connect Database
                            </button>
                            <button 
                                type="button" 
                                onclick="window.databaseConfig.testConnection()"
                                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                🔍 Test
                            </button>
                            <button 
                                type="button" 
                                onclick="window.databaseConfig.useLocalStorage()"
                                class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                💻 Use Local
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Add event listeners
        modal.querySelector('#database-config-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.connectDatabase();
        });

        return modal;
    }

    async connectDatabase() {
        const url = document.getElementById('supabase-url').value.trim();
        const key = document.getElementById('supabase-key').value.trim();

        if (!url || !key) {
            this.app.showToast('Please enter both URL and API key', 'error');
            return;
        }

        try {
            const success = await this.database.initialize(url, key);
            if (success) {
                this.app.showToast('Database connected successfully!', 'success');
                this.app.updateDatabaseStatus();
                this.hide();
                // Reload app data from database
                await this.app.loadStateFromDatabase();
            } else {
                this.app.showToast('Failed to connect to database', 'error');
            }
        } catch (error) {
            console.error('Database connection error:', error);
            this.app.showToast('Database connection failed: ' + error.message, 'error');
        }
    }

    async testConnection() {
        const url = document.getElementById('supabase-url').value.trim();
        const key = document.getElementById('supabase-key').value.trim();

        if (!url || !key) {
            this.app.showToast('Please enter both URL and API key', 'error');
            return;
        }                try {
                    // Test connection without saving
                    const success = await this.database.initialize(url, key);
                    
                    if (success) {
                        this.app.showToast('Database connection test successful! ✅', 'success');
                    } else {
                        this.app.showToast('Database connection test failed ❌', 'error');
                    }
                } catch (error) {
                    console.error('Database test error:', error);
                    this.app.showToast('Connection test failed: ' + error.message, 'error');
                }
    }

    useLocalStorage() {
        // Clear stored database credentials
        localStorage.removeItem('supabase_url');
        localStorage.removeItem('supabase_key');
        
        // Reset database to use localStorage
        this.database.useLocalStorage = true;
        this.database.isConfigured = false;
        
        this.app.showToast('Using local storage mode', 'info');
        this.app.updateDatabaseStatus();
        this.hide();
    }

    getStatusColor() {
        const status = this.database?.getConnectionStatus() || 'local';
        switch (status) {
            case 'connected': return 'bg-green-500';
            case 'error': return 'bg-red-500';
            default: return 'bg-green-500'; // Local storage is working fine
        }
    }

    getStatusText() {
        const status = this.database?.getConnectionStatus() || 'local';
        switch (status) {
            case 'connected': return 'Connected to Database';
            case 'error': return 'Database Error (using local storage)';
            default: return 'Local Storage Ready';
        }
    }

    getSQLScript() {
        return `-- Employee Manager Database Tables
-- Run this SQL in your Supabase SQL Editor

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    staff_id VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(50),
    position VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    start_date DATE,
    salary DECIMAL(10,2),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Activity logs table  
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    month_key VARCHAR(7) NOT NULL,
    staff_id VARCHAR(10) NOT NULL,
    day INTEGER NOT NULL,
    activity VARCHAR(100) NOT NULL,
    count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- App settings table
CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_month_staff 
    ON activity_logs(month_key, staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_id ON staff(staff_id);`;
    }
}
