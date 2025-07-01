// Database Service using Supabase for persistent storage
// No local storage fallback - database connection required

import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';

class DatabaseService {
    constructor() {
        this.supabase = null;
        this.isConfigured = false;
        this.connectionStatus = 'disconnected'; // 'connected', 'error', 'disconnected'
        this.lastSyncTime = null;
    }

    // Initialize with Supabase credentials
    async initialize(supabaseUrl, supabaseKey) {
        try {
            console.log('🔍 Initializing Supabase connection...');
            
            if (!supabaseUrl || !supabaseKey) {
                throw new Error('Supabase URL and key are required');
            }

            // Create Supabase client
            this.supabase = createClient(supabaseUrl, supabaseKey);
            
            // Test connection by trying to fetch from a table
            const { data, error } = await this.supabase
                .from('staff')
                .select('count', { count: 'exact', head: true });
            
            if (error) {
                throw error;
            }

            // Store credentials securely
            localStorage.setItem('supabase_url', supabaseUrl);
            localStorage.setItem('supabase_key', supabaseKey);
            
            this.isConfigured = true;
            this.connectionStatus = 'connected';
            this.lastSyncTime = new Date().toISOString();
            console.log('✅ Supabase connection successful');
            
            return true;
        } catch (error) {
            console.error('❌ Supabase connection failed:', error);
            this.connectionStatus = 'error';
            this.isConfigured = false;
            throw error;
        }
    }

    // Auto-initialize from stored credentials
    async autoInitialize() {
        const url = localStorage.getItem('supabase_url');
        const key = localStorage.getItem('supabase_key');
        
        if (url && key) {
            try {
                await this.initialize(url, key);
                return true;
            } catch (error) {
                console.warn('Auto-initialization failed, manual setup required');
                return false;
            }
        }
        return false;
    }

    // Test connection
    async testConnection() {
        try {
            if (!this.supabase) {
                throw new Error('Database not initialized');
            }

            const { data, error } = await this.supabase
                .from('staff')
                .select('count', { count: 'exact', head: true });
            
            if (error) {
                throw error;
            }

            this.connectionStatus = 'connected';
            return true;
        } catch (error) {
            console.error('Database connection test failed:', error);
            this.connectionStatus = 'error';
            return false;
        }
    }

    // Get connection status
    getConnectionStatus() {
        return this.connectionStatus;
    }

    // Save staff data
    async saveStaff(staff) {
        if (!this.isConfigured) {
            throw new Error('Database not configured. Please connect to database first.');
        }

        try {
            // Clear existing staff data
            await this.supabase.from('staff').delete().neq('id', 0);
            
            // Insert new staff data
            if (staff && staff.length > 0) {
                const { error } = await this.supabase
                    .from('staff')
                    .insert(staff.map(member => ({
                        staff_id: member.id,
                        name: member.name,
                        department: member.department || null,
                        position: member.position || null,
                        email: member.email || null,
                        phone: member.phone || null,
                        start_date: member.startDate || null,
                        salary: member.salary || null,
                        active: member.active !== false
                    })));
                
                if (error) throw error;
            }
            
            this.lastSyncTime = new Date().toISOString();
            console.log('✅ Staff data saved to database');
            return true;
        } catch (error) {
            console.error('❌ Failed to save staff data:', error);
            this.connectionStatus = 'error';
            throw error;
        }
    }

    // Load staff data
    async loadStaff() {
        if (!this.isConfigured) {
            throw new Error('Database not configured. Please connect to database first.');
        }

        try {
            const { data, error } = await this.supabase
                .from('staff')
                .select('*')
                .order('name');
            
            if (error) throw error;
            
            // Convert to app format
            const staff = data.map(member => ({
                id: member.staff_id,
                name: member.name,
                department: member.department,
                position: member.position,
                email: member.email,
                phone: member.phone,
                startDate: member.start_date,
                salary: member.salary,
                active: member.active
            }));
            
            console.log(`✅ Loaded ${staff.length} staff members from database`);
            return staff;
        } catch (error) {
            console.error('❌ Failed to load staff data:', error);
            this.connectionStatus = 'error';
            throw error;
        }
    }

    // Save activity logs
    async saveLogs(logs) {
        if (!this.isConfigured) {
            throw new Error('Database not configured. Please connect to database first.');
        }

        try {
            // Clear existing logs
            await this.supabase.from('activity_logs').delete().neq('id', 0);
            
            // Convert logs to database format
            const logEntries = [];
            for (const [monthKey, monthData] of Object.entries(logs)) {
                for (const [staffId, staffLogs] of Object.entries(monthData)) {
                    for (const [day, dayLogs] of Object.entries(staffLogs)) {
                        for (const [activity, count] of Object.entries(dayLogs)) {
                            logEntries.push({
                                month_key: monthKey,
                                staff_id: staffId,
                                day: parseInt(day),
                                activity: activity,
                                count: count
                            });
                        }
                    }
                }
            }
            
            // Insert new logs
            if (logEntries.length > 0) {
                const { error } = await this.supabase
                    .from('activity_logs')
                    .insert(logEntries);
                
                if (error) throw error;
            }
            
            this.lastSyncTime = new Date().toISOString();
            console.log(`✅ Saved ${logEntries.length} activity log entries to database`);
            return true;
        } catch (error) {
            console.error('❌ Failed to save activity logs:', error);
            this.connectionStatus = 'error';
            throw error;
        }
    }

    // Load activity logs
    async loadLogs() {
        if (!this.isConfigured) {
            throw new Error('Database not configured. Please connect to database first.');
        }

        try {
            const { data, error } = await this.supabase
                .from('activity_logs')
                .select('*');
            
            if (error) throw error;
            
            // Convert to app format
            const logs = {};
            data.forEach(entry => {
                if (!logs[entry.month_key]) {
                    logs[entry.month_key] = {};
                }
                if (!logs[entry.month_key][entry.staff_id]) {
                    logs[entry.month_key][entry.staff_id] = {};
                }
                if (!logs[entry.month_key][entry.staff_id][entry.day]) {
                    logs[entry.month_key][entry.staff_id][entry.day] = {};
                }
                logs[entry.month_key][entry.staff_id][entry.day][entry.activity] = entry.count;
            });
            
            console.log('✅ Loaded activity logs from database');
            return logs;
        } catch (error) {
            console.error('❌ Failed to load activity logs:', error);
            this.connectionStatus = 'error';
            throw error;
        }
    }

    // Get sync status
    getSyncStatus() {
        return {
            enabled: this.isConfigured,
            connected: this.connectionStatus === 'connected',
            lastSync: this.lastSyncTime,
            status: this.connectionStatus
        };
    }

    // Clear all data (for testing/reset)
    async clearAllData() {
        if (!this.isConfigured) {
            throw new Error('Database not configured');
        }

        try {
            await this.supabase.from('activity_logs').delete().neq('id', 0);
            await this.supabase.from('staff').delete().neq('id', 0);
            console.log('✅ All data cleared from database');
            return true;
        } catch (error) {
            console.error('❌ Failed to clear data:', error);
            this.connectionStatus = 'error';
            throw error;
        }
    }
}

// Create and export a single instance
const database = new DatabaseService();
export default database;
window.DatabaseService = DatabaseService;
window.database = database;
