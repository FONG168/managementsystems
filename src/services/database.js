// Database Service using API for shared storage
// Simple API-based sync for cross-browser synchronization

class DatabaseService {
    constructor() {
        this.apiUrl = window.location.origin + '/api/data';
        this.isConfigured = false;
        this.useLocalStorage = true; // Fallback to localStorage when sync is not enabled
        this.syncInterval = null;
        this.autoSyncEnabled = true;
        this.syncIntervalMs = 5000; // Sync every 5 seconds (faster polling)
        this.lastDataHash = null;
        this.isOffline = false;
        this.lastSyncTime = null;
        this.syncQueue = []; // Queue for failed sync operations
        this.isSyncing = false; // Prevent concurrent syncs
        this.consecutiveFailures = 0;
        this.maxRetries = 3;
        this.backoffMultiplier = 1.5;
        this.connectionCheckInterval = null;
        this.pendingChanges = new Set(); // Track what needs syncing
    }

    // Initialize database connection
    async initialize() {
        try {
            console.log('🔍 Database initialize: Attempting auto-sync connection...');
            console.log('🔗 API URL:', this.apiUrl);
            
            // Always try to enable API sync first
            console.log('🔄 Testing API connection for auto-sync...');
            
            // Test API connection with retry logic
            const connectionTest = await this.testConnectionWithRetry();
            
            if (connectionTest) {
                this.useLocalStorage = false;
                this.isConfigured = true;
                this.isOffline = false;
                this.consecutiveFailures = 0;
                console.log('✅ API sync mode enabled - automatic multi-browser sync active');
                console.log('🔧 useLocalStorage set to:', this.useLocalStorage);
                
                // Start automatic sync polling
                this.startAutoSync();
                
                // Start connection monitoring
                this.startConnectionMonitoring();
                
                // Initial sync to get latest data
                await this.performInitialSync();
                
                return true;
            } else {
                console.warn('⚠️ API test failed, using localStorage with retry mechanism');
                this.useLocalStorage = true;
                this.isOffline = true;
                
                // Set up retry mechanism to keep trying to connect
                this.setupRetryConnection();
                
                return false;
            }
        } catch (error) {
            console.error('Database initialization failed:', error);
            this.useLocalStorage = true;
            this.isOffline = true;
            
            // Set up retry mechanism
            this.setupRetryConnection();
            
            return false;
        }
    }

    async testConnection() {
        try {
            console.log('🧪 Testing API connection to:', this.apiUrl);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // Increase timeout to 8 seconds
            
            const response = await fetch(this.apiUrl, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Cache-Control': 'no-cache',
                    'Accept': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            console.log('📡 API Response status:', response.status);
            
            if (!response.ok) {
                console.error('❌ API response not OK:', response.status, response.statusText);
                this.consecutiveFailures++;
                return false;
            }
            
            const data = await response.json();
            console.log('📦 API Response data:', data);
            
            if (data && data.success !== false) {
                console.log('✅ API connection successful');
                this.consecutiveFailures = 0;
                return true;
            } else {
                console.error('❌ API connection test failed - invalid response:', data);
                this.consecutiveFailures++;
                return false;
            }
        } catch (error) {
            console.error('❌ API connection test failed with error:', error.name, error.message);
            this.consecutiveFailures++;
            return false;
        }
    }

    // Test connection with retry logic
    async testConnectionWithRetry(maxRetries = 5) {
        console.log(`🔄 Testing connection with up to ${maxRetries} retries...`);
        
        for (let i = 0; i < maxRetries; i++) {
            console.log(`📡 Attempt ${i + 1}/${maxRetries}...`);
            const result = await this.testConnection();
            if (result) {
                console.log(`✅ Connection successful on attempt ${i + 1}`);
                return true;
            }
            
            if (i < maxRetries - 1) {
                const delay = Math.min(1000 * Math.pow(this.backoffMultiplier, i), 8000);
                console.log(`⏳ Retry ${i + 1}/${maxRetries} in ${delay}ms...`);
                await this.sleep(delay);
            }
        }
        
        console.error(`❌ All ${maxRetries} connection attempts failed`);
        return false;
    }

    // Start automatic syncing
    startAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        if (!this.autoSyncEnabled) {
            console.log('🔄 Auto-sync disabled');
            return;
        }

        console.log(`🔄 Starting enhanced auto-sync every ${this.syncIntervalMs/1000} seconds`);
        
        this.syncInterval = setInterval(async () => {
            if (!this.isSyncing) {
                try {
                    await this.performAutoSync();
                } catch (error) {
                    console.error('Auto-sync error:', error);
                    this.handleSyncError(error);
                }
            }
        }, this.syncIntervalMs);
    }

