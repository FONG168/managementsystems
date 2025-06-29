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
        try {
            await this.database.initialize();
            
            // Load data (try database first, fallback to localStorage)
            await this.loadState();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize routing
            this.setupRouting();
            
            // Update database status
            this.updateDatabaseStatus();
            
            // Load initial page
            this.navigate(window.location.hash || '#/staff');
            
            // Hide loading screen
            setTimeout(() => {
                document.getElementById('loading').style.display = 'none';
            }, 1000);
            
        } catch (error) {
            console.error('App initialization failed:', error);
            this.showToast('Failed to initialize app', 'error');
        }
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Mobile menu toggle
        document.getElementById('mobile-menu-button').addEventListener('click', () => {
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenu.classList.toggle('hidden');
        });

        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href) {
                    window.location.hash = href;
                }
                // Close mobile menu
                document.getElementById('mobile-menu').classList.add('hidden');
            });
        });

        // Handle browser back/forward
        window.addEventListener('hashchange', () => {
            this.navigate(window.location.hash);
        });

        // Auto-save on page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.saveState();
            }
        });

        // Auto-save on beforeunload
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });

        // Data management buttons
        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('import-data-btn').addEventListener('click', () => {
            document.getElementById('import-file-input').click();
        });

        document.getElementById('import-file-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importData(file).then(() => {
                    // Clear the file input so the same file can be selected again
                    e.target.value = '';
                }).catch(() => {
                    e.target.value = '';
                });
            }
        });

        // Mobile data management buttons
        document.getElementById('export-data-mobile').addEventListener('click', () => {
            this.exportData();
            document.getElementById('mobile-menu').classList.add('hidden');
        });

        document.getElementById('import-data-mobile').addEventListener('click', () => {
            document.getElementById('import-file-input').click();
            document.getElementById('mobile-menu').classList.add('hidden');
        });

        // Database configuration button
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.databaseConfig.show();
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

    navigate(hash) {
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
        
        if (newTheme === 'dark') {
            html.classList.add('dark');
            document.getElementById('theme-icon').textContent = '☀️';
        } else {
            html.classList.remove('dark');
            document.getElementById('theme-icon').textContent = '🌙';
        }
        
        this.saveState();
    }

    // State Management
    async loadState() {
        try {
            // Try to load from database first
            if (this.database.isConfigured && !this.database.useLocalStorage) {
                const [staffData, logsData, settingsData] = await Promise.all([
                    this.database.loadStaff(),
                    this.database.loadLogs(),
                    this.database.loadSettings()
                ]);

                if (staffData) this.state.staff = staffData;
                if (logsData) this.state.logs = logsData;
                if (settingsData) this.state.settings = { ...this.state.settings, ...settingsData };

                console.log('Data loaded from database');
            } else {
                // Fallback to localStorage
                const savedState = localStorage.getItem('employeeManagerState');
                if (savedState) {
                    const parsed = JSON.parse(savedState);
                    this.state = { ...this.state, ...parsed };
                }
                console.log('Data loaded from localStorage');
            }

            // Apply theme
            if (this.state.settings.theme === 'dark') {
                document.documentElement.classList.add('dark');
                document.getElementById('theme-icon').textContent = '☀️';
            }

            // Load sample data if no staff exists
            if (this.state.staff.length === 0) {
                this.loadSampleData();
            }

        } catch (error) {
            console.error('Failed to load state:', error);
            // Fallback to localStorage on error
            try {
                const savedState = localStorage.getItem('employeeManagerState');
                if (savedState) {
                    const parsed = JSON.parse(savedState);
                    this.state = { ...this.state, ...parsed };
                }
            } catch (localError) {
                console.error('Failed to load from localStorage:', localError);
                this.loadSampleData();
            }
        }
    }

    async saveState() {
        try {
            // Save to database if configured
            if (this.database.isConfigured && !this.database.useLocalStorage) {
                await Promise.all([
                    this.database.saveStaff(this.state.staff),
                    this.database.saveLogs(this.state.logs),
                    this.database.saveSettings(this.state.settings)
                ]);
                console.log('Data saved to database');
            }
            
            // Always save to localStorage as backup
            localStorage.setItem('employeeManagerState', JSON.stringify(this.state));
            console.log('Data saved to localStorage');
        } catch (error) {
            console.error('Failed to save state:', error);
            // Ensure localStorage backup works
            try {
                localStorage.setItem('employeeManagerState', JSON.stringify(this.state));
            } catch (localError) {
                console.error('Failed to save to localStorage:', localError);
                this.showToast('Failed to save data', 'error');
            }
        }
    }

    loadSampleData() {
        this.state.staff = [
            {
                id: '001',
                name: 'XIAO FONG',
                department: 'Customer Service',
                position: 'Senior Agent',
                email: 'xiao.fong@company.com',
                phone: '+1-555-0101',
                startDate: '2023-01-15',
                salary: 45000,
                active: true
            },
            {
                id: '002',
                name: 'KE AI',
                department: 'Sales',
                position: 'Sales Representative',
                email: 'ke.ai@company.com',
                phone: '+1-555-0102',
                startDate: '2023-03-20',
                salary: 50000,
                active: true
            },
            {
                id: '003',
                name: 'XIAO LEE',
                department: 'Customer Service',
                position: 'Chat Support Agent',
                email: 'xiao.lee@company.com',
                phone: '+1-555-0103',
                startDate: '2023-02-10',
                salary: 42000,
                active: true
            },
            {
                id: '004',
                name: 'NA NA',
                department: 'Operations',
                position: 'Team Lead',
                email: 'na.na@company.com',
                phone: '+1-555-0104',
                startDate: '2023-04-05',
                salary: 60000,
                active: true
            },
            {
                id: '005',
                name: 'AH XING',
                department: 'Sales',
                position: 'Account Manager',
                email: 'ah.xing@company.com',
                phone: '+1-555-0105',
                startDate: '2023-05-15',
                salary: 55000,
                active: true
            },
            {
                id: '006',
                name: 'XIAO NING',
                department: 'Customer Service',
                position: 'Support Agent',
                email: 'xiao.ning@company.com',
                phone: '+1-555-0106',
                startDate: '2023-06-01',
                salary: 40000,
                active: true
            },
            {
                id: '007',
                name: 'MEI GUI',
                department: 'Sales',
                position: 'Sales Agent',
                email: 'mei.gui@company.com',
                phone: '+1-555-0107',
                startDate: '2023-06-15',
                salary: 48000,
                active: true
            }
        ];

        // Sample activity logs for current month
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

        this.state.logs[monthKey] = {
            activities: [
                'Adding Client',
                "Today's Trust Love",
                'Total Trust Love',
                "Today's Hot Chat",
                'Total Hot Chat',
                'Test Side Cut',
                "Today's Side Cut",
                'New Freetask',
                'Total Freetask',
                "Today's Promote Top Up",
                'Promote Success',
                'Today New Interesting',
                'Total Interesting Top Up',
                "Today's Register",
                'Total Register Get Reward',
                'Sending Voice',
                'Voice Calling',
                'Video Calling',
                'First Recharge',
                'Top Up',
                'Withdraw'
            ],
            data: {}
        };

        // Generate sample log data
        this.state.staff.forEach(staff => {
            this.state.logs[monthKey].data[staff.id] = {};
            // Generate data for all days up to today
            const today = new Date().getDate();
            const maxDay = Math.min(today, 30); // Don't exceed 30 days or today
            
            for (let day = 1; day <= maxDay; day++) {
                const dayKey = String(day).padStart(2, '0');
                
                // Create varying activity levels throughout the month
                // Earlier in month: lower activity, Recent week: higher activity
                const isRecentWeek = day > (today - 7);
                const multiplier = isRecentWeek ? 2.0 : 1.2; // Recent week has more activity
                
                this.state.logs[monthKey].data[staff.id][dayKey] = {
                    'Adding Client': Math.floor(Math.random() * 8 * multiplier) + 1,
                    "Today's Trust Love": Math.floor(Math.random() * 15 * multiplier) + 2,
                    'Total Trust Love': Math.floor(Math.random() * 80 * multiplier) + 10,
                    "Today's Hot Chat": Math.floor(Math.random() * 20 * multiplier) + 3,
                    'Total Hot Chat': Math.floor(Math.random() * 150 * multiplier) + 20,
                    'Test Side Cut': Math.floor(Math.random() * 5 * multiplier) + 1,
                    "Today's Side Cut": Math.floor(Math.random() * 12 * multiplier) + 2,
                    'New Freetask': Math.floor(Math.random() * 10 * multiplier) + 1,
                    'Total Freetask': Math.floor(Math.random() * 50 * multiplier) + 5,
                    "Today's Promote Top Up": Math.floor(Math.random() * 6 * multiplier) + 1,
                    'Promote Success': Math.floor(Math.random() * 5 * multiplier) + 1,
                    'Today New Interesting': Math.floor(Math.random() * 10 * multiplier) + 1,
                    'Total Interesting Top Up': Math.floor(Math.random() * 40 * multiplier) + 5,
                    "Today's Register": Math.floor(Math.random() * 18 * multiplier) + 2,
                    'Total Register Get Reward': Math.floor(Math.random() * 90 * multiplier) + 10,
                    'Sending Voice': Math.floor(Math.random() * 25 * multiplier) + 3,
                    'Voice Calling': Math.floor(Math.random() * 20 * multiplier) + 2,
                    'Video Calling': Math.floor(Math.random() * 15 * multiplier) + 1,
                    'First Recharge': Math.floor(Math.random() * 8 * multiplier) + 1,
                    'Top Up': Math.floor(Math.random() * 12 * multiplier) + 2,
                    'Withdraw': Math.floor(Math.random() * 6 * multiplier) + 1
                };
            }
        });

        this.saveState();
        this.showToast('Sample data loaded successfully', 'success');
    }

    // Database status (temporarily disabled)
    getDatabaseStatus() {
        return 'local';
    }

    // Update methods to trigger saves
    updateStaff(staff) {
        this.state.staff = staff;
        this.saveState();
    }

    updateLogs(logs) {
        this.state.logs = logs;
        this.saveState();
    }

    updateDatabaseStatus() {
        const statusElement = document.getElementById('database-status');
        const configButton = document.getElementById('database-config-btn');
        
        if (statusElement) {
            if (this.database.isConfigured && !this.database.useLocalStorage) {
                statusElement.innerHTML = '<span class="text-green-600 dark:text-green-400">🟢 Database Connected</span>';
            } else {
                statusElement.innerHTML = '<span class="text-yellow-600 dark:text-yellow-400">🟡 Using Local Storage</span>';
            }
        }
        
        if (configButton) {
            configButton.style.display = 'block';
        }
    }

    // Data Export/Import Methods
    exportData() {
        try {
            const dataToExport = {
                staff: this.state.staff,
                logs: this.state.logs,
                settings: this.state.settings,
                exportDate: new Date().toISOString(),
                version: '1.0.0'
            };

            const dataStr = JSON.stringify(dataToExport, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `employee-manager-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showToast('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showToast('Failed to export data', 'error');
        }
    }

    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // Validate imported data structure
                    if (!importedData.staff || !importedData.logs || !importedData.settings) {
                        throw new Error('Invalid data format');
                    }
                    
                    // Backup current data before importing
                    const backup = { ...this.state };
                    
                    // Import the data
                    this.state = {
                        staff: importedData.staff,
                        logs: importedData.logs,
                        settings: { ...this.state.settings, ...importedData.settings }
                    };
                    
                    this.saveState();
                    this.showToast(`Data imported successfully! (${importedData.staff.length} staff members)`, 'success');
                    
                    // Refresh current page
                    if (this.currentPage) {
                        this.navigate(this.currentPage);
                    }
                    
                    resolve(importedData);
                } catch (error) {
                    console.error('Import failed:', error);
                    this.showToast('Failed to import data - invalid file format', 'error');
                    reject(error);
                }
            };
            reader.onerror = () => {
                this.showToast('Failed to read file', 'error');
                reject(new Error('File reading failed'));
            };
            reader.readAsText(file);
        });
    }

    // Utility Methods
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        const bgColor = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        }[type] || 'bg-blue-500';

        toast.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
        toast.textContent = message;

        const container = document.getElementById('toast-container');
        container.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);

        // Animate out and remove
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    // Data sync with backend (future enhancement)
    async syncData() {
        try {
            const response = await fetch('/api/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.state)
            });

            if (response.ok) {
                this.showToast('Data synced successfully', 'success');
            } else {
                throw new Error('Sync failed');
            }
        } catch (error) {
            console.error('Sync error:', error);
            this.showToast('Sync failed - data saved locally', 'warning');
        }
    }

    // Public methods for components
    getState() {
        return this.state;
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.saveState();
    }

    updateStaff(staff) {
        this.state.staff = staff;
        this.saveState();
    }

    updateLogs(logs) {
        this.state.logs = logs;
        this.saveState();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

export { App };
