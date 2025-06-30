// Performance Summary Component
import { Utils } from './utils.js';

export class SummaryManager {
    constructor(app) {
        this.app = app;
        this.currentPeriod = 'monthly';
        this.selectedStaff = [];
        this.selectedActivities = [];
        this.chartInstance = null;
        
        // Make functions globally available immediately
        window.summaryManager = this;
        window.showStaffDetails = (staffId) => this.showStaffDetails(staffId);
        window.closeStaffModal = () => this.closeStaffModal();
    }

    render() {
        const content = document.getElementById('main-content');
        content.innerHTML = this.getTemplate();
        this.setupEventListeners();
        this.loadFilters();
        this.renderSummary();
        
        // Make summaryManager globally accessible for modal functions
        window.summaryManager = this;
    }

    getTemplate() {
        return `
            <div class="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
                <!-- Header -->
                <div class="mb-6 sm:mb-8">
                    <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        📈 Performance Summary
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                        Analyze staff performance, view trends, and generate insights.
                    </p>
                </div>

                <!-- Filters -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <!-- Period Toggle -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">View Period</label>
                            <div class="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                                <button class="period-btn flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors touch-target" data-period="daily">
                                    <span class="sm:hidden">Day</span>
                                    <span class="hidden sm:inline">Daily</span>
                                </button>
                                <button class="period-btn flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors touch-target" data-period="weekly">
                                    <span class="sm:hidden">Week</span>
                                    <span class="hidden sm:inline">Weekly</span>
                                </button>
                                <button class="period-btn flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors touch-target" data-period="monthly">
                                    <span class="sm:hidden">Month</span>
                                    <span class="hidden sm:inline">Monthly</span>
                                </button>
                                <button class="period-btn flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors touch-target" data-period="yearly">
                                    <span class="sm:hidden">Year</span>
                                    <span class="hidden sm:inline">Yearly</span>
                                </button>
                            </div>
                        </div>

                        <!-- Date Range -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
                            <select id="date-range" class="w-full px-3 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 text-sm sm:text-base touch-target">
                                <option value="current">Current Period</option>
                                <option value="previous">Previous Period</option>
                                <option value="last3">Last 3 Periods</option>
                                <option value="last6">Last 6 Periods</option>
                            </select>
                        </div>

                        <!-- Staff Filter -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Staff Filter</label>
                            <select id="staff-filter" class="w-full px-3 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 text-sm sm:text-base touch-target">
                                <option value="">All Staff</option>
                                <!-- Staff options will be populated dynamically -->
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Staff Performance Table -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div class="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Staff Performance Breakdown</h3>
                    </div>
                    <!-- Desktop Table View -->
                    <div class="hidden lg:block overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-700 z-10">Staff Member</th>
                                    <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Adding Client</th>
                                    <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Today's Trust Love</th>
                                    <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Trust Love</th>
                                    <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Today's Hot Chat</th>
                                    <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Hot Chat</th>
                                    <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Test Side Cut</th>
                                    <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Today's Side Cut</th>
                                    <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">New Freetask</th>
                                    <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Freetask</th>
                                    <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Today's Promote Top Up</th>
                                    <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Promote Success</th>
                                    <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Today New Interesting</th>
                                    <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Interesting Top Up</th>
                                    <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Today's Register</th>
                                    <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Register Get Reward</th>
                                    <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sending Voice</th>
                                    <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Voice Calling</th>
                                    <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Video Calling</th>
                                    <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">First Recharge</th>
                                    <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Top Up</th>
                                    <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Withdraw</th>
                                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                                </tr>
                            </thead>
                            <tbody id="staff-performance-table" class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                <!-- Staff performance rows will be populated -->
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Mobile Card View -->
                    <div class="lg:hidden" id="staff-performance-mobile">
                        <!-- Mobile performance cards will be populated here -->
                    </div>
                </div>
                
                <!-- Staff Activity Details Modal -->
                <div id="staff-details-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden p-2 sm:p-4">
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] overflow-hidden mobile-modal">
                        <!-- Header -->
                        <div class="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                        📊 Staff Activity Details
                                    </h3>
                                    <div class="flex flex-col sm:flex-row sm:items-center mt-1 space-y-1 sm:space-y-0 sm:space-x-4">
                                        <span id="modal-staff-info" class="text-sm text-gray-600 dark:text-gray-400"></span>
                                        <span id="modal-date-info" class="text-sm font-medium text-primary-600 dark:text-primary-400"></span>
                                    </div>
                                </div>
                                <button onclick="window.closeStaffModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-target">
                                    <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Content -->
                        <div class="p-4 sm:p-6 overflow-y-auto">
                            <!-- Summary Cards -->
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                                    <div class="flex items-center">
                                        <div class="p-1 rounded bg-blue-100 dark:bg-blue-900">
                                            <span class="text-lg">📈</span>
                                        </div>
                                        <div class="ml-2">
                                            <p class="text-xs font-medium text-blue-600 dark:text-blue-400">Total Today</p>
                                            <p id="modal-total-today" class="text-lg sm:text-xl font-bold text-blue-900 dark:text-blue-100">0</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                                    <div class="flex items-center">
                                        <div class="p-1 rounded bg-green-100 dark:bg-green-900">
                                            <span class="text-lg">🎯</span>
                                        </div>
                                        <div class="ml-2">
                                            <p class="text-xs font-medium text-green-600 dark:text-green-400">Activities Done</p>
                                            <p id="modal-activities-count" class="text-lg sm:text-xl font-bold text-green-900 dark:text-green-100">0</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                                    <div class="flex items-center">
                                        <div class="p-1 rounded bg-purple-100 dark:bg-purple-900">
                                            <span class="text-lg">⭐</span>
                                        </div>
                                        <div class="ml-2">
                                            <p class="text-xs font-medium text-purple-600 dark:text-purple-400">Top Activity</p>
                                            <p id="modal-top-activity" class="text-xs sm:text-sm font-bold text-purple-900 dark:text-purple-100 break-words">-</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Activities Details Grid -->
                            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white">📝 Today's Activity Breakdown</h4>
                                </div>
                                <div class="p-4">
                                    <div id="modal-activities-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                                        <!-- Activity cards will be populated -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Period toggle buttons
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentPeriod = btn.dataset.period;
                this.updatePeriodButtons();
                this.renderSummary();
            });
        });

        // Filter changes
        document.getElementById('date-range').addEventListener('change', () => {
            this.renderSummary();
        });

        document.getElementById('staff-filter').addEventListener('change', () => {
            this.renderSummary();
        });

        // Initialize period buttons
        this.updatePeriodButtons();
    }

    updatePeriodButtons() {
        document.querySelectorAll('.period-btn').forEach(btn => {
            if (btn.dataset.period === this.currentPeriod) {
                btn.classList.add('bg-primary-600', 'text-white');
                btn.classList.remove('bg-white', 'text-gray-700', 'dark:bg-gray-700', 'dark:text-gray-300');
            } else {
                btn.classList.remove('bg-primary-600', 'text-white');
                btn.classList.add('bg-white', 'text-gray-700', 'dark:bg-gray-700', 'dark:text-gray-300');
            }
        });
    }

    loadFilters() {
        const state = this.app.getState();
        
        // Populate staff filter
        const staffFilter = document.getElementById('staff-filter');
        staffFilter.innerHTML = '<option value="">All Staff</option>';
        
        // Sort staff by ID first
        const sortedStaff = [...state.staff].sort((a, b) => {
            // Handle numeric IDs
            const aId = a.id;
            const bId = b.id;
            
            // Try to convert to numbers if they're numeric
            const aNum = parseInt(aId);
            const bNum = parseInt(bId);
            
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum; // Numeric sort
            } else {
                return aId.localeCompare(bId); // Alphabetic sort
            }
        });
        
        sortedStaff.forEach(staff => {
            const option = document.createElement('option');
            option.value = staff.id;
            option.textContent = `ID: ${staff.id} - ${staff.name}`;
            staffFilter.appendChild(option);
        });

        // Get all unique activities from logs and initialize selectedActivities
        const allActivities = new Set();
        Object.values(state.logs).forEach(monthData => {
            if (monthData.activities) {
                monthData.activities.forEach(activity => allActivities.add(activity));
            }
        });

        // Initialize all activities as selected (no UI filter needed)
        this.selectedActivities = Array.from(allActivities);
    }

    renderSummary() {
        const data = this.prepareTableData();
        this.renderStaffPerformanceTable(data);
    }

    prepareTableData() {
        const state = this.app.getState();
        const selectedStaffId = document.getElementById('staff-filter')?.value;
        
        // Get staff to show
        const staffToShow = selectedStaffId 
            ? state.staff.filter(s => s.id === selectedStaffId)
            : state.staff || [];

        // Define the activities that match the table headers
        const allActivities = [
            'Adding Client', 'Today\'s Trust Love', 'Total Trust Love',
            'Today\'s Hot Chat', 'Total Hot Chat', 'Test Side Cut',
            'Today\'s Side Cut', 'New Freetask', 'Total Freetask',
            'Today\'s Promote Top Up', 'Promote Success', 'Today New Interesting',
            'Total Interesting Top Up', 'Today\'s Register', 'Today\'s Register',
            'Sending Voice', 'Voice Calling', 'Video Calling',
            'First Recharge', 'Top Up', 'Withdraw'
        ];
        
        return {
            staffToShow,
            activities: allActivities,
            allActivities
        };
    }

    getFilteredData() {
        const state = this.app.getState();
        const selectedStaffId = document.getElementById('staff-filter').value;
        const dateRange = document.getElementById('date-range').value;

        // Get relevant log entries based on period and date range
        const relevantLogs = this.getRelevantLogs(dateRange);
        
        // Filter by selected staff if specified
        const staffToAnalyze = selectedStaffId 
            ? state.staff.filter(s => s.id === selectedStaffId)
            : state.staff;

        // Calculate aggregated data
        const aggregatedData = {
            totalActivities: 0,
            activityTotals: {},
            staffPerformance: {},
            totalStaff: staffToAnalyze.length
        };

        // Initialize activity totals
        this.selectedActivities.forEach(activity => {
            aggregatedData.activityTotals[activity] = 0;
        });

        // Process each staff member
        staffToAnalyze.forEach(staff => {
            aggregatedData.staffPerformance[staff.id] = {
                name: staff.name,
                department: staff.department,
                totalActivities: 0,
                activityBreakdown: {},
                topActivity: '',
                topActivityCount: 0
            };

            // Initialize activity breakdown
            this.selectedActivities.forEach(activity => {
                aggregatedData.staffPerformance[staff.id].activityBreakdown[activity] = 0;
            });

            // Sum activities from relevant logs
            relevantLogs.forEach(logKey => {
                const logData = state.logs[logKey];
                if (logData && logData.data[staff.id]) {
                    Object.entries(logData.data[staff.id]).forEach(([day, activities]) => {
                        this.selectedActivities.forEach(activity => {
                            const count = activities[activity] || 0;
                            aggregatedData.activityTotals[activity] += count;
                            aggregatedData.staffPerformance[staff.id].activityBreakdown[activity] += count;
                            aggregatedData.staffPerformance[staff.id].totalActivities += count;
                            aggregatedData.totalActivities += count;

                            // Track top activity for this staff member
                            if (count > aggregatedData.staffPerformance[staff.id].topActivityCount) {
                                aggregatedData.staffPerformance[staff.id].topActivity = activity;
                                aggregatedData.staffPerformance[staff.id].topActivityCount = aggregatedData.staffPerformance[staff.id].activityBreakdown[activity];
                            }
                        });
                    });
                }
            });
        });

        return aggregatedData;
    }

    getRelevantLogs(dateRange) {
        const state = this.app.getState();
        const currentDate = new Date();
        const logKeys = Object.keys(state.logs);
        
        // For simplicity, we'll work with monthly logs
        // In a real app, you'd want more sophisticated date filtering
        switch (dateRange) {
            case 'current':
                return logKeys.slice(-1);
            case 'previous':
                return logKeys.slice(-2, -1);
            case 'last3':
                return logKeys.slice(-3);
            case 'last6':
                return logKeys.slice(-6);
            default:
                return logKeys.slice(-1);
        }
    }

    renderChart(data = null) {
        if (!data) data = this.getFilteredData();
        
        const ctx = document.getElementById('performance-chart');
        const chartType = document.getElementById('chart-type').value;

        // Destroy existing chart
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        const labels = this.selectedActivities;
        const values = labels.map(activity => data.activityTotals[activity] || 0);
        const colors = Utils.generateColors(labels.length);

        const config = {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: 'Activity Count',
                    data: values,
                    backgroundColor: colors,
                    borderColor: colors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: chartType === 'pie' || chartType === 'doughnut' ? 'right' : 'top',
                    }
                },
                scales: chartType === 'pie' || chartType === 'doughnut' ? {} : {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        };

        this.chartInstance = new Chart(ctx, config);
    }

    renderActivitiesTable(data) {
        const tbody = document.getElementById('activities-table');
        const activities = this.selectedActivities.map(activity => ({
            name: activity,
            total: data.activityTotals[activity] || 0,
            avg: data.totalStaff > 0 ? (data.activityTotals[activity] || 0) / data.totalStaff : 0
        }));

        // Sort by total descending
        activities.sort((a, b) => b.total - a.total);

        tbody.innerHTML = activities.map(activity => `
            <tr class="border-b border-gray-200 dark:border-gray-700">
                <td class="py-2 text-sm text-gray-900 dark:text-gray-100">${activity.name}</td>
                <td class="py-2 text-sm text-gray-900 dark:text-gray-100 text-right font-medium">${Utils.formatNumber(activity.total)}</td>
                <td class="py-2 text-sm text-gray-500 dark:text-gray-400 text-right">${Utils.formatNumber(activity.avg, 1)}</td>
            </tr>
        `).join('');
    }

    renderStaffPerformanceTable(data) {
        const table = document.getElementById('staff-performance-table');
        const mobileView = document.getElementById('staff-performance-mobile');
        const { staffToShow, activities, allActivities } = data;

        // Calculate totals for each activity
        const activityTotals = {};
        allActivities.forEach(activity => {
            activityTotals[activity] = 0;
        });

        let grandTotal = 0;

        // Calculate staff data for current period
        // For now, use sample data until the actual data structure is working
        const sampleData = { data: {} };
        
        // Generate table rows and mobile cards
        const tableRows = staffToShow.map(staff => {
            let periodTotal = 0;

            const activityCells = activities.map(activity => {
                // Use sample data for now
                const total = Math.floor(Math.random() * 10);
                activityTotals[activity] += total;
                periodTotal += total;
                grandTotal += total;

                return `
                    <td class="px-2 py-3 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-100">
                        ${total}
                    </td>
                `;
            }).join('');
            
            return `
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td class="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 sticky left-0 bg-white dark:bg-gray-800">
                        <button onclick="window.showStaffDetails('${staff.id}')" 
                                class="text-left hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer underline-offset-2 hover:underline">
                            ID: ${staff.id} - ${staff.name}
                        </button>
                    </td>
                    ${activityCells}
                    <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right font-medium">
                        ${periodTotal}
                    </td>
                </tr>
            `;
        }).join('');

        // Render desktop table
        table.innerHTML = tableRows;

        // Generate mobile cards
        const mobileCards = staffToShow.map(staff => {
            let periodTotal = 0;
            
            // Calculate top activities
            const staffActivities = activities.map(activity => ({
                name: activity,
                value: Math.floor(Math.random() * 10)
            })).filter(a => a.value > 0).sort((a, b) => b.value - a.value);

            staffActivities.forEach(a => periodTotal += a.value);

            return `
                <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4 shadow-sm">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h3 class="font-semibold text-gray-900 dark:text-white">${staff.name}</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400">ID: ${staff.id}</p>
                        </div>
                        <div class="text-right">
                            <div class="text-lg font-bold text-gray-900 dark:text-white">${periodTotal}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">Total Points</div>
                        </div>
                    </div>
                    
                    ${staffActivities.length > 0 ? `
                        <div class="space-y-2 mb-3">
                            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Top Activities:</h4>
                            ${staffActivities.slice(0, 3).map(activity => `
                                <div class="flex justify-between items-center">
                                    <span class="text-sm text-gray-600 dark:text-gray-400 truncate mr-2">${activity.name}</span>
                                    <span class="text-sm font-medium text-gray-900 dark:text-white">${activity.value}</span>
                                </div>
                            `).join('')}
                            ${staffActivities.length > 3 ? `
                                <div class="text-xs text-gray-500 dark:text-gray-400">
                                    +${staffActivities.length - 3} more activities
                                </div>
                            ` : ''}
                        </div>
                    ` : `
                        <div class="text-sm text-gray-500 dark:text-gray-400 mb-3">No activities recorded for this period</div>
                    `}
                    
                    <div class="flex justify-end">
                        <button onclick="window.showStaffDetails('${staff.id}')" 
                                class="bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-target">
                            View Details
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Render mobile view
        mobileView.innerHTML = mobileCards;

        // Add totals row to desktop table
        const totalActivityCells = activities.map(activity => {
            const total = activityTotals[activity];
            return `
                <td class="px-2 py-3 whitespace-nowrap text-center text-sm font-bold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700">
                    ${total}
                </td>
            `;
        }).join('');
        
        table.innerHTML += `
            <tr class="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                <td class="px-3 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100 sticky left-0 bg-gray-100 dark:bg-gray-700">
                    TOTAL
                </td>
                ${totalActivityCells}
                <td class="px-3 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100 text-right bg-gray-100 dark:bg-gray-700">
                    ${grandTotal}
                </td>
            </tr>
        `;
    }

    calculateStaffActivityTotal(staffData, activity) {
        // Calculate total for an activity based on current period
        let total = 0;
        
        // This is a simplified version - you may need to adjust based on the period logic
        Object.keys(staffData).forEach(day => {
            if (staffData[day] && staffData[day][activity]) {
                total += staffData[day][activity];
            }
        });
        
        return total;
    }
}