    // Stop automatic syncing
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('🛑 Auto-sync stopped');
        }
    }

    // Perform automatic sync check
    async performAutoSync() {
        if (this.useLocalStorage || this.isOffline || this.isSyncing) {
            return;
        }

        this.isSyncing = true;

        try {
            // Process any queued sync operations first
            await this.processQueuedSync();
            
            // Check if there are any changes to sync
            const currentDataHash = await this.getCurrentDataHash();
            
            if (currentDataHash && currentDataHash !== this.lastDataHash) {
                console.log('🔄 Data changes detected, performing sync...');
                this.lastDataHash = currentDataHash;
                this.lastSyncTime = Date.now();
                
                // Trigger any listeners that need to know about data changes
                this.notifyDataChange();
            }

            this.consecutiveFailures = 0;
        } catch (error) {
            console.error('Auto-sync check failed:', error);
            this.handleSyncError(error);
        } finally {
            this.isSyncing = false;
        }
    }

    // Setup retry connection mechanism
    setupRetryConnection() {
        // Don't setup multiple retry timers
        if (this.retryTimer) {
            return;
        }

        console.log('🔄 Setting up enhanced connection retry mechanism...');
        
        let retryCount = 0;
        const maxRetries = 20; // Try for about 20 minutes
        
        this.retryTimer = setInterval(async () => {
            retryCount++;
            console.log(`🔄 Attempting to reconnect to API... (${retryCount}/${maxRetries})`);
            
            const connectionTest = await this.testConnection();
            
            if (connectionTest) {
                console.log('✅ Reconnected to API! Switching to sync mode...');
                
                this.useLocalStorage = false;
                this.isConfigured = true;
                this.isOffline = false;
                this.consecutiveFailures = 0;
                
                // Clear retry timer
                clearInterval(this.retryTimer);
                this.retryTimer = null;
                
                // Start auto-sync
                this.startAutoSync();
                
                // Start connection monitoring
                this.startConnectionMonitoring();
                
                // Perform initial sync and process queue
                await this.performInitialSync();
                await this.processQueuedSync();
                
                // Also trigger a full data reload for the app
                this.triggerDataReload();
                
                // Notify app about connection restoration
                this.notifyConnectionChange('connected');
                
            } else if (retryCount >= maxRetries) {
                console.warn('⚠️ Max retry attempts reached, stopping retry mechanism');
                clearInterval(this.retryTimer);
                this.retryTimer = null;
                // Will continue using localStorage
            }
        }, 60000); // Retry every minute
    }

    // Get hash of current data for change detection
    async getCurrentDataHash() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
            
            const response = await fetch(`${this.apiUrl}?type=hash`, {
                signal: controller.signal,
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            clearTimeout(timeoutId);
            const result = await response.json();
            
            if (response.ok && result.success) {
                return result.hash || '';
            } else {
                console.warn('Failed to get data hash, response not ok:', result);
                return null;
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('Data hash request timed out');
            } else {
                console.error('Failed to get data hash:', error);
            }
            return null;
        }
    }

    // Notify about data changes
    notifyDataChange() {
        // Dispatch custom event that app can listen to
        window.dispatchEvent(new CustomEvent('database:dataChanged', {
            detail: { timestamp: Date.now() }
        }));
    }

    // Notify about connection changes
    notifyConnectionChange(status) {
        window.dispatchEvent(new CustomEvent('database:connectionChanged', {
            detail: { status, timestamp: Date.now() }
        }));
    }

    // Trigger data reload for the app
    triggerDataReload() {
        window.dispatchEvent(new CustomEvent('database:forceReload', {
            detail: { timestamp: Date.now() }
        }));
    }

    // Staff Management
    async saveStaff(staff) {
        console.log('💾 Saving staff data...');
        
        if (this.useLocalStorage) {
            const result = this._saveToLocalStorage('staff', staff);
            console.log('📱 Staff saved to localStorage');
            
            // Queue for sync when connection is restored
            this.queueSyncOperation('staff', 'save', staff);
            
            return result;
        }

        try {
            await this.syncStaffToAPI(staff);
            
            // Immediate sync successful, trigger hash update
            await this.performImmediateSync('staff', staff);
            
            return { success: true };
        } catch (error) {
            console.error('Failed to save staff to API:', error);
            console.log('📱 Falling back to localStorage...');
            
            // Save locally and queue for retry
            const localResult = this._saveToLocalStorage('staff', staff);
            this.queueSyncOperation('staff', 'save', staff);
            
            return localResult;
        }
    }

    // Separate method for API sync
    async syncStaffToAPI(staff) {
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
        
        console.log('✅ Staff data synchronized to API:', result.message);
        this.lastSyncTime = Date.now();
        return result;
    }

    async loadStaff() {
        console.log(`🔍 loadStaff: useLocalStorage=${this.useLocalStorage}`);
        
        if (this.useLocalStorage) {
            const localData = this._loadFromLocalStorage('staff', []);
            console.log(`📱 Loading from localStorage: ${localData.length} staff members`);
            return localData;
        }

        try {
            console.log('🌐 Loading staff from API...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
            
            const response = await fetch(`${this.apiUrl}?type=staff`, {
                signal: controller.signal,
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            clearTimeout(timeoutId);
            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to load staff data');
            }
            
            console.log(`✅ Staff data loaded from API: ${result.data?.length || 0} members`);
            
            // Cache locally for faster access and offline fallback
            this._saveToLocalStorage('staff', result.data || []);
            
            return result.data || [];
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('⚠️ Staff load request timed out, using localStorage');
            } else {
                console.error('Failed to load staff from API:', error);
            }
            
            const fallbackData = this._loadFromLocalStorage('staff', []);
            console.log(`📱 Fallback to localStorage: ${fallbackData.length} staff members`);
            return fallbackData;
        }
    }

    // Logs Management
    async saveLogs(logs) {
        console.log('💾 Saving logs data...');
        
        if (this.useLocalStorage) {
            const result = this._saveToLocalStorage('logs', logs);
            console.log('📱 Logs saved to localStorage');
            
            // Queue for sync when connection is restored
            this.queueSyncOperation('logs', 'save', logs);
            
            return result;
        }

        try {
            await this.syncLogsToAPI(logs);
            
            // Immediate sync successful, trigger hash update
            await this.performImmediateSync('logs', logs);
            
            return { success: true };
        } catch (error) {
            console.error('Failed to save logs to API:', error);
            console.log('📱 Falling back to localStorage...');
            
            // Save locally and queue for retry
            const localResult = this._saveToLocalStorage('logs', logs);
            this.queueSyncOperation('logs', 'save', logs);
            
            return localResult;
        }
    }

    // Separate method for API sync
    async syncLogsToAPI(logs) {
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
        
        console.log('✅ Logs data synchronized to API:', result.message);
        this.lastSyncTime = Date.now();
        return result;
    }

    async loadLogs() {
        console.log(`🔍 loadLogs: useLocalStorage=${this.useLocalStorage}`);
        
        if (this.useLocalStorage) {
            const localData = this._loadFromLocalStorage('logs', {});
            console.log('📱 Loading logs from localStorage');
            return localData;
        }

        try {
            console.log('🌐 Loading logs from API...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
            
            const response = await fetch(`${this.apiUrl}?type=logs`, {
                signal: controller.signal,
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            clearTimeout(timeoutId);
            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to load logs data');
            }
            
            console.log('✅ Logs data loaded from API');
            
            // Cache locally for faster access and offline fallback
            this._saveToLocalStorage('logs', result.data || {});
            
            return result.data || {};
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('⚠️ Logs load request timed out, using localStorage');
            } else {
                console.error('Failed to load logs from API:', error);
            }
            
            const fallbackData = this._loadFromLocalStorage('logs', {});
            console.log('📱 Fallback to localStorage for logs');
            return fallbackData;
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
        console.log('🔍 Connection Status Check:', {
            useLocalStorage: this.useLocalStorage,
            isConfigured: this.isConfigured,
            isOffline: this.isOffline,
            consecutiveFailures: this.consecutiveFailures
        });
        
        if (!this.useLocalStorage && this.isConfigured && !this.isOffline) {
            console.log('📊 Returning status: connected');
            return {
                status: 'connected',
                lastSync: this.lastSyncTime,
                queuedOperations: this.syncQueue.length,
                consecutiveFailures: this.consecutiveFailures
            };
        } else if (!this.useLocalStorage && this.isOffline) {
            console.log('📊 Returning status: reconnecting');
            return {
                status: 'reconnecting',
                lastSync: this.lastSyncTime,
                queuedOperations: this.syncQueue.length,
                consecutiveFailures: this.consecutiveFailures
            };
        } else if (!this.useLocalStorage) {
            console.log('📊 Returning status: error');
            return {
                status: 'error',
                lastSync: this.lastSyncTime,
                queuedOperations: this.syncQueue.length,
                consecutiveFailures: this.consecutiveFailures
            };
        } else {
            console.log('📊 Returning status: local');
            return {
                status: 'local',
                lastSync: null,
                queuedOperations: this.syncQueue.length,
                consecutiveFailures: this.consecutiveFailures
            };
        }
    }

    // Cleanup method to stop intervals when app is closed
    cleanup() {
        console.log('🧹 Cleaning up database service...');
        
        this.stopAutoSync();
        
        if (this.retryTimer) {
            clearInterval(this.retryTimer);
            this.retryTimer = null;
        }
        
        if (this.connectionCheckInterval) {
            clearInterval(this.connectionCheckInterval);
            this.connectionCheckInterval = null;
        }
        
        console.log('✅ Database service cleanup completed');
    }

    // Get sync statistics for debugging
    getSyncStats() {
        return {
            isOnline: !this.isOffline,
            usingAPI: !this.useLocalStorage,
            lastSyncTime: this.lastSyncTime,
            lastDataHash: this.lastDataHash,
            queueLength: this.syncQueue.length,
            consecutiveFailures: this.consecutiveFailures,
            autoSyncEnabled: this.autoSyncEnabled,
            syncInterval: this.syncIntervalMs
        };
    }

    // Force reconnection method that can be called manually
    async forceReconnect() {
        console.log('🔄 === FORCE RECONNECT INITIATED ===');
        
        // Reset connection state
        this.useLocalStorage = true;
        this.isConfigured = false;
        this.isOffline = true;
        this.consecutiveFailures = 0;
        
        // Stop existing sync
        this.stopAutoSync();
        
        // Try to reconnect
        const success = await this.initialize();
        
        if (success) {
            console.log('✅ Force reconnect successful!');
            // Trigger UI update
            if (window.app) {
                window.app.updateDatabaseStatus();
            }
            return true;
        } else {
            console.error('❌ Force reconnect failed');
            return false;
        }
    }

    // Helper method for delays
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Handle sync errors with exponential backoff
    handleSyncError(error) {
        this.consecutiveFailures++;
        
        if (this.consecutiveFailures >= this.maxRetries) {
            console.warn('⚠️ Multiple sync failures, switching to offline mode temporarily');
            this.isOffline = true;
            this.setupRetryConnection();
        }
    }

    // Perform initial sync when connection is established
    async performInitialSync() {
        try {
            console.log('🔄 Performing initial sync...');
            const hash = await this.getCurrentDataHash();
            this.lastDataHash = hash;
            this.lastSyncTime = Date.now();
            console.log('✅ Initial sync completed');
        } catch (error) {
            console.error('Initial sync failed:', error);
        }
    }

    // Start connection monitoring for better reliability
    startConnectionMonitoring() {
        if (this.connectionCheckInterval) {
            clearInterval(this.connectionCheckInterval);
        }

        this.connectionCheckInterval = setInterval(async () => {
            if (!this.isOffline && !this.useLocalStorage) {
                const isConnected = await this.testConnection();
                if (!isConnected) {
                    console.warn('⚠️ Connection lost, switching to offline mode');
                    this.isOffline = true;
                    this.setupRetryConnection();
                }
            }
        }, 30000); // Check every 30 seconds
    }

    // Process queued sync operations
    async processQueuedSync() {
        if (this.syncQueue.length === 0) return;

        console.log(`🔄 Processing ${this.syncQueue.length} queued sync operations...`);
        
        const queue = [...this.syncQueue];
        this.syncQueue = [];

        for (const operation of queue) {
            try {
                await this.executeQueuedOperation(operation);
            } catch (error) {
                console.error('Failed to execute queued operation:', error);
                // Re-queue if it's a temporary failure
                if (this.shouldRequeue(error)) {
                    this.syncQueue.push(operation);
                }
            }
        }
    }

    // Execute a queued sync operation
    async executeQueuedOperation(operation) {
        const { type, action, data } = operation;
        
        if (action === 'save') {
            if (type === 'staff') {
                await this.syncStaffToAPI(data);
            } else if (type === 'logs') {
                await this.syncLogsToAPI(data);
            }
        }
    }

    // Determine if an operation should be re-queued
    shouldRequeue(error) {
        // Re-queue for network errors, but not for data validation errors
        return error.name === 'TypeError' || error.message.includes('fetch');
    }

    // Queue a sync operation for later
    queueSyncOperation(type, action, data) {
        this.syncQueue.push({
            type,
            action,
            data,
            timestamp: Date.now()
        });
        console.log(`📝 Queued ${action} operation for ${type}`);
    }

    // Immediate sync for critical changes
    async performImmediateSync(type, data) {
        if (this.useLocalStorage || this.isOffline) {
            this.queueSyncOperation(type, 'save', data);
            return;
        }

        try {
            if (type === 'staff') {
                await this.syncStaffToAPI(data);
            } else if (type === 'logs') {
                await this.syncLogsToAPI(data);
            }
            
            // Update hash after successful sync
            this.lastDataHash = await this.getCurrentDataHash();
            this.lastSyncTime = Date.now();
            
        } catch (error) {
            console.error('Immediate sync failed:', error);
            this.queueSyncOperation(type, 'save', data);
            this.handleSyncError(error);
        }
    }
}

// Export as singleton instance
const databaseService = new DatabaseService();
export default databaseService;
