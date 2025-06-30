// Database Service using Supabase
// Note: Supabase client will be loaded from CDN in index.html

// Demo configuration - In production, these would be environment variables
const SUPABASE_URL = 'https://your-project-url.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

class DatabaseService {
    constructor() {
        this.supabase = null;
        this.isConfigured = false;
        this.useLocalStorage = true; // Fallback to localStorage when not configured
    }

    // Initialize database connection
    async initialize(supabaseUrl = null, supabaseKey = null) {
        try {
            // Check if database mode is forced
            const forceDatabaseMode = localStorage.getItem('force_database_mode') === 'true';
            
            // Use provided credentials or check for stored ones
            const url = supabaseUrl || localStorage.getItem('supabase_url');
            const key = supabaseKey || localStorage.getItem('supabase_key');

            if (url && key) {
                // Use global supabase client from CDN
                if (typeof window.supabase === 'undefined') {
                    console.error('Supabase client not loaded. Please include Supabase CDN.');
                    return false;
                }
                
                console.log('🔗 Initializing database connection...');
                this.supabase = window.supabase.createClient(url, key);
                this.isConfigured = true;
                
                // Store credentials for future use
                if (supabaseUrl) localStorage.setItem('supabase_url', url);
                if (supabaseKey) localStorage.setItem('supabase_key', key);
                
                // Test connection
                const connectionTest = await this.testConnection();
                
                if (connectionTest || forceDatabaseMode) {
                    this.useLocalStorage = false;
                    console.log('✅ Database mode enabled - multi-browser sync active');
                    return true;
                } else {
                    console.warn('⚠️ Database test failed, falling back to localStorage');
                    this.useLocalStorage = true;
                    return false;
                }
            } else {
                console.log('📝 Database not configured, using localStorage');
                return false;
            }
        } catch (error) {
            console.error('Database initialization failed:', error);
            
            // Check if forced mode is enabled
            const forceDatabaseMode = localStorage.getItem('force_database_mode') === 'true';
            if (forceDatabaseMode) {
                console.log('🔧 Force database mode enabled, continuing despite errors');
                this.useLocalStorage = false;
                return true;
            } else {
                this.useLocalStorage = true;
                return false;
            }
        }
    }

    async testConnection() {
        if (!this.isConfigured) return false;
        
        try {
            console.log('🧪 Testing database connection...');
            const { data, error } = await this.supabase.from('staff').select('count');
            
            if (error) {
                if (error.code === 'PGRST116') {
                    // Table doesn't exist yet - this is okay for initial setup
                    console.log('⚠️ Database connected but tables need to be created');
                    return true; // Return true because connection works
                } else {
                    console.error('❌ Database connection test failed:', error);
                    return false;
                }
            }
            
            console.log('✅ Database connection successful');
            return true;
        } catch (error) {
            console.error('❌ Database connection test failed:', error);
            return false;
        }
    }

    // Staff Management
    async saveStaff(staff) {
        if (this.useLocalStorage) {
            return this._saveToLocalStorage('staff', staff);
        }

        try {
            // First, delete all existing staff to replace with new data
            await this.supabase.from('staff').delete().gte('id', 0);
            
            // Insert new staff data
            const { data, error } = await this.supabase
                .from('staff')
                .insert(staff.map(s => ({
                    staff_id: s.id,
                    name: s.name,
                    department: s.department,
                    position: s.position,
                    email: s.email,
                    phone: s.phone,
                    start_date: s.startDate,
                    salary: s.salary,
                    active: s.active,
                    updated_at: new Date().toISOString()
                })));

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Failed to save staff to database:', error);
            return this._saveToLocalStorage('staff', staff);
        }
    }

    async loadStaff() {
        if (this.useLocalStorage) {
            return this._loadFromLocalStorage('staff', []);
        }

        try {
            const { data, error } = await this.supabase
                .from('staff')
                .select('*')
                .order('staff_id');

            if (error) throw error;
            
            // Convert database format back to app format
            return data.map(s => ({
                id: s.staff_id,
                name: s.name,
                department: s.department,
                position: s.position,
                email: s.email,
                phone: s.phone,
                startDate: s.start_date,
                salary: s.salary,
                active: s.active
            }));
        } catch (error) {
            console.error('Failed to load staff from database:', error);
            return this._loadFromLocalStorage('staff', []);
        }
    }

