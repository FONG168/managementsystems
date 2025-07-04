// Main Application Controller
import { StaffManager } from './components/staff.js';
import { SummaryManager } from './components/summary.js';
import { LogsManager } from './components/logs.js';
import { Utils } from './components/utils.js';
import DatabaseService from './services/database.js';
import DatabaseConfig from './components/database-config.js';

class App {
    constructor() {
        this.currentPage = null;
        this.state = {
            staff: [],
            logs: {},
            settings: {
                theme: 'light',
                dateFormat: 'MM/DD/YYYY',
                currency: 'USD'
            }
        };
        
        // Add sync-related properties
        this.lastSyncTimestamp = Date.now();
        this.syncConflictCount = 0;
        this.isLoadingFromSync = false;
        
        this.staffManager = new StaffManager(this);
        this.summaryManager = new SummaryManager(this);
        this.logsManager = new LogsManager(this);
        
        this.database = DatabaseService;
        this.databaseConfig = new DatabaseConfig(this);
        this.databaseConfig.setDatabase(this.database);
        window.databaseConfig = this.databaseConfig;
        
        this.init();
    }

    async init() {
        console.log('🚀 Starting app initialization...');
        
        try {
            // Check if all dependencies are loaded
            console.log('📋 Checking dependencies...');
            if (typeof Chart === 'undefined') {
                console.warn('⚠️ Chart.js not loaded yet, waiting...');
                await this.waitForGlobal('Chart', 5000);
            }
            
            if (typeof supabase === 'undefined') {
                console.warn('⚠️ Supabase not loaded yet, waiting...');
                await this.waitForGlobal('supabase', 5000);
            }
            
            console.log('✅ All dependencies loaded');
            
            // Initialize database connection with auto-initialization
            console.log('📡 Initializing database...');
            await this.initializeDatabase();
            
            console.log('💾 Loading saved state...');
            await this.loadState();
            
            console.log('🎯 Setting up event listeners...');
            this.setupEventListeners();
            
            console.log('🗺️ Setting up routing...');
            this.setupRouting();
            
            console.log('📊 Updating database status...');
            this.updateDatabaseStatus();
            
            // Load initial page
            console.log('📄 Navigating to initial page...');
            this.navigate(window.location.hash || '#/staff');
            
            // Hide loading screen after everything is ready
            setTimeout(() => {
                const loadingElement = document.getElementById('loading');
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                }
                
                // Show success message
                this.showToast('✅ App loaded successfully!', 'success');
                console.log('✅ App initialization completed');
            }, 500);
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            
            // Show error message to user
            const loadingElement = document.getElementById('loading');
            if (loadingElement) {
                loadingElement.innerHTML = `
                    <div class="text-center text-red-600">
                        <div class="text-6xl mb-4">❌</div>
                        <h2 class="text-2xl font-bold mb-2">Loading Failed</h2>
                        <p class="mb-4">Error: ${error.message}</p>
                        <button onclick="location.reload()" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            Retry
                        </button>
                    </div>
                `;
            }
        }
    }
    
    // Initialize database with auto-connection attempt
    async initializeDatabase() {
        try {
            // Try to auto-initialize from stored credentials
            const autoInitialized = await this.database.autoInitialize();
            
            if (autoInitialized) {
                console.log('✅ Database auto-initialized from stored credentials');
                return true;
            } else {
                console.log('⚠️ No stored credentials found - manual database setup required');
                this.showToast('Database connection required. Click the database icon to configure.', 'warning');
                return false;
            }
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            this.showToast('Database connection failed. Please check your configuration.', 'error');
            return false;
        }
    }

    // Helper method to wait for global variables to load
    waitForGlobal(globalName, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkGlobal = () => {
                if (typeof window[globalName] !== 'undefined') {
                    console.log(`✅ ${globalName} loaded`);
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error(`${globalName} failed to load within ${timeout}ms`));
                } else {
                    setTimeout(checkGlobal, 100);
                }
            };
            
            checkGlobal();
        });
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Debug connection button
        const debugButton = document.getElementById('debug-connection');
        if (debugButton) {
            debugButton.addEventListener('click', () => {
                this.debugConnection();
            });
        }

        // Mobile menu toggle
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        if (mobileMenuButton) {
            mobileMenuButton.addEventListener('click', () => {
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu) {
                    mobileMenu.classList.toggle('hidden');
                }
            });
        }

        // Navigation links - add safety check
        const navLinks = document.querySelectorAll('.nav-link');
        if (navLinks && navLinks.length > 0) {
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const href = link.getAttribute('href');
                    if (href) {
                        window.location.hash = href;
                    }
                    // Close mobile menu safely
                    const mobileMenu = document.getElementById('mobile-menu');
                    if (mobileMenu) {
                        mobileMenu.classList.add('hidden');
                    }
                });
            });
        }

        // Handle browser back/forward
        window.addEventListener('hashchange', () => {
            this.navigate(window.location.hash);
        });

        // Listen for database status update messages
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'UPDATE_DATABASE_STATUS') {
                console.log('🔄 Received database status update message');
                this.forceUpdateDatabaseStatus();
            }
        });

        // Listen for database change events (auto-sync)
        window.addEventListener('database:dataChanged', (event) => {
            console.log('🔄 Database data changed, refreshing UI...');
            this.handleDatabaseDataChanged(event.detail);
        });

        // Listen for connection status changes
        window.addEventListener('database:connectionChanged', (event) => {
            console.log('📡 Database connection status changed:', event.detail.status);
            this.updateDatabaseStatus();
            if (event.detail.status === 'connected') {
                this.showToast('✅ Connected to sync server', 'success');
                this.refreshCurrentView();
            }
        });

        // Listen for force reload events
        window.addEventListener('database:forceReload', (event) => {
            console.log('🔄 Database requests force reload...');
            this.handleForceReload(event.detail);
        });

        // Check for data updates from other browsers or changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.checkForDataUpdates();
            }
        });

        // Auto-save on page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.saveState();
            }
        });

        // Listen for localStorage changes from other tabs
        window.addEventListener('storage', (e) => {
            this.handleStorageChange(e);
        });

        // Listen for beforeunload to save state
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });

        // Periodic sync check (every 10 seconds for better responsiveness)
        setInterval(() => {
            this.checkForDataUpdates();
        }, 10000);

        // More frequent check when window gains focus
        window.addEventListener('focus', () => {
            setTimeout(() => this.checkForDataUpdates(), 500);
        });

        // Import/Export functionality
        const exportBtn = document.getElementById('export-data-btn');
        const importBtn = document.getElementById('import-data-btn');
        const importInput = document.getElementById('import-file-input');
        const syncBtn = document.getElementById('sync-data-btn');
        const clearBtn = document.getElementById('clear-all-data-btn');
        const resetBtn = document.getElementById('reset-app-btn');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        if (importBtn) {
            importBtn.addEventListener('click', () => {
                if (importInput) importInput.click();
            });
        }

        if (importInput) {
            importInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.importData(file);
                }
            });
        }

        // Sync functionality
        if (syncBtn) {
            syncBtn.addEventListener('click', () => {
                this.forceSyncData();
            });
        }

        // Clear all data functionality
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.confirmClearAllData();
            });
        }

        // Reset app functionality
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                const confirmed = confirm(
                    '🔄 RESET APPLICATION\n\n' +
                    'This will:\n' +
                    '• Clear all localStorage data\n' +
                    '• Reset to completely fresh state\n' +
                    '• Remove any sample data\n\n' +
                    'Continue?'
                );
                
                if (confirmed) {
                    this.resetToFreshState();
                }
            });
        }

        // Mobile data management buttons
        const exportMobileBtn = document.getElementById('export-data-mobile');
        const importMobileBtn = document.getElementById('import-data-mobile');
        
        if (exportMobileBtn) {
            exportMobileBtn.addEventListener('click', () => {
                this.exportData();
                document.getElementById('mobile-menu').classList.add('hidden');
            });
        }

        if (importMobileBtn) {
            importMobileBtn.addEventListener('click', () => {
                document.getElementById('import-file-input').click();
                document.getElementById('mobile-menu').classList.add('hidden');
            });
        }

        // Database configuration button
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.databaseConfig.show();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+S or Cmd+S to force save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveState();
                this.showToast('Data saved manually', 'success');
            }
            
            // Ctrl+Shift+S or Cmd+Shift+S to force sync
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.forceSyncData();
            }
            
            // Ctrl+Shift+D or Cmd+Shift+D to open database config
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                if (window.databaseConfig) {
                    window.databaseConfig.show();
                }
            }
        });
    }

    setupRouting() {
        this.routes = {
            '#/staff': () => this.staffManager.render(),
            '#/summary': () => this.summaryManager.render(),
            '#/logs': () => this.logsManager.render(),
            '': () => this.navigate('#/staff')
        };
    }

    navigate(hash = '') {
        const route = hash.replace('#', '#');
        const handler = this.routes[route] || this.routes[''];
        
        // Update active navigation
        this.updateActiveNav(route);
        
        // Render page
        if (handler) {
            this.currentPage = route;
            handler();
        }
    }

    updateActiveNav(activeRoute) {
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href === activeRoute) {
                link.classList.add('bg-primary-100', 'text-primary-700', 'dark:bg-primary-900', 'dark:text-primary-300');
                link.classList.remove('text-gray-500', 'hover:text-gray-700', 'dark:text-gray-400', 'dark:hover:text-gray-300');
            } else {
                link.classList.remove('bg-primary-100', 'text-primary-700', 'dark:bg-primary-900', 'dark:text-primary-300');
                link.classList.add('text-gray-500', 'hover:text-gray-700', 'dark:text-gray-400', 'dark:hover:text-gray-300');
            }
        });
    }

    toggleTheme() {
        const html = document.documentElement;
        const currentTheme = this.state.settings.theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        this.state.settings.theme = newTheme;
        
        const themeIcon = document.getElementById('theme-icon');
        
        if (newTheme === 'dark') {
            html.classList.add('dark');
            if (themeIcon) themeIcon.textContent = '☀️';
        } else {
            html.classList.remove('dark');
            if (themeIcon) themeIcon.textContent = '🌙';
        }
        
        this.saveState();
    }

    // State Management
    async loadState() {
        try {
            console.log('🔍 loadState: Starting state load...');
            
            // Check if database is configured
            if (this.database.isConfigured) {
                try {
                    console.log('🌐 loadState: Loading from database...');
                    const [staff, logs] = await Promise.all([
                        this.database.loadStaff(),
                        this.database.loadLogs()
                    ]);
                    
                    this.state.staff = staff || [];
                    this.state.logs = logs || {};
                    
                    console.log(`✅ loadState: Data loaded from database - ${this.state.staff.length} staff, ${Object.keys(this.state.logs).length} log months`);
                    return;
                } catch (error) {
                    console.error('❌ loadState: Failed to load from database:', error);
                    this.showToast('Failed to load data from database', 'error');
                }
            } else {
                console.log('⚠️ loadState: Database not configured - using empty state');
                this.state.staff = [];
                this.state.logs = {};
            }
            
            // Load settings from localStorage (these are always local)
            const storedSettings = localStorage.getItem('employeeManagerSettings');
            if (storedSettings) {
                try {
                    this.state.settings = { ...this.state.settings, ...JSON.parse(storedSettings) };
                } catch (error) {
                    console.error('❌ Failed to parse stored settings:', error);
                }
            }
            
            // Initialize empty data if no data exists
            if (!this.state.staff || this.state.staff.length === 0) {
                this.state.staff = [];
                this.state.logs = {};
                console.log('📋 loadState: Starting with empty state');
            }
            
            // Apply theme
            if (this.state.settings.theme === 'dark') {
                document.documentElement.classList.add('dark');
                const themeIcon = document.getElementById('theme-icon');
                if (themeIcon) themeIcon.textContent = '☀️';
            }
        } catch (error) {
            console.error('Failed to load state:', error);
            this.state.staff = [];
            this.state.logs = {};
            this.showToast('Starting with empty data - ready for real data entry', 'info');
        }
    }

    async saveState() {
        try {
            console.log('💾 saveState: Starting state save...');
            console.log('📊 Current state:', {
                staffCount: this.state.staff?.length || 0,
                logMonths: Object.keys(this.state.logs || {}).length,
                databaseConfigured: this.database.isConfigured
            });
            
            // Only save to database if configured
            if (this.database.isConfigured) {
                try {
                    console.log('🌐 Saving to database...');
                    const savePromises = [
                        this.database.saveStaff(this.state.staff),
                        this.database.saveLogs(this.state.logs)
                    ];
                    
                    const results = await Promise.allSettled(savePromises);
                    
                    // Check if any saves failed
                    const failedSaves = results.filter(result => result.status === 'rejected');
                    if (failedSaves.length > 0) {
                        console.error('❌ Some saves failed:', failedSaves);
                        throw new Error(`Failed to save: ${failedSaves.map(f => f.reason.message).join(', ')}`);
                    }
                    
                    console.log('✅ All data saved to database successfully');
                    this.showToast('Data saved successfully', 'success');
                } catch (error) {
                    console.error('❌ Failed to save to database:', error);
                    this.showToast(`Failed to save data: ${error.message}`, 'error');
                    throw error;
                }
            } else {
                console.log('⚠️ Database not configured - data not saved');
                this.showToast('Database not configured. Please connect to database to save data.', 'warning');
            }
            
            // Always save settings to localStorage
            localStorage.setItem('employeeManagerSettings', JSON.stringify(this.state.settings));
            
        } catch (error) {
            console.error('❌ saveState failed:', error);
            this.showToast('Failed to save data', 'error');
            throw error; // Re-throw to allow caller to handle
        }
    }

    // Update staff in the app state
    async updateStaff(staff) {
        if (staff) {
            this.state.staff = staff;
            await this.saveState(); // Save the updated state
        }
    }

    // Update logs in the app state
    async updateLogs(logs) {
        if (logs) {
            this.state.logs = logs;
            await this.saveState(); // Save the updated state
        }
    }

    // Update logs in the app state with enhanced sync
    async updateLogsWithSync(logs, changeInfo = null) {
        if (logs) {
            this.state.logs = logs;
            this.state._lastModified = Date.now();
            
            // Enhanced sync: Save immediately and notify other browsers
            try {
                await this.saveStateWithSync(changeInfo);
            } catch (error) {
                console.error('❌ Failed to sync logs:', error);
                this.showToast('Failed to save activity logs', 'error');
            }
        }
    }

    // Update staff in the app state with enhanced sync
    async updateStaffWithSync(staff, changeInfo = null) {
        if (staff) {
            this.state.staff = staff;
            this.state._lastModified = Date.now();
            
            // Enhanced sync: Save immediately and notify other browsers
            try {
                await this.saveStateWithSync(changeInfo);
            } catch (error) {
                console.error('❌ Failed to sync staff:', error);
                this.showToast('Failed to save staff data', 'error');
            }
        }
    }

    // Enhanced save state with immediate sync
    async saveStateWithSync(changeInfo = null) {
        try {
            // Show subtle sync indicator
            this.showSyncStatus('Syncing...', 'syncing');
            
            // Add timestamp and change info to track modifications
            const stateWithTimestamp = {
                ...this.state,
                _lastModified: Date.now(),
                _syncId: this.generateSyncId(),
                _changeInfo: changeInfo
            };
            
            // Save to database/API first if available
            if (this.database.isConfigured) {
                try {
                    console.log('🔄 Saving to Supabase database...');
                    await Promise.all([
                        this.database.saveStaff(this.state.staff),
                        this.database.saveLogs(this.state.logs)
                        // Note: Settings are saved to localStorage only
                    ]);
                    
                    // Also save settings to localStorage
                    localStorage.setItem('employeeManagerSettings', JSON.stringify(this.state.settings));
                    
                    // Broadcast change to other browsers
                    this.broadcastDataChange(changeInfo);
                    
                    console.log('✅ Data synced to server and broadcasted');
                    this.showSyncStatus('Synced', 'success');
                    
                } catch (error) {
                    console.error('Failed to sync to server:', error);
                    this.showSyncStatus('Sync failed', 'error');
                }
            }
            
            // Always save to localStorage as backup
            localStorage.setItem('employeeManagerState', JSON.stringify(stateWithTimestamp));
            this.lastSyncTimestamp = Date.now();
            
            // Trigger storage event for other tabs
            this.broadcastStateChange();
            
            // Hide sync status after short delay
            setTimeout(() => this.hideSyncStatus(), 1000);
            
        } catch (error) {
            console.error('Failed to save state with sync:', error);
            this.showSyncStatus('Save failed', 'error');
            setTimeout(() => this.hideSyncStatus(), 3000);
        }
    }

    // Broadcast data changes to other browsers via API
    async broadcastDataChange(changeInfo) {
        if (!changeInfo || this.database.useLocalStorage) return;
        
        try {
            // Send a lightweight notification to other browsers
            const response = await fetch(`${this.database.apiUrl}/notify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'data-change',
                    timestamp: Date.now(),
                    changeInfo: changeInfo,
                    sessionId: this.generateSyncId()
                })
            });
            
            if (response.ok) {
                console.log('📡 Change notification sent to other browsers');
            }
        } catch (error) {
            console.log('Warning: Could not notify other browsers:', error.message);
        }
    }

    // Enhanced data update checker
    async checkForDataUpdates() {
        if (this.isLoadingFromSync) return;
        
        try {
            // Check localStorage changes from other tabs
            const stored = localStorage.getItem('employeeManagerState');
            if (stored) {
                const parsedState = JSON.parse(stored);
                const storedTimestamp = parsedState._lastModified || 0;
                const currentTimestamp = this.state._lastModified || 0;
                
                if (storedTimestamp > currentTimestamp) {
                    console.log('🔄 Newer data found in localStorage, updating...');
                    await this.loadState();
                    this.refreshCurrentView();
                    this.showToast('📱 Data updated from another tab', 'info', 2000);
                }
            }
            
            // Check API for updates if in sync mode
            if (!this.database.useLocalStorage && this.database.isConfigured) {
                const [freshStaff, freshLogs] = await Promise.all([
                    this.database.loadStaff(),
                    this.database.loadLogs()
                ]);
                
                // Check if data has changed
                const currentStaffHash = this.generateHashFromData(this.state.staff);
                const currentLogsHash = this.generateHashFromData(this.state.logs);
                const freshStaffHash = this.generateHashFromData(freshStaff || []);
                const freshLogsHash = this.generateHashFromData(freshLogs || {});
                
                if (currentStaffHash !== freshStaffHash || currentLogsHash !== freshLogsHash) {
                    console.log('🔄 Newer data found on server, updating...');
                    this.state.staff = freshStaff || [];
                    this.state.logs = freshLogs || {};
                    this.state._lastModified = Date.now();
                    
                    this.refreshCurrentView();
                    this.showToast('🌐 Data synchronized from other browser', 'sync', 3000);
                }
            }
            
        } catch (error) {
            console.error('Error checking for data updates:', error);
        }
    }

    // Generate hash from data for comparison
    generateHashFromData(data) {
        try {
            const jsonString = JSON.stringify(data);
            let hash = 0;
            for (let i = 0; i < jsonString.length; i++) {
                const char = jsonString.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return hash.toString();
        } catch (error) {
            return Date.now().toString();
        }
    }

    // Update database status indicator in the UI
    updateDatabaseStatus() {
        const statusElement = document.getElementById('database-status');
        if (statusElement) {
            const statusObj = this.database.getConnectionStatus();
            const status = statusObj.status || statusObj; // Handle both object and string returns
            
            switch (status) {
                case 'connected':
                    statusElement.textContent = '🟢 Synced';
                    statusElement.title = 'Connected to sync server - automatic cross-browser sync active';
                    break;
                case 'reconnecting':
                    statusElement.textContent = '� Reconnecting';
                    statusElement.title = 'Reconnecting to sync server...';
                    break;
                case 'error':
                    statusElement.textContent = '🔴 Error';
                    statusElement.title = 'Sync connection error - using local storage';
                    break;
                case 'local':
                default:
                    statusElement.textContent = '� Local';
                    statusElement.title = 'Local storage ready - data saved locally';
                    break;
            }
        }
    }

    // Force both browsers to use sync mode for synchronization
    async forceDatabaseSync() {
        try {
            console.log('🔄 Forcing API synchronization across browsers...');
            
            // Enable sync mode for this browser
            localStorage.setItem('force_sync_mode', 'true');
            localStorage.setItem('force_green_indicator', 'true');
            this.database.useLocalStorage = false;
            
            // Re-initialize database connection
            await this.database.initialize();
            
            // Update the database status immediately
            this.updateDatabaseStatus();
            
            // First, check if we have any local data to save
            const hasLocalStaff = this.state.staff && this.state.staff.length > 0;
            const hasLocalLogs = this.state.logs && Object.keys(this.state.logs).length > 0;
            
            console.log(`📊 Local data: ${this.state.staff?.length || 0} staff, ${Object.keys(this.state.logs || {}).length} log months`);
            
            // Save current local data to API first (if we have any)
            if (hasLocalStaff || hasLocalLogs) {
                console.log('💾 Saving local data to API...');
                await this.saveState();
            }
            
            // Now reload data from API (this will get data from other browsers too)
            console.log('📥 Loading data from API...');
            await this.loadState();
            
            console.log(`📊 After sync: ${this.state.staff?.length || 0} staff, ${Object.keys(this.state.logs || {}).length} log months`);
            
            // Refresh the current page to show updated data
            this.refreshCurrentPage();
            
            this.showToast('🔄 Browser sync enabled - data synchronized!', 'sync');
            console.log('✅ API sync mode enabled and data synchronized');
            
        } catch (error) {
            console.error('❌ Failed to force sync:', error);
            this.showToast('Failed to enable browser sync: ' + error.message, 'error');
        }
    }

    // Update database status (temporarily disabled)
    getDatabaseStatus() {
        return 'local';
    }

    // State getters
    getState() {
        return this.state;
    }

    // Fallback sync methods in case they're called before being properly defined
    showSyncStatus(message, type) {
        console.log(`Sync status: ${message} (${type})`);
        // If element exists, update it
        const syncStatus = document.getElementById('sync-status');
        if (syncStatus) {
            syncStatus.classList.remove('hidden');
            const syncText = document.getElementById('sync-text');
            if (syncText) syncText.textContent = message;
        }
    }

    hideSyncStatus() {
        console.log('Hiding sync status');
        const syncStatus = document.getElementById('sync-status');
        if (syncStatus) {
            syncStatus.classList.add('hidden');
        }
    }

    refreshCurrentPage() {
        console.log('Refreshing current page');
        // Re-render the current page to reflect updated data
        if (this.currentPage && this.routes && this.routes[this.currentPage]) {
            const handler = this.routes[this.currentPage];
            if (handler) {
                try {
                    handler();
                } catch (error) {
                    console.error('Error refreshing page:', error);
                }
            }
        }
    }

    generateSyncId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    broadcastStateChange() {
        // Create a custom event to notify other tabs
        const event = new CustomEvent('appStateChanged', {
            detail: { timestamp: Date.now() }
        });
        window.dispatchEvent(event);
    }

    // Force data synchronization
    async forceSyncData() {
        this.showSyncStatus('Force syncing...', 'syncing');
        
        try {
            // Check for updates from localStorage
            this.checkForDataUpdates();
            
            // Force save current state
            await this.saveState();
            
            // If database is configured, try to reload from database
            if (this.database.isConfigured && !this.database.useLocalStorage) {
                try {
                    const [staff, logs, settings] = await Promise.all([
                        this.database.loadStaff(),
                        this.database.loadLogs(),
                        this.database.loadSettings()
                    ]);
                    
                    // Check if database has newer data
                    const dbTimestamp = Date.now(); // Assume database is current
                    const localTimestamp = this.state._lastModified || 0;
                    
                    if (dbTimestamp > localTimestamp) {
                        this.state.staff = staff;
                        this.state.logs = logs;
                        this.state.settings = { ...this.state.settings, ...settings };
                        this.state._lastModified = dbTimestamp;
                        
                        this.refreshCurrentPage();
                        this.showToast('Data synchronized from database', 'sync');
                    }
                } catch (dbError) {
                    console.error('Database sync failed:', dbError);
                }
            }
            
            this.showSyncStatus('Sync complete', 'success');
            this.showToast('Data synchronization completed', 'success');
            setTimeout(() => this.hideSyncStatus(), 2000);
            
        } catch (error) {
            console.error('Force sync failed:', error);
            this.showSyncStatus('Sync failed', 'error');
            this.showToast('Synchronization failed', 'error');
            setTimeout(() => this.hideSyncStatus(), 3000);
        }
    }

    // Clear all data functionality
    confirmClearAllData() {
        const confirmed = confirm(
            '⚠️ WARNING: This will permanently delete ALL data including:\n\n' +
            '• All staff members\n' +
            '• All activity logs\n' +
            '• All settings\n\n' +
            'This action cannot be undone!\n\n' +
            'Are you sure you want to continue?'
        );
        
        if (confirmed) {
            const doubleConfirmed = confirm(
                '🚨 FINAL CONFIRMATION\n\n' +
                'You are about to delete ALL data permanently.\n' +
                'Type "DELETE" in the next prompt to confirm.'
            );
            
            if (doubleConfirmed) {
                const userInput = prompt('Type "DELETE" to confirm (case sensitive):');
                if (userInput === 'DELETE') {
                    this.clearAllData();
                } else {
                    this.showToast('Data deletion cancelled - incorrect confirmation', 'info');
                }
            } else {
                this.showToast('Data deletion cancelled', 'info');
            }
        } else {
            this.showToast('Data deletion cancelled', 'info');
        }
    }

    async clearAllData() {
        try {
            this.showSyncStatus('Clearing all data...', 'syncing');
            
            // Reset state to empty
            this.state = {
                staff: [],
                logs: {},
                settings: {
                    theme: 'light',
                    dateFormat: 'MM/DD/YYYY',
                    currency: 'USD'
                },
                _lastModified: Date.now()
            };
            
            // Clear localStorage
            localStorage.removeItem('employeeManagerState');
            
            // Clear database if configured
            if (this.database.isConfigured && !this.database.useLocalStorage) {
                try {
                    await Promise.all([
                        this.database.saveStaff([]),
                        this.database.saveLogs({}),
                        this.database.saveSettings(this.state.settings)
                    ]);
                } catch (dbError) {
                    console.error('Failed to clear database:', dbError);
                }
            }
            
            // Refresh current page
            this.refreshCurrentPage();
            
            this.showSyncStatus('Data cleared', 'success');
            this.showToast('All data has been permanently deleted', 'success');
            setTimeout(() => this.hideSyncStatus(), 2000);
            
        } catch (error) {
            console.error('Failed to clear data:', error);
            this.showSyncStatus('Clear failed', 'error');
            this.showToast('Failed to clear data', 'error');
            setTimeout(() => this.hideSyncStatus(), 3000);
        }
    }

    // Sync status indicator methods
    showSyncStatus(message = 'Syncing...', type = 'syncing') {
        const syncStatus = document.getElementById('sync-status');
        const syncIcon = document.getElementById('sync-icon');
        const syncText = document.getElementById('sync-text');
        
        if (syncStatus && syncIcon && syncText) {
            syncText.textContent = message;
            
            if (type === 'syncing') {
                syncIcon.textContent = '🔄';
                syncIcon.classList.add('animate-spin');
                syncStatus.className = 'flex items-center space-x-1 px-2 py-1 rounded-md text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300';
            } else if (type === 'success') {
                syncIcon.textContent = '✅';
                syncIcon.classList.remove('animate-spin');
                syncStatus.className = 'flex items-center space-x-1 px-2 py-1 rounded-md text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
            } else if (type === 'error') {
                syncIcon.textContent = '❌';
                syncIcon.classList.remove('animate-spin');
                syncStatus.className = 'flex items-center space-x-1 px-2 py-1 rounded-md text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
            }
            
            syncStatus.classList.remove('hidden');
        }
    }

    hideSyncStatus() {
        const syncStatus = document.getElementById('sync-status');
        if (syncStatus) {
            syncStatus.classList.add('hidden');
        }
    }

    refreshCurrentPage() {
        // Re-render the current page to reflect updated data
        if (this.currentPage) {
            const route = this.currentPage;
            const handler = this.routes[route];
            if (handler) {
                handler();
            }
        }
    }

    // Method to completely reset and clear everything
    resetToFreshState() {
        try {
            // Clear localStorage completely
            localStorage.clear();
            
            // Reset application state
            this.state = {
                staff: [],
                logs: {},
                settings: {
                    theme: 'light',
                    dateFormat: 'MM/DD/YYYY',
                    currency: 'USD'
                },
                _lastModified: Date.now()
            };
            
            // Apply light theme
            document.documentElement.classList.remove('dark');
            document.getElementById('theme-icon').textContent = '🌙';
            
            // Refresh the page
            this.refreshCurrentPage();
            
            this.showToast('Application reset to fresh state - ready for real data!', 'success');
            console.log('Application reset to fresh state');
            
        } catch (error) {
            console.error('Failed to reset application:', error);
            this.showToast('Failed to reset application', 'error');
        }
    }

    // Toast notification system
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `
            max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto 
            flex ring-1 ring-black ring-opacity-5 transform transition-all duration-300 ease-in-out
            ${type === 'success' ? 'border-l-4 border-green-400' : ''}
            ${type === 'error' ? 'border-l-4 border-red-400' : ''}
            ${type === 'info' ? 'border-l-4 border-blue-400' : ''}
            ${type === 'sync' ? 'border-l-4 border-purple-400' : ''}
        `.trim();
        
        const icon = type === 'success' ? '✅' : 
                    type === 'error' ? '❌' : 
                    type === 'sync' ? '🔄' : 'ℹ️';
        
        toast.innerHTML = `
            <div class="flex-1 w-0 p-4">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <span class="text-lg">${icon}</span>
                    </div>
                    <div class="ml-3 flex-1">
                        <p class="text-sm font-medium text-gray-900 dark:text-white">
                            ${message}
                        </p>
                    </div>
                </div>
            </div>
            <div class="flex border-l border-gray-200 dark:border-gray-600">
                <button onclick="this.parentElement.parentElement.remove()" 
                        class="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none">
                    ×
                </button>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.transform = 'translateX(100%)';
                toast.style.opacity = '0';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    // Force refresh data from API (for other browsers to get updates)
    async forceRefreshFromAPI() {
        try {
            if (!this.database.isUsingDatabase()) {
                console.log('⚠️ Not in sync mode, skipping API refresh');
                return false;
            }
            
            console.log('🔄 Force refreshing data from API...');
            
            // Temporarily enable API mode to force reload
            const wasUsingLocal = this.database.useLocalStorage;
            this.database.useLocalStorage = false;
            
            // Load fresh data from API
            const freshStaff = await this.database.loadStaff();
            const freshLogs = await this.database.loadLogs();
            
            // Restore original mode
            this.database.useLocalStorage = wasUsingLocal;
            
            // Update local state
            this.state.staff = freshStaff || [];
            this.state.logs = freshLogs || {};
            
            console.log(`📊 Refreshed from API: ${this.state.staff.length} staff, ${Object.keys(this.state.logs).length} log months`);
            
            // Refresh current page to show new data
            this.refreshCurrentPage();
            
            return true;
        } catch (error) {
            console.error('❌ Failed to refresh from API:', error);
            return false;
        }
    }

    // Debug connection method to diagnose sync issues
    async debugConnection() {
        console.log('🔧 === DEBUG CONNECTION STATUS ===');
        
        // Basic database info
        console.log('📊 Database Service Info:', {
            useLocalStorage: this.database.useLocalStorage,
            isConfigured: this.database.isConfigured,
            isOffline: this.database.isOffline,
            apiUrl: this.database.apiUrl,
            consecutiveFailures: this.database.consecutiveFailures
        });
        
        // Test connection manually
        console.log('🧪 Testing API connection manually...');
        try {
            const response = await fetch(this.database.apiUrl);
            const data = await response.json();
            console.log('✅ Manual API test successful:', response.status, data);
        } catch (error) {
            console.error('❌ Manual API test failed:', error);
        }
        
        // Get connection status
        const status = this.database.getConnectionStatus();
        console.log('📡 Connection Status:', status);
        
        // Show in UI with options
        const result = confirm(`Database Status Debug:
        
• Use Local Storage: ${this.database.useLocalStorage}
• Is Configured: ${this.database.isConfigured}
• Is Offline: ${this.database.isOffline}
• API URL: ${this.database.apiUrl}
• Status: ${status.status}
• Consecutive Failures: ${this.database.consecutiveFailures}

Click OK to force reconnection, or Cancel to just view status.`);
        
        if (result) {
            console.log('🔄 User requested force reconnection...');
            this.showToast('🔄 Attempting to reconnect...', 'info');
            
            const reconnectSuccess = await this.database.forceReconnect();
            
            if (reconnectSuccess) {
                this.showToast('✅ Successfully connected to database!', 'success');
            } else {
                this.showToast('❌ Reconnection failed. Using local storage.', 'error');
            }
        }
        
        console.log('🔧 === END DEBUG ===');
    }

    // Handle database data changes from auto-sync
    async handleDatabaseDataChanged(detail) {
        console.log('🔄 Handling database data change...', detail);
        
        // Prevent infinite loops by checking if we're already loading from sync
        if (this.isLoadingFromSync) {
            return;
        }
        
        this.isLoadingFromSync = true;
        
        try {
            // Reload data from database
            await this.loadState();
            
            // Refresh the current view
            this.refreshCurrentView();
            
            // Show a subtle notification
            this.showToast('🔄 Data synchronized from other browser', 'info', 3000);
            
        } catch (error) {
            console.error('Failed to handle database data change:', error);
        } finally {
            this.isLoadingFromSync = false;
        }
    }

    // Handle force reload request from database
    async handleForceReload(detail) {
        console.log('🔄 Handling force reload...', detail);
        
        if (this.isLoadingFromSync) {
            return;
        }
        
        this.isLoadingFromSync = true;
        
        try {
            // Force reload data from database
            await this.loadState();
            
            // Refresh the current view
            this.refreshCurrentView();
            
            console.log('✅ Force reload completed');
            
        } catch (error) {
            console.error('Failed to handle force reload:', error);
        } finally {
            this.isLoadingFromSync = false;
        }
    }
}

// Export the App class as default
export default App;
