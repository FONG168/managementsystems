// Database Service using API for shared storage
// Simple API-based sync for cross-browser synchronization

class DatabaseService {
    constructor() {
        this.apiUrl = window.location.origin + '/api/data';
        this.isConfigured = false;
        this.useLocalStorage = true; // Fallback to localStorage when sync is not enabled
    }

    // Initialize database connection
    async initialize() {
        try {
            // Check if sync mode is forced
            const forceSyncMode = localStorage.getItem('force_sync_mode') === 'true';
            
            if (forceSyncMode) {
                console.log('🔄 Sync mode enabled - testing API connection...');
                
                // Test API connection
                const connectionTest = await this.testConnection();
                
                if (connectionTest) {
                    this.useLocalStorage = false;
                    this.isConfigured = true;
                    console.log('✅ API sync mode enabled - multi-browser sync active');
                    return true;
                } else {
                    console.warn('⚠️ API test failed, falling back to localStorage');
                    this.useLocalStorage = true;
                    return false;
                }
            } else {
                console.log('📝 Sync not enabled, using localStorage');
                return false;
            }
        } catch (error) {
            console.error('Database initialization failed:', error);
            this.useLocalStorage = true;
            return false;
        }
    }

    async testConnection() {
        try {
            console.log('🧪 Testing API connection...');
            const response = await fetch(this.apiUrl);
            const data = await response.json();
            
            if (response.ok && data.success) {
                console.log('✅ API connection successful');
                return true;
            } else {
                console.error('❌ API connection test failed:', data);
                return false;
            }
        } catch (error) {
            console.error('❌ API connection test failed:', error);
            return false;
        }
    }

    // Staff Management
    async saveStaff(staff) {
        if (this.useLocalStorage) {
            return this._saveToLocalStorage('staff', staff);
        }

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'staff',
                    data: staff
                })
            });

            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to save staff data');
            }
            
            console.log('✅ Staff data synchronized:', result.message);
            return result;
        } catch (error) {
            console.error('Failed to save staff to API:', error);
            return this._saveToLocalStorage('staff', staff);
        }
    }

    async loadStaff() {
        if (this.useLocalStorage) {
            return this._loadFromLocalStorage('staff', []);
        }

        try {
            const response = await fetch(`${this.apiUrl}?type=staff`);
            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to load staff data');
            }
            
            console.log('✅ Staff data loaded from API');
            return result.data || [];
        } catch (error) {
            console.error('Failed to load staff from API:', error);
            return this._loadFromLocalStorage('staff', []);
        }
    }

    // Logs Management
    async saveLogs(logs) {
        if (this.useLocalStorage) {
            return this._saveToLocalStorage('logs', logs);
        }

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'logs',
                    data: logs
                })
            });

            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to save logs data');
            }
            
            console.log('✅ Logs data synchronized:', result.message);
            return result;
        } catch (error) {
            console.error('Failed to save logs to API:', error);
            return this._saveToLocalStorage('logs', logs);
        }
    }

    async loadLogs() {
        if (this.useLocalStorage) {
            return this._loadFromLocalStorage('logs', {});
        }

        try {
            const response = await fetch(`${this.apiUrl}?type=logs`);
            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to load logs data');
            }
            
            console.log('✅ Logs data loaded from API');
            return result.data || {};
        } catch (error) {
            console.error('Failed to load logs from API:', error);
            return this._loadFromLocalStorage('logs', {});
        }
    }

    // Settings Management (simplified for API)
    async saveSettings(settings) {
        return this._saveToLocalStorage('settings', settings);
    }

    async loadSettings() {
        return this._loadFromLocalStorage('settings', {
            theme: 'light',
            dateFormat: 'MM/DD/YYYY',
            currency: 'USD'
        });
    }

    // Database setup (not needed for API)
    async setupDatabase() {
        return true; // API handles storage automatically
    }

    // Helper methods for localStorage fallback
    _saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(`emp_mgr_${key}`, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Failed to save ${key} to localStorage:`, error);
            return false;
        }
    }

    _loadFromLocalStorage(key, defaultValue) {
        try {
            const stored = localStorage.getItem(`emp_mgr_${key}`);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch (error) {
            console.error(`Failed to load ${key} from localStorage:`, error);
            return defaultValue;
        }
    }

    isUsingDatabase() {
        return !this.useLocalStorage;
    }

    getConnectionStatus() {
        if (!this.useLocalStorage && this.isConfigured) {
            return 'connected';
        } else if (!this.useLocalStorage) {
            return 'error';
        } else {
            return 'local';
        }
    }
}

// Export as singleton instance
const databaseService = new DatabaseService();
export default databaseService;