    // Logs Management
    async saveLogs(logs) {
        if (this.useLocalStorage) {
            return this._saveToLocalStorage('logs', logs);
        }

        try {
            // Clear existing logs
            await this.supabase.from('activity_logs').delete().gte('id', 0);

            // Prepare log entries for database
            const logEntries = [];
            Object.entries(logs).forEach(([monthKey, monthData]) => {
                if (monthData.data) {
                    Object.entries(monthData.data).forEach(([staffId, staffDays]) => {
                        Object.entries(staffDays).forEach(([day, activities]) => {
                            Object.entries(activities).forEach(([activity, count]) => {
                                logEntries.push({
                                    month_key: monthKey,
                                    staff_id: staffId,
                                    day: parseInt(day),
                                    activity: activity,
                                    count: count,
                                    updated_at: new Date().toISOString()
                                });
                            });
                        });
                    });
                }
            });

            if (logEntries.length > 0) {
                const { data, error } = await this.supabase
                    .from('activity_logs')
                    .insert(logEntries);

                if (error) throw error;
            }

            // Save activities list
            const activities = Object.values(logs)[0]?.activities || [];
            await this.supabase.from('activities').delete().gte('id', 0);
            if (activities.length > 0) {
                const { error: activitiesError } = await this.supabase
                    .from('activities')
                    .insert(activities.map((activity, index) => ({
                        name: activity,
                        order_index: index
                    })));
                
                if (activitiesError) throw activitiesError;
            }

            return true;
        } catch (error) {
            console.error('Failed to save logs to database:', error);
            return this._saveToLocalStorage('logs', logs);
        }
    }

    async loadLogs() {
        if (this.useLocalStorage) {
            return this._loadFromLocalStorage('logs', {});
        }

        try {
            // Load activities
            const { data: activitiesData, error: activitiesError } = await this.supabase
                .from('activities')
                .select('*')
                .order('order_index');

            if (activitiesError) throw activitiesError;

            // Load log entries
            const { data: logsData, error: logsError } = await this.supabase
                .from('activity_logs')
                .select('*')
                .order('month_key, staff_id, day');

            if (logsError) throw logsError;

            // Reconstruct logs structure
            const logs = {};
            const activities = activitiesData.map(a => a.name);

            // Group by month
            logsData.forEach(entry => {
                const { month_key, staff_id, day, activity, count } = entry;
                
                if (!logs[month_key]) {
                    logs[month_key] = {
                        activities: activities,
                        data: {}
                    };
                }
                
                if (!logs[month_key].data[staff_id]) {
                    logs[month_key].data[staff_id] = {};
                }
                
                const dayKey = String(day).padStart(2, '0');
                if (!logs[month_key].data[staff_id][dayKey]) {
                    logs[month_key].data[staff_id][dayKey] = {};
                }
                
                logs[month_key].data[staff_id][dayKey][activity] = count;
            });

            return logs;
        } catch (error) {
            console.error('Failed to load logs from database:', error);
            return this._loadFromLocalStorage('logs', {});
        }
    }

    // Settings Management
    async saveSettings(settings) {
        if (this.useLocalStorage) {
            return this._saveToLocalStorage('settings', settings);
        }

        try {
            // Clear existing settings
            await this.supabase.from('app_settings').delete().gte('id', 0);

            // Save new settings
            const settingsEntries = Object.entries(settings).map(([key, value]) => ({
                setting_key: key,
                setting_value: JSON.stringify(value),
                updated_at: new Date().toISOString()
            }));

            const { data, error } = await this.supabase
                .from('app_settings')
                .insert(settingsEntries);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Failed to save settings to database:', error);
            return this._saveToLocalStorage('settings', settings);
        }
    }

    async loadSettings() {
        if (this.useLocalStorage) {
            return this._loadFromLocalStorage('settings', {
                theme: 'light',
                dateFormat: 'MM/DD/YYYY',
                currency: 'USD'
            });
        }

        try {
            const { data, error } = await this.supabase
                .from('app_settings')
                .select('*');

            if (error) throw error;

            const settings = {};
            data.forEach(setting => {
                settings[setting.setting_key] = JSON.parse(setting.setting_value);
            });

            return settings;
        } catch (error) {
            console.error('Failed to load settings from database:', error);
            return this._loadFromLocalStorage('settings', {
                theme: 'light',
                dateFormat: 'MM/DD/YYYY',
                currency: 'USD'
            });
        }
    }

    // Database Setup - Create tables if they don't exist
    async setupDatabase() {
        if (!this.isConfigured) return false;

        try {
            // This would typically be done via Supabase dashboard or migrations
            // For now, we'll just test if tables exist
            await this.testConnection();
            return true;
        } catch (error) {
            console.error('Database setup failed:', error);
            return false;
        }
    }

    // Utility methods for localStorage fallback
    _saveToLocalStorage(key, data) {
        try {
            const state = JSON.parse(localStorage.getItem('employeeManagerState') || '{}');
            state[key] = data;
            localStorage.setItem('employeeManagerState', JSON.stringify(state));
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    }

    _loadFromLocalStorage(key, defaultValue) {
        try {
            const state = JSON.parse(localStorage.getItem('employeeManagerState') || '{}');
            return state[key] || defaultValue;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return defaultValue;
        }
    }

    // Status methods
    isUsingDatabase() {
        return this.isConfigured && !this.useLocalStorage;
    }

    getConnectionStatus() {
        // Check if database mode is forced
        const forceDatabaseMode = localStorage.getItem('force_database_mode') === 'true';
        
        if (forceDatabaseMode) {
            return 'connected'; // Force green status when database mode is enabled
        }
        
        if (this.isConfigured && !this.useLocalStorage) {
            return 'connected';
        } else if (this.isConfigured && this.useLocalStorage) {
            return 'error';
        } else {
            return 'local';
        }
    }
}

export default new DatabaseService();
