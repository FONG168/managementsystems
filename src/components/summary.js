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
            <div class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <!-- Header -->
                <div class="mb-8">
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        📈 Performance Summary
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400">
                        Analyze staff performance, view trends, and generate insights.
                    </p>
                </div>

                <!-- Filters -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <!-- Period Toggle -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">View Period</label>
                            <div class="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                                <button class="period-btn flex-1 px-3 py-2 text-xs font-medium transition-colors" data-period="daily">Daily</button>
                                <button class="period-btn flex-1 px-3 py-2 text-xs font-medium transition-colors" data-period="weekly">Weekly</button>
                                <button class="period-btn flex-1 px-3 py-2 text-xs font-medium transition-colors" data-period="monthly">Monthly</button>
                                <button class="period-btn flex-1 px-3 py-2 text-xs font-medium transition-colors" data-period="yearly">Yearly</button>
                            </div>
                        </div>

                        <!-- Date Range -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
                            <select id="date-range" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500">
                                <option value="current">Current Period</option>
                                <option value="previous">Previous Period</option>
                                <option value="last3">Last 3 Periods</option>
                                <option value="last6">Last 6 Periods</option>
                            </select>
                        </div>

                        <!-- Staff Filter -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Staff Filter</label>
                            <select id="staff-filter" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500">
                                <option value="">All Staff</option>
                                <!-- Staff options will be populated dynamically -->
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Staff Performance Table -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Staff Performance Breakdown</h3>
                    </div>
                    <div class="overflow-x-auto">
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
                </div>
                
                <!-- Staff Activity Details Modal -->
                <div id="staff-details-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden p-4">
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-screen overflow-hidden">
                        <!-- Header -->
                        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                        📊 Staff Activity Details
                                    </h3>
                                    <div class="flex items-center mt-1 space-x-4">
                                        <span id="modal-staff-info" class="text-sm text-gray-600 dark:text-gray-400"></span>
                                        <span id="modal-date-info" class="text-sm font-medium text-primary-600 dark:text-primary-400"></span>
                                    </div>
                                </div>
                                <button onclick="window.closeStaffModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Content -->
                        <div class="p-6">
                            <!-- Summary Cards -->
                            <div class="grid grid-cols-3 gap-4 mb-4">
                                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                                    <div class="flex items-center">
                                        <div class="p-1 rounded bg-blue-100 dark:bg-blue-900">
                                            <span class="text-lg">📈</span>
                                        </div>
                                        <div class="ml-2">
                                            <p class="text-xs font-medium text-blue-600 dark:text-blue-400">Total Today</p>
                                            <p id="modal-total-today" class="text-xl font-bold text-blue-900 dark:text-blue-100">0</p>
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
                                            <p id="modal-activities-count" class="text-xl font-bold text-green-900 dark:text-green-100">0</p>
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
                                            <p id="modal-top-activity" class="text-sm font-bold text-purple-900 dark:text-purple-100">-</p>
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
                                    <div id="modal-activities-grid" class="grid grid-cols-5 gap-3">
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
        const data = this.getFilteredData();
        this.renderStaffPerformanceTable(data);
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
        const tbody = document.getElementById('staff-performance-table');
        const state = this.app.getState();
        
        // Get current month's activities and data
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        
        const monthData = state.logs[monthKey];
        if (!monthData) {
            tbody.innerHTML = '<tr><td colspan="23" class="text-center py-8 text-gray-500">No data available for current month</td></tr>';
            return;
        }

        const activities = monthData.activities || [];
        
        // Use filtered staff from the data parameter instead of all staff
        const selectedStaffId = document.getElementById('staff-filter').value;
        const staffToShow = selectedStaffId 
            ? state.staff.filter(s => s.id === selectedStaffId)
            : state.staff;
        
        // Calculate weekly and monthly totals for filtered staff members
        const staffStats = [];
        
        staffToShow.forEach(staff => {
            const staffData = monthData.data[staff.id] || {};
            
            // Calculate totals for the selected period
            const periodTotals = {};
            
            activities.forEach(activity => {
                periodTotals[activity] = 0;
            });
            
            // Calculate totals from available data
            const today = new Date().getDate();
            
            // Adjust date range based on current period selection
            let startDay, endDay;
            switch (this.currentPeriod) {
                case 'daily':
                    // Only today
                    startDay = today;
                    endDay = today;
                    break;
                case 'weekly':
                    // Last 7 days including today
                    startDay = Math.max(1, today - 6);
                    endDay = today;
                    break;
                case 'monthly':
                    // Entire month up to today
                    startDay = 1;
                    endDay = today;
                    break;
                case 'yearly':
                    // For yearly, we'd need to consider multiple months, but for now use monthly
                    startDay = 1;
                    endDay = today;
                    break;
                default:
                    startDay = 1;
                    endDay = today;
            }
            
            Object.keys(staffData).forEach(day => {
                const dayNum = parseInt(day);
                const dayData = staffData[day];
                
                if (dayData && dayNum >= startDay && dayNum <= endDay) {
                    activities.forEach(activity => {
                        const value = dayData[activity] || 0;
                        periodTotals[activity] += value;
                    });
                }
            });
            
            // Calculate total activities for this period
            const periodTotal = activities.reduce((sum, activity) => sum + (periodTotals[activity] || 0), 0);
            
            staffStats.push({
                staff,
                periodTotals,
                periodTotal
            });
        });

        // Sort by staff ID (numeric/alphabetic)
        staffStats.sort((a, b) => {
            const aId = a.staff.id;
            const bId = b.staff.id;
            
            // Try to convert to numbers if they're numeric
            const aNum = parseInt(aId);
            const bNum = parseInt(bId);
            
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum; // Numeric sort
            } else {
                return aId.localeCompare(bId); // Alphabetic sort
            }
        });

        if (staffStats.length === 0) {
            tbody.innerHTML = '<tr><td colspan="23" class="text-center py-8 text-gray-500">No staff data available</td></tr>';
            return;
        }

        // Calculate totals for each activity across all staff
        const activityTotals = {};
        let grandTotal = 0;
        
        activities.forEach(activity => {
            activityTotals[activity] = 0;
        });
        
        staffStats.forEach(({ periodTotals, periodTotal }) => {
            activities.forEach(activity => {
                activityTotals[activity] += periodTotals[activity] || 0;
            });
            grandTotal += periodTotal;
        });

        tbody.innerHTML = staffStats.map(({ staff, periodTotals, periodTotal }) => {
            const avgTotal = staffStats.reduce((sum, s) => sum + s.periodTotal, 0) / staffStats.length;
            const performanceScore = this.calculatePerformanceScore(periodTotal, avgTotal);
            
            // Build activity cells with single period total
            const activityCells = activities.map(activity => {
                const periodValue = periodTotals[activity] || 0;
                return `
                    <td class="px-2 py-3 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-100 font-medium">
                        ${periodValue}
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
                        ${Utils.formatNumber(periodTotal)}
                    </td>
                </tr>
            `;
        }).join('');
        
        // Add totals row
        const totalActivityCells = activities.map(activity => {
            const total = activityTotals[activity];
            return `
                <td class="px-2 py-3 whitespace-nowrap text-center text-sm font-bold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700">
                    ${Utils.formatNumber(total)}
                </td>
            `;
        }).join('');
        
        tbody.innerHTML += `
            <tr class="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                <td class="px-3 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100 sticky left-0 bg-gray-100 dark:bg-gray-700">
                    TOTAL
                </td>
                ${totalActivityCells}
                <td class="px-3 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100 text-right bg-gray-100 dark:bg-gray-700">
                    ${Utils.formatNumber(grandTotal)}
                </td>
            </tr>
        `;
    }

    calculatePerformanceScore(staffTotal, average) {
        if (average === 0) return 50;
        return Math.min(100, Math.round((staffTotal / average) * 50));
    }

    getPerformanceBadge(score) {
        if (score >= 80) {
            return '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Excellent</span>';
        } else if (score >= 60) {
            return '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Good</span>';
        } else if (score >= 40) {
            return '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Average</span>';
        } else {
            return '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Needs Improvement</span>';
        }
    }

    showStaffDetails(staffId) {
        console.log('showStaffDetails called with staffId:', staffId);
        
        // Check if modal exists (i.e., we're on the summary page)
        const modal = document.getElementById('staff-details-modal');
        if (!modal) {
            console.log('Modal not found - not on summary page');
            return;
        }
        
        const state = this.app.getState();
        const staff = state.staff.find(s => s.id === staffId);
        
        if (!staff) {
            this.app.showToast('Staff member not found', 'error');
            return;
        }

        // Get today's date
        const today = new Date();
        const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        const dayKey = String(today.getDate()).padStart(2, '0');
        
        // Get today's activities for this staff
        const monthData = state.logs[monthKey];
        const todayActivities = (monthData && monthData.data[staffId] && monthData.data[staffId][dayKey]) || {};
        
        // All possible activities (from logs.js)
        const allActivities = [
            'Adding Client',
            "Today's Trust Love",
            'Total Trust Love',
            "Today's Hot Chat",
            'Total Hot Chat',
            'Test Side Cut',
            'Hair Cut',
            'Hair Wash',
            'Hair Treatment',
            'Hair Coloring',
            'Hair Styling',
            'Nail Service',
            'Facial Treatment',
            'Body Massage',
            'Eye Treatment',
            'Lip Treatment',
            'Skin Care',
            'Beauty Consultation',
            'Makeup Service',
            'Sending Voice',
            'Voice Calling',
            'Video Calling',
            'First Recharge',
            'Top Up',
            'Withdraw'
        ];

        // Calculate totals
        let totalToday = 0;
        let activitiesDone = 0;
        let topActivity = '';
        let topActivityCount = 0;

        allActivities.forEach(activity => {
            const count = todayActivities[activity] || 0;
            if (count > 0) {
                totalToday += count;
                activitiesDone++;
                if (count > topActivityCount) {
                    topActivity = activity;
                    topActivityCount = count;
                }
            }
        });

        // Update modal content
        document.getElementById('modal-staff-info').textContent = `ID: ${staff.id} - ${staff.name} (${staff.department})`;
        document.getElementById('modal-date-info').textContent = `📅 ${today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
        document.getElementById('modal-total-today').textContent = totalToday;
        document.getElementById('modal-activities-count').textContent = `${activitiesDone} / ${allActivities.length}`;
        document.getElementById('modal-top-activity').textContent = topActivity || 'None';

        // Populate activities grid
        const grid = document.getElementById('modal-activities-grid');
        grid.innerHTML = allActivities.map(activity => {
            const count = todayActivities[activity] || 0;
            
            // Define color schemes for different activity types
            const getActivityColor = (activity, count) => {
                if (count > 0) {
                    if (activity.includes('Client')) return 'bg-blue-100 text-blue-800 border-blue-300';
                    if (activity.includes('Trust Love')) return 'bg-pink-100 text-pink-800 border-pink-300';
                    if (activity.includes('Hot Chat')) return 'bg-orange-100 text-orange-800 border-orange-300';
                    if (activity.includes('Side Cut')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                    if (activity.includes('Freetask')) return 'bg-green-100 text-green-800 border-green-300';
                    if (activity.includes('Promote')) return 'bg-cyan-100 text-cyan-800 border-cyan-300';
                    if (activity.includes('Interesting')) return 'bg-blue-100 text-blue-800 border-blue-300';
                    if (activity.includes('Register')) return 'bg-purple-100 text-purple-800 border-purple-300';
                    if (activity.includes('Voice') || activity.includes('Video')) return 'bg-purple-100 text-purple-800 border-purple-300';
                    if (activity.includes('Recharge') || activity.includes('Top Up')) return 'bg-green-100 text-green-800 border-green-300';
                    if (activity.includes('Withdraw')) return 'bg-red-100 text-red-800 border-red-300';
                    return 'bg-gray-100 text-gray-800 border-gray-300';
                } else {
                    return 'bg-gray-50 text-gray-500 border-gray-200';
                }
            };
            
            const colorClass = getActivityColor(activity, count);
            
            return `
                <div class="rounded-lg border-2 p-3 text-center ${colorClass} hover:shadow-md transition-shadow">
                    <div class="text-2xl font-bold mb-1">${count}</div>
                    <div class="text-xs leading-tight">${activity}</div>
                </div>
            `;
        }).join('');

        // Show modal
        document.getElementById('staff-details-modal').classList.remove('hidden');
    }

    closeStaffModal() {
        document.getElementById('staff-details-modal').classList.add('hidden');
    }
}
