// Daily Logs Component with Excel-style grid
import { Utils } from './utils.js';

export class LogsManager {
    constructor(app) {
        this.app = app;
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.selectedDate = null; // For specific date selection
        this.editingCell = null;
        this.selectedStaffId = ''; // For filtering by staff
        this.viewMode = 'daily'; // daily, weekly, monthly
        this.teamReportPeriod = 'daily'; // Add team report period tracking
        this.activities = [
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
        ];
        
        // Make functions globally available immediately
        window.logsManager = this;
        window.showStaffDetailsFromLogs = (staffId) => this.showStaffDetails(staffId);
        window.closeStaffModalFromLogs = () => this.closeStaffModal();
    }

    getStaffIdByName(staffName) {
        const state = this.app.getState();
        const staff = state.staff.find(s => s.name === staffName);
        return staff ? staff.id : '';
    }

    render() {
        const content = document.getElementById('main-content');
        content.innerHTML = this.getTemplate();
        this.setupEventListeners();
        this.renderLogsGrid();
        
        // Make logsManager globally accessible for modal functions
        window.logsManager = this;
    }

    getTemplate() {
        return `
            <div class="max-w-full mx-auto p-3 sm:p-4 lg:p-6">
                <!-- Header -->
                <div class="mb-6 sm:mb-8">
                    <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        📝 Daily Activity Logs
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                        Track daily activities with Excel-style editing. Click any cell to edit values.
                    </p>
                </div>

                <!-- Controls -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
                    <!-- View Mode Filter -->
                    <div class="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-600">
                        <div class="flex flex-col">
                            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">View Mode</label>
                            <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                <button id="view-daily" class="view-mode-btn px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors touch-target" data-mode="daily">
                                    <span class="sm:hidden">📅</span>
                                    <span class="hidden sm:inline">📅 Daily</span>
                                </button>
                                <button id="view-weekly" class="view-mode-btn px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors touch-target" data-mode="weekly">
                                    <span class="sm:hidden">📊</span>
                                    <span class="hidden sm:inline">📊 Weekly</span>
                                </button>
                                <button id="view-monthly" class="view-mode-btn px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors touch-target" data-mode="monthly">
                                    <span class="sm:hidden">📈</span>
                                    <span class="hidden sm:inline">📈 Monthly</span>
                                </button>
                            </div>
                        </div>
                        <div class="flex flex-col">
                            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Info</label>
                            <div class="text-sm text-gray-600 dark:text-gray-400">
                                <span id="view-description">Day-by-day activity tracking</span>
                                <div id="selected-date-info" class="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400 hidden">
                                    📍 <span id="selected-date-text"></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Staff Selection and Month/Year -->
                    <div class="flex flex-col space-y-4 mb-6">
                        <!-- Staff Selection -->
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div class="flex flex-col">
                                <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Staff Member</label>
                                <select id="staff-filter" class="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 text-sm sm:text-base touch-target">
                                    <option value="">All Staff</option>
                                    <!-- Staff options will be populated -->
                                </select>
                            </div>
                            
                            <div class="flex flex-col">
                                <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Month/Year</label>
                                <div class="flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                                    <button id="prev-month" class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors touch-target">
                                        <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                        </svg>
                                    </button>
                                    <div class="text-center flex-1 px-2">
                                        <h2 id="current-month-year" class="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white whitespace-nowrap"></h2>
                                    </div>
                                    <button id="next-month" class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors touch-target">
                                        <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="flex flex-col">
                                <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Jump to Date</label>
                                <div class="flex items-center space-x-2">
                                    <input 
                                        type="date" 
                                        id="date-picker" 
                                        class="flex-1 px-3 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 text-sm touch-target"
                                        title="Select specific date to view"
                                    >
                                    <button 
                                        id="yesterday-btn" 
                                        class="px-2 sm:px-3 py-2 text-xs sm:text-sm bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800 text-yellow-700 dark:text-yellow-300 rounded-lg font-medium transition-colors touch-target"
                                        title="Go to yesterday"
                                    >
                                        <span class="sm:hidden">📅</span>
                                        <span class="hidden sm:inline">📅 Yesterday</span>
                                    </button>
                                    <button 
                                        id="today-btn" 
                                        class="px-2 sm:px-3 py-2 text-xs sm:text-sm bg-primary-100 hover:bg-primary-200 dark:bg-primary-900 dark:hover:bg-primary-800 text-primary-700 dark:text-primary-300 rounded-lg font-medium transition-colors touch-target"
                                        title="Go to today"
                                    >
                                        <span class="sm:hidden">📅</span>
                                        <span class="hidden sm:inline">📅 Today</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex flex-wrap gap-2">
                            <button id="export-logs-btn" class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base touch-target">
                                <span class="sm:hidden">💾</span>
                                <span class="hidden sm:inline">💾 Export Month</span>
                            </button>
                            <button id="clear-month-btn" class="bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base touch-target">
                                <span class="sm:hidden">🗑️</span>
                                <span class="hidden sm:inline">🗑️ Clear Month</span>
                            </button>
                        </div>
                    </div>

                    <!-- Quick Info -->
                    <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p class="text-sm text-blue-700 dark:text-blue-300">
                            <span id="info-message">
                                ⚠️ Select a specific staff member from the dropdown above to enable data entry. When viewing "All Staff", the grid shows read-only totals.
                            </span>
                        </p>
                    </div>

                    <!-- Date-Specific Report -->
                    <div id="date-report-section" class="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg hidden">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="text-lg font-semibold text-amber-800 dark:text-amber-200">
                                📅 Date Report
                            </h3>
                            <button id="clear-date-selection" class="text-sm text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200">
                                Clear Selection
                            </button>
                        </div>
                        <div id="date-report-content" class="space-y-3">
                            <!-- Date report content will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Excel-style Grid -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div class="overflow-x-auto">
                        <div id="logs-grid-container" class="relative">
                            <table id="logs-grid" class="border-collapse" style="min-width: 100%;">
                                <!-- Grid will be populated dynamically -->
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Combined Team Performance Report -->
                <div class="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg shadow-sm border border-purple-200 dark:border-purple-700 p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-2xl font-bold text-purple-900 dark:text-purple-100">
                            👥 Combined Team Performance
                        </h2>
                        <div class="flex items-center space-x-2">
                            <button id="team-report-daily" class="team-view-btn px-3 py-2 text-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors active" data-period="daily">
                                📅 Daily
                            </button>
                            <button id="team-report-weekly" class="team-view-btn px-3 py-2 text-sm bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors" data-period="weekly">
                                📊 Weekly
                            </button>
                            <button id="team-report-monthly" class="team-view-btn px-3 py-2 text-sm bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors" data-period="monthly">
                                📈 Monthly
                            </button>
                            <button id="export-team-report" class="bg-purple-100 hover:bg-purple-200 dark:bg-purple-800 dark:hover:bg-purple-700 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-lg font-medium transition-colors">
                                💾 Export Report
                            </button>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">🎯 Top Activities (Combined)</h3>
                            <div id="team-activity-totals" class="space-y-3 max-h-64 overflow-y-auto">
                                <!-- Team activity totals will be populated -->
                            </div>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">⭐ Top Performers</h3>
                            <div id="team-staff-rankings" class="space-y-3 max-h-64 overflow-y-auto">
                                <!-- Staff rankings will be populated -->
                            </div>
                        </div>
                    </div>

                    <div class="mt-6 pt-6 border-t border-purple-200 dark:border-purple-700">
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div class="text-center">
                                <div class="text-2xl font-bold text-purple-600 dark:text-purple-400" id="team-total-points">0</div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Total Points</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-blue-600 dark:text-blue-400" id="team-active-staff">0</div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Active Staff</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-green-600 dark:text-green-400" id="team-avg-performance">0</div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Avg per Staff</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-orange-600 dark:text-orange-400" id="team-top-activity">-</div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Top Activity</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Selected Date Report (appears when date is selected) -->
                <div id="selected-date-report" class="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-sm border border-blue-200 dark:border-blue-700 p-6 hidden">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-bold text-blue-900 dark:text-blue-100">
                            📊 Selected Date Report
                        </h3>
                        <button id="export-date-report" class="bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                            💾 Export Date Report
                        </button>
                    </div>
                    <div id="selected-date-details" class="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                        <div id="selected-date-info-text" class="text-sm text-gray-600 dark:text-gray-400"></div>
                    </div>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">📋 Activities for This Date</h4>
                            <div id="date-activity-breakdown" class="space-y-2 max-h-60 overflow-y-auto">
                                <!-- Date-specific activity breakdown will be populated -->
                            </div>
                        </div>
                        <div>
                            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">👥 Staff Performance</h4>
                            <div id="date-staff-breakdown" class="space-y-2 max-h-60 overflow-y-auto">
                                <!-- Date-specific staff breakdown will be populated -->
                            </div>
                        </div>
                    </div>
                    <div class="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                        <div class="flex items-center justify-between">
                            <div class="text-sm text-blue-700 dark:text-blue-300">
                                <span class="font-medium">Total Activities:</span> <span id="date-total-activities">0</span>
                            </div>
                            <div class="text-lg font-bold text-blue-900 dark:text-blue-100">
                                Grand Total: <span id="date-grand-total">0</span> points
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Data Entry Modal -->
                <div id="data-entry-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center p-4">
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                        <div class="p-6">
                            <div class="flex justify-between items-center mb-6">
                                <h2 class="text-xl font-bold text-gray-900 dark:text-white">📝 Enter Activity Data</h2>
                                <button id="close-data-modal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div class="text-sm text-blue-700 dark:text-blue-300">
                                    <div class="font-semibold mb-2">📊 <span id="modal-staff-name"></span></div>
                                    <div class="mb-1">🎯 Activity: <span id="modal-activity-name" class="font-medium"></span></div>
                                    <div>📅 Date: <span id="modal-date" class="font-medium"></span></div>
                                </div>
                            </div>

                            <form id="data-entry-form">
                                <div class="mb-6">
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Enter Amount/Points
                                    </label>
                                    <div class="relative">
                                        <input 
                                            type="number" 
                                            id="data-entry-value" 
                                            class="w-full px-4 py-3 text-2xl font-bold text-center border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                                            min="0" 
                                            step="1" 
                                            placeholder="0"
                                            required
                                        >
                                        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <span class="text-gray-400 text-sm">points</span>
                                        </div>
                                    </div>
                                    <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        Current value: <span id="current-value" class="font-medium">0</span>
                                    </div>
                                </div>

                                <!-- Quick Entry Buttons -->
                                <div class="mb-6">
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Quick Entry
                                    </label>
                                    <div class="grid grid-cols-5 gap-2">
                                        <button type="button" class="quick-entry-btn px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded" data-value="1">1</button>
                                        <button type="button" class="quick-entry-btn px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded" data-value="5">5</button>
                                        <button type="button" class="quick-entry-btn px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded" data-value="10">10</button>
                                        <button type="button" class="quick-entry-btn px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded" data-value="25">25</button>
                                        <button type="button" class="quick-entry-btn px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded" data-value="50">50</button>
                                    </div>
                                </div>

                                <div class="flex justify-end gap-3">
                                    <button type="button" id="cancel-data-btn" class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg font-medium transition-colors">
                                        Cancel
                                    </button>
                                    <button type="button" id="clear-data-btn" class="bg-red-100 hover:bg-red-200 dark:bg-red-700 dark:hover:bg-red-600 text-red-700 dark:text-red-300 px-6 py-2 rounded-lg font-medium transition-colors">
                                        Clear
                                    </button>
                                    <button type="submit" class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .logs-grid {
                    font-size: 0.875rem;
                }
                
                .view-mode-btn {
                    color: #6b7280;
                }
                
                .view-mode-btn.active {
                    background-color: #3b82f6;
                    color: white;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                }
                
                .view-mode-btn:not(.active):hover {
                    color: #374151;
                    background-color: #f3f4f6;
                }
                
                .dark .view-mode-btn:not(.active):hover {
                    color: #d1d5db;
                    background-color: #4b5563;
                }
                
                .selected-date {
                    background-color: #fef3c7 !important;
                    border: 2px solid #f59e0b !important;
                    box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2) !important;
                }
                
                .dark .selected-date {
                    background-color: #451a03 !important;
                    border: 2px solid #f59e0b !important;
                }
                
                .grid-cell {
                    border: 1px solid #e5e7eb;
                    padding: 8px;
                    text-align: center;
                    transition: background-color 0.2s;
                    min-width: 70px;
                    width: 70px;
                    height: 45px;
                    vertical-align: middle;
                }
                
                .grid-cell[data-staff-id] {
                    cursor: pointer;
                }
                
                .grid-cell[data-staff-id]:hover {
                    background-color: #e5f3ff !important;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 1px #3b82f6;
                }
                
                .activity-name-cell {
                    border: 1px solid #e5e7eb;
                    padding: 12px;
                    text-align: left;
                    cursor: default;
                    transition: background-color 0.2s;
                    min-width: 200px;
                    width: 200px;
                    height: 45px;
                    font-size: 0.875rem;
                    line-height: 1.3;
                    vertical-align: middle;
                    background-color: #ffffff;
                    position: relative;
                }
                
                .dark .activity-name-cell {
                    background-color: #1f2937;
                }
                
                .staff-name-cell {
                    border: 1px solid #e5e7eb;
                    padding: 12px;
                    text-align: left;
                    cursor: default;
                    transition: background-color 0.2s;
                    min-width: 120px;
                    width: 120px;
                    height: 45px;
                    font-weight: 600;
                    vertical-align: middle;
                }
                
                .dark .grid-cell,
                .dark .activity-name-cell,
                .dark .staff-name-cell {
                    border-color: #374151;
                }
                
                .grid-cell:hover {
                    background-color: #f3f4f6;
                }
                
                .dark .grid-cell:hover {
                    background-color: #374151;
                }
                
                .grid-cell.editing {
                    background-color: #dbeafe;
                    border-color: #3b82f6;
                }
                
                .dark .grid-cell.editing {
                    background-color: #1e3a8a;
                    border-color: #60a5fa;
                }
                
                .freeze-left {
                    position: sticky;
                    left: 0;
                    background: inherit;
                    z-index: 10;
                }
                
                .freeze-top {
                    position: sticky;
                    top: 0;
                    background: inherit;
                    z-index: 10;
                }
                
                .freeze-both {
                    position: sticky;
                    top: 0;
                    left: 0;
                    z-index: 20;
                    background: inherit;
                }
                
                .header-cell {
                    background-color: #f9fafb;
                    font-weight: 600;
                    border: 1px solid #d1d5db;
                }
                
                .dark .header-cell {
                    background-color: #374151;
                    border-color: #4b5563;
                }
                
                .total-cell {
                    background-color: #f3f4f6;
                    font-weight: 600;
                    border: 1px solid #d1d5db;
                }
                
                .dark .total-cell {
                    background-color: #4b5563;
                    border-color: #6b7280;
                }
                
                .team-view-btn {
                    border: 1px solid transparent;
                }
                
                .team-view-btn.active {
                    background-color: #3b82f6 !important;
                    color: white !important;
                    border-color: #2563eb;
                }
                
                .team-view-btn:not(.active):hover {
                    background-color: #f3f4f6;
                    border-color: #d1d5db;
                }
                
                .dark .team-view-btn:not(.active):hover {
                    background-color: #4b5563;
                    border-color: #6b7280;
                }
                
                .cell-input {
                    width: 100%;
                    height: 100%;
                    border: none;
                    background: transparent;
                    text-align: center;
                    outline: none;
                    font-size: inherit;
                    color: inherit;
                }
                
                /* Mobile Responsive Grid Styles */
                @media (max-width: 768px) {
                    .logs-grid {
                        font-size: 0.75rem;
                    }
                    
                    .grid-cell {
                        min-width: 50px !important;
                        width: 50px !important;
                        height: 40px !important;
                        padding: 4px !important;
                        font-size: 0.75rem !important;
                    }
                    
                    .activity-name-cell {
                        min-width: 150px !important;
                        width: 150px !important;
                        font-size: 0.75rem !important;
                        padding: 6px !important;
                    }
                    
                    .staff-name-cell {
                        height: 40px !important;
                        padding: 4px !important;
                        font-size: 0.75rem !important;
                    }
                    
                    .header-cell {
                        font-size: 0.7rem !important;
                        padding: 4px !important;
                    }
                }
                
                @media (max-width: 640px) {
                    .grid-cell {
                        min-width: 45px !important;
                        width: 45px !important;
                        height: 36px !important;
                        padding: 2px !important;
                        font-size: 0.7rem !important;
                    }
                    
                    .activity-name-cell {
                        min-width: 120px !important;
                        width: 120px !important;
                        font-size: 0.7rem !important;
                        padding: 4px !important;
                    }
                }
            </style>
            
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
                            <button onclick="window.closeStaffModalFromLogs()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-target">
                                <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        `;
    }

    setupEventListeners() {
        // View mode filter
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.setViewMode(mode);
            });
        });

        // Team report view buttons
        document.querySelectorAll('.team-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.target.dataset.period;
                this.setTeamReportPeriod(period);
            });
        });

        // Export team report
        document.getElementById('export-team-report').addEventListener('click', () => {
            this.exportTeamReport();
        });

        // Staff filter
        document.getElementById('staff-filter').addEventListener('change', (e) => {
            this.selectedStaffId = e.target.value;
            this.renderGrid();
            this.renderSummaryStats();
            this.renderTeamReport();
        });

        // Month navigation
        document.getElementById('prev-month').addEventListener('click', () => {
            this.changeMonth(-1);
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.changeMonth(1);
        });

        // Date picker
        document.getElementById('date-picker').addEventListener('change', (e) => {
            this.jumpToDate(e.target.value);
        });

        document.getElementById('yesterday-btn').addEventListener('click', () => {
            this.jumpToYesterday();
        });

        document.getElementById('today-btn').addEventListener('click', () => {
            this.jumpToToday();
        });

        // Clear date selection
        document.getElementById('clear-date-selection').addEventListener('click', () => {
            this.clearDateSelection();
        });

        // Export date report
        document.getElementById('export-date-report').addEventListener('click', () => {
            this.exportDateReport();
        });

        // Export and clear
        document.getElementById('export-logs-btn').addEventListener('click', () => {
            this.exportCurrentMonth();
        });

        document.getElementById('clear-month-btn').addEventListener('click', () => {
            this.clearCurrentMonth();
        });

        // Data entry modal events
        document.getElementById('close-data-modal').addEventListener('click', () => {
            this.closeDataModal();
        });

        document.getElementById('cancel-data-btn').addEventListener('click', () => {
            this.closeDataModal();
        });

        document.getElementById('clear-data-btn').addEventListener('click', () => {
            document.getElementById('data-entry-value').value = '0';
        });

        document.getElementById('data-entry-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveDataFromModal();
        });

        // Quick entry buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-entry-btn')) {
                const value = e.target.dataset.value;
                document.getElementById('data-entry-value').value = value;
            }
        });

        // Close modal on outside click
        document.getElementById('data-entry-modal').addEventListener('click', (e) => {
            if (e.target.id === 'data-entry-modal') {
                this.closeDataModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Check if modal is open
            const modalOpen = !document.getElementById('data-entry-modal').classList.contains('hidden');
            
            if (modalOpen) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.saveDataFromModal();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.closeDataModal();
                }
            }
        });
    }

    setViewMode(mode) {
        this.viewMode = mode;
        
        // Update button states
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
        
        // Update description
        const descriptions = {
            daily: 'Day-by-day activity tracking',
            weekly: 'Weekly aggregated view (7-day periods)',
            monthly: 'Monthly summary view'
        };
        document.getElementById('view-description').textContent = descriptions[mode];
        
        // Re-render grid with new view mode
        this.renderGrid();
        this.renderSummaryStats();
    }

    changeMonth(delta) {
        this.currentMonth += delta;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        } else if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        
        // Update date picker when navigating months
        this.updateDatePicker();
        this.renderLogsGrid();
    }

    renderLogsGrid() {
        this.updateMonthDisplay();
        this.populateStaffFilter();
        this.ensureMonthData();
        this.initializeViewMode();
        this.renderGrid();
        this.renderSummaryStats();
        this.renderTeamReport();
        
        // Highlight selected date after rendering
        setTimeout(() => {
            this.highlightSelectedDate();
            this.renderDateReport(); // Also render date report
        }, 100);
    }

    updateMonthDisplay() {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        document.getElementById('current-month-year').textContent = 
            `${monthNames[this.currentMonth]} ${this.currentYear}`;
        
        // Update date picker to match current month/year
        this.updateDatePicker();
    }

    populateStaffFilter() {
        const state = this.app.getState();
        const staffFilter = document.getElementById('staff-filter');
        
        // Preserve current selection
        const currentSelection = this.selectedStaffId;
        
        // Clear and populate options
        staffFilter.innerHTML = '<option value="">All Staff</option>';
        
        // Sort staff by ID first
        const sortedStaff = [...state.staff].sort((a, b) => {
            const aNum = parseInt(a.id);
            const bNum = parseInt(b.id);
            
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum; // Numeric sort
            } else {
                return a.id.localeCompare(b.id); // Alphabetic sort
            }
        });
        
        sortedStaff.forEach(staff => {
            const option = document.createElement('option');
            option.value = staff.id;
            option.textContent = `ID: ${staff.id} - ${staff.name}`;
            if (staff.id === currentSelection) {
                option.selected = true;
            }
            staffFilter.appendChild(option);
        });
    }

    jumpToDate(dateString) {
        // dateString format: "YYYY-MM-DD"
        if (!dateString) return;
        
        const selectedDate = new Date(dateString);
        this.selectedDate = selectedDate;
        this.currentYear = selectedDate.getFullYear();
        this.currentMonth = selectedDate.getMonth();
        
        this.renderLogsGrid();
        this.highlightSelectedDate();
        this.renderDateReport(); // Add date-specific report rendering
    }

    jumpToYesterday() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        this.selectedDate = yesterday;
        this.currentYear = yesterday.getFullYear();
        this.currentMonth = yesterday.getMonth();
        
        // Update date picker to reflect yesterday
        this.updateDatePicker();
        
        this.renderLogsGrid();
        this.highlightSelectedDate();
        this.renderDateReport(); // Add date-specific report rendering
    }

    jumpToToday() {
        const today = new Date();
        this.selectedDate = today;
        this.currentYear = today.getFullYear();
        this.currentMonth = today.getMonth();
        
        // Update date picker to reflect current date
        this.updateDatePicker();
        
        this.renderLogsGrid();
        this.highlightSelectedDate();
        this.renderDateReport(); // Add date-specific report rendering
    }

    updateDatePicker() {
        const dateToUse = this.selectedDate || new Date(this.currentYear, this.currentMonth, 1);
        const datePickerValue = dateToUse.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        const datePicker = document.getElementById('date-picker');
        if (datePicker) {
            datePicker.value = datePickerValue;
        }
    }

    clearDateSelection() {
        this.selectedDate = null;
        
        // Clear date picker
        const datePicker = document.getElementById('date-picker');
        if (datePicker) {
            datePicker.value = '';
        }
        
        // Hide date report
        const dateReportSection = document.getElementById('selected-date-report');
        if (dateReportSection) {
            dateReportSection.classList.add('hidden');
        }
        
        // Remove date highlights
        document.querySelectorAll('.selected-date').forEach(cell => {
            cell.classList.remove('selected-date');
        });
        
        // Hide selected date info
        const selectedDateInfo = document.getElementById('selected-date-info');
        if (selectedDateInfo) {
            selectedDateInfo.classList.add('hidden');
        }
        
        this.app.showToast('Date selection cleared', 'info');
    }

    renderDateReport() {
        if (!this.selectedDate) {
            // Hide date report if no date selected
            const dateReportSection = document.getElementById('selected-date-report');
            if (dateReportSection) {
                dateReportSection.classList.add('hidden');
            }
            return;
        }

        const state = this.app.getState();
        const monthKey = `${this.selectedDate.getFullYear()}-${String(this.selectedDate.getMonth() + 1).padStart(2, '0')}`;
        const monthData = state.logs[monthKey];
        
        if (!monthData) {
            // No data for this month
            const dateReportSection = document.getElementById('selected-date-report');
            if (dateReportSection) {
                dateReportSection.classList.add('hidden');
            }
            return;
        }

        const dayKey = String(this.selectedDate.getDate()).padStart(2, '0');
        
        // Show date report section
        const dateReportSection = document.getElementById('selected-date-report');
        if (dateReportSection) {
            dateReportSection.classList.remove('hidden');
        }

        // Update date info
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = this.selectedDate.toLocaleDateString('en-US', options);
        const selectedDateInfoText = document.getElementById('selected-date-info-text');
        if (selectedDateInfoText) {
            selectedDateInfoText.innerHTML = `
                <div class="flex items-center justify-between">
                    <div>
                        <div class="font-semibold text-gray-900 dark:text-white">📅 ${formattedDate}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">Activity Summary Report</div>
                    </div>
                    <div class="text-right">
                        <div class="text-sm text-gray-600 dark:text-gray-400">Day ${this.selectedDate.getDate()}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">${this.selectedDate.getFullYear()}</div>
                    </div>
                </div>
            `;
        }

        // Calculate activity breakdown for the selected date
        const activityBreakdown = {};
        const staffBreakdown = {};
        let grandTotal = 0;
        let totalActivities = 0;

        // Initialize activity breakdown
        this.activities.forEach(activity => {
            activityBreakdown[activity] = 0;
        });

        // Initialize staff breakdown
        state.staff.forEach(staff => {
            staffBreakdown[staff.id] = { name: staff.name, total: 0, activities: {} };
            this.activities.forEach(activity => {
                staffBreakdown[staff.id].activities[activity] = 0;
            });
        });

        // Calculate totals for the selected date
        state.staff.forEach(staff => {
            if (monthData.data[staff.id] && monthData.data[staff.id][dayKey]) {
                this.activities.forEach(activity => {
                    const value = monthData.data[staff.id][dayKey][activity] || 0;
                    if (value > 0) {
                        activityBreakdown[activity] += value;
                        staffBreakdown[staff.id].total += value;
                        staffBreakdown[staff.id].activities[activity] = value;
                        grandTotal += value;
                        totalActivities++;
                    }
                });
            }
        });

        // Render activity breakdown
        const dateActivityBreakdown = document.getElementById('date-activity-breakdown');
        if (dateActivityBreakdown) {
            const sortedActivities = Object.entries(activityBreakdown)
                .filter(([, total]) => total > 0)
                .sort(([, a], [, b]) => b - a);
            
            if (sortedActivities.length === 0) {
                dateActivityBreakdown.innerHTML = `
                    <div class="text-center py-4 text-gray-500 dark:text-gray-400">
                        <div class="text-2xl mb-2">📭</div>
                        <div class="text-sm">No activities recorded for this date</div>
                    </div>
                `;
            } else {
                dateActivityBreakdown.innerHTML = sortedActivities.map(([activity, total]) => `
                    <div class="flex justify-between items-center py-2 px-3 bg-white dark:bg-gray-700 rounded border">
                        <span class="text-sm text-gray-700 dark:text-gray-300 truncate mr-2" title="${activity}">${activity}</span>
                        <span class="text-sm font-bold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">${total}</span>
                    </div>
                `).join('');
            }
        }

        // Render staff breakdown
        const dateStaffBreakdown = document.getElementById('date-staff-breakdown');
        if (dateStaffBreakdown) {
            const sortedStaff = Object.values(staffBreakdown)
                .filter(staff => staff.total > 0)
                .sort((a, b) => {
                    // Sort by staff ID instead of total
                    const state = this.app.getState();
                    const staffA = state.staff.find(s => s.name === a.name);
                    const staffB = state.staff.find(s => s.name === b.name);
                    
                    if (!staffA || !staffB) return 0;
                    
                    const aId = staffA.id;
                    const bId = staffB.id;
                    
                    // Try to convert to numbers if they're numeric
                    const aNum = parseInt(aId);
                    const bNum = parseInt(bId);
                    
                    if (!isNaN(aNum) && !isNaN(bNum)) {
                        return aNum - bNum; // Numeric sort
                    } else {
                        return aId.localeCompare(bId); // Alphabetic sort
                    }
                });
            
            if (sortedStaff.length === 0) {
                dateStaffBreakdown.innerHTML = `
                    <div class="text-center py-4 text-gray-500 dark:text-gray-400">
                        <div class="text-2xl mb-2">👤</div>
                        <div class="text-sm">No staff activities for this date</div>
                    </div>
                `;
            } else {
                dateStaffBreakdown.innerHTML = sortedStaff.map(staff => {
                    const topActivities = Object.entries(staff.activities)
                        .filter(([, value]) => value > 0)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 3)
                        .map(([activity, value]) => `${activity}: ${value}`)
                        .join(', ');
                    
                    return `
                        <div class="bg-white dark:bg-gray-700 rounded border p-3">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-sm font-medium text-gray-900 dark:text-white">ID: ${this.getStaffIdByName(staff.name)} - ${staff.name}</span>
                                <span class="text-sm font-bold bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">${staff.total}</span>
                            </div>
                            <div class="text-xs text-gray-600 dark:text-gray-400 truncate" title="${topActivities}">
                                ${topActivities || 'No activities'}
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // Update totals
        const dateTotalActivities = document.getElementById('date-total-activities');
        const dateGrandTotal = document.getElementById('date-grand-total');
        if (dateTotalActivities) {
            dateTotalActivities.textContent = totalActivities;
        }
        if (dateGrandTotal) {
            dateGrandTotal.textContent = grandTotal;
        }
    }

    exportDateReport() {
        if (!this.selectedDate) {
            this.app.showToast('No date selected for export', 'error');
            return;
        }

        const state = this.app.getState();
        const monthKey = `${this.selectedDate.getFullYear()}-${String(this.selectedDate.getMonth() + 1).padStart(2, '0')}`;
        const monthData = state.logs[monthKey];
        
        if (!monthData) {
            this.app.showToast('No data available for selected date', 'error');
            return;
        }

        const dayKey = String(this.selectedDate.getDate()).padStart(2, '0');
        const formattedDate = this.selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD

        // Prepare CSV data
        const csvData = [];
        const headers = ['Staff ID', 'Staff Name', 'Activity', 'Points'];
        csvData.push(headers);

        state.staff.forEach(staff => {
            if (monthData.data[staff.id] && monthData.data[staff.id][dayKey]) {
                this.activities.forEach(activity => {
                    const value = monthData.data[staff.id][dayKey][activity] || 0;
                    if (value > 0) {
                        csvData.push([staff.id, staff.name, activity, value]);
                    }
                });
            }
        });

        if (csvData.length <= 1) {
            this.app.showToast('No data to export for selected date', 'warning');
            return;
        }

        const csv = csvData.map(row => row.join(',')).join('\n');
        const filename = `date_report_${formattedDate}.csv`;
        Utils.downloadFile(csv, filename, 'text/csv');
        this.app.showToast(`Date report exported: ${filename}`, 'success');
    }

    highlightSelectedDate() {
        // Remove previous highlights
        document.querySelectorAll('.selected-date').forEach(cell => {
            cell.classList.remove('selected-date');
        });

        const selectedDateInfo = document.getElementById('selected-date-info');
        const selectedDateText = document.getElementById('selected-date-text');

        // Highlight the selected date if it exists in current month
        if (this.selectedDate && 
            this.selectedDate.getFullYear() === this.currentYear && 
            this.selectedDate.getMonth() === this.currentMonth) {
            
            const dayToHighlight = this.selectedDate.getDate();
            const dayKey = String(dayToHighlight).padStart(2, '0');
            
            // Find and highlight cells for this day
            document.querySelectorAll(`[data-day="${dayKey}"]`).forEach(cell => {
                cell.classList.add('selected-date');
            });

            // Show selected date info
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const formattedDate = this.selectedDate.toLocaleDateString('en-US', options);
            
            selectedDateText.textContent = `Viewing: ${formattedDate}`;
            selectedDateInfo.classList.remove('hidden');
        } else {
            // Hide selected date info if not in current month
            selectedDateInfo.classList.add('hidden');
        }
    }

    ensureMonthData() {
        const monthKey = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}`;
        const state = this.app.getState();
        
        if (!state.logs[monthKey]) {
            state.logs[monthKey] = {
                activities: [...this.activities],
                data: {}
            };
            
            // Initialize data for all staff
            state.staff.forEach(staff => {
                state.logs[monthKey].data[staff.id] = {};
            });
            
            this.app.updateLogsWithSync(state.logs, {
                action: 'initialize_month',
                monthKey: monthKey,
                timestamp: Date.now()
            });
        } else {
            // Always ensure we have the latest activities
            state.logs[monthKey].activities = [...this.activities];
            this.app.updateLogsWithSync(state.logs, {
                action: 'update_activities',
                monthKey: monthKey,
                timestamp: Date.now()
            });
        }
    }

    renderGrid() {
        switch (this.viewMode) {
            case 'daily':
                this.renderDailyGrid();
                break;
            case 'weekly':
                this.renderWeeklyGrid();
                break;
            case 'monthly':
                this.renderMonthlyGrid();
                break;
            default:
                this.renderDailyGrid();
        }
    }

    renderDailyGrid() {
        const state = this.app.getState();
        const monthKey = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}`;
        const monthData = state.logs[monthKey];
        const monthInfo = Utils.getMonthInfo(this.currentYear, this.currentMonth);
        
        const grid = document.getElementById('logs-grid');
        grid.innerHTML = '';

        // Filter staff based on selection
        let staffToShow = state.staff;
        if (this.selectedStaffId) {
            staffToShow = state.staff.filter(staff => staff.id === this.selectedStaffId);
        }

        // Update info message and grid visibility based on selection
        const infoMessage = document.getElementById('info-message');
        const gridContainer = document.getElementById('logs-grid-container');
        
        if (this.selectedStaffId && staffToShow.length > 0) {
            // Show grid and success message for specific staff
            infoMessage.innerHTML = `📝 Click any cell to enter data for ${staffToShow[0].name}. Track daily performance for 21 activities.`;
            infoMessage.parentElement.className = 'mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg';
            infoMessage.className = 'text-sm text-green-700 dark:text-green-300';
            gridContainer.style.display = 'block';
        } else {
            // Hide grid and show instruction message for "All Staff"
            infoMessage.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-6xl mb-4">👥</div>
                    <div class="text-lg font-semibold mb-2">Select a Staff Member to Begin</div>
                    <div class="text-sm">Choose a specific staff member from the dropdown above to view and edit their daily activity data.</div>
                    <div class="text-xs mt-2 text-gray-500 dark:text-gray-400">The activity grid will appear once you make a selection.</div>
                </div>
            `;
            infoMessage.parentElement.className = 'mt-4 p-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg';
            infoMessage.className = 'text-blue-700 dark:text-blue-300';
            gridContainer.style.display = 'none';
            
            // Exit early since we don't need to render the grid
            return;
        }

        // Create header row
        const headerRow = document.createElement('tr');
        
        // Activity header
        const activityHeader = document.createElement('th');
        activityHeader.className = 'activity-name-cell header-cell freeze-left';
        activityHeader.textContent = 'Activity / Day';
        headerRow.appendChild(activityHeader);

        // Day headers
        for (let day = 1; day <= monthInfo.daysInMonth; day++) {
            const dayCell = document.createElement('th');
            dayCell.className = 'grid-cell header-cell freeze-top';
            
            // Add day of week
            const date = new Date(this.currentYear, this.currentMonth, day);
            const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
            const dayOfWeek = dayNames[date.getDay()];
            
            dayCell.innerHTML = `
                <div class="text-center">
                    <div class="font-semibold">${day}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">${dayOfWeek}</div>
                </div>
            `;
            headerRow.appendChild(dayCell);
        }

        // Total header
        const totalHeader = document.createElement('th');
        totalHeader.className = 'grid-cell header-cell freeze-top';
        totalHeader.innerHTML = `
            <div class="text-center">
                <div class="font-semibold">Total</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">MON</div>
            </div>
        `;
        headerRow.appendChild(totalHeader);

        grid.appendChild(headerRow);

        // If showing specific staff, add staff name row
        if (this.selectedStaffId && staffToShow.length > 0) {
            const staffInfoRow = document.createElement('tr');
            const staffInfoCell = document.createElement('td');
            staffInfoCell.colSpan = monthInfo.daysInMonth + 2;
            staffInfoCell.className = 'staff-name-cell header-cell text-center';
            staffInfoCell.innerHTML = `
                <div class="text-lg font-bold text-primary-600 dark:text-primary-400">
                    📊 ${staffToShow[0].name} - Daily Activity Log
                </div>
            `;
            staffInfoRow.appendChild(staffInfoCell);
            grid.appendChild(staffInfoRow);
        }

        // Create activity rows - all 21 activities
        const allActivities = [
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
        ];
        
        allActivities.forEach((activity, index) => {
            const row = document.createElement('tr');

            // Activity name cell
            const activityCell = document.createElement('td');
            activityCell.className = 'activity-name-cell freeze-left';
            activityCell.innerHTML = `
                <div class="flex items-center">
                    <span title="${activity}" class="font-medium text-gray-900">${activity}</span>
                </div>
            `;
            row.appendChild(activityCell);

            // Calculate total for this activity across all selected staff
            let activityTotal = 0;

            // Day cells
            for (let day = 1; day <= monthInfo.daysInMonth; day++) {
                const dayKey = String(day).padStart(2, '0');
                const cell = document.createElement('td');
                cell.className = 'grid-cell';
                
                let dayTotal = 0;
                
                // Sum values from all selected staff for this day and activity
                staffToShow.forEach(staff => {
                    const value = (monthData.data[staff.id] && monthData.data[staff.id][dayKey] && monthData.data[staff.id][dayKey][activity]) || 0;
                    dayTotal += value;
                });

                // If showing single staff, make cells editable
                if (this.selectedStaffId && staffToShow.length === 1) {
                    const staff = staffToShow[0];
                    const value = (monthData.data[staff.id] && monthData.data[staff.id][dayKey] && monthData.data[staff.id][dayKey][activity]) || 0;
                    
                    cell.textContent = value || '';
                    cell.dataset.staffId = staff.id;
                    cell.dataset.day = dayKey;
                    cell.dataset.activity = activity;
                    cell.title = `Click to edit ${activity} for ${staff.name} on day ${day}`;
                    
                    cell.addEventListener('click', () => this.openDataModal(cell));
                    
                    activityTotal += value;
                } else {
                    // Show aggregated total for all staff (read-only)
                    cell.textContent = dayTotal || '';
                    cell.style.cursor = 'default';
                    cell.title = 'Select a specific staff member to edit values';
                    activityTotal += dayTotal;
                }
                
                row.appendChild(cell);
            }

            // Total cell
            const totalCell = document.createElement('td');
            totalCell.className = 'grid-cell total-cell';
            totalCell.textContent = activityTotal;
            row.appendChild(totalCell);

            grid.appendChild(row);
        });

        // Daily totals row
        const dailyTotalsRow = document.createElement('tr');
        
        const dailyTotalLabel = document.createElement('td');
        dailyTotalLabel.className = 'activity-name-cell total-cell freeze-left';
        dailyTotalLabel.innerHTML = '<div class="font-bold">📈 Daily Totals</div>';
        dailyTotalsRow.appendChild(dailyTotalLabel);

        let grandTotal = 0;
        for (let day = 1; day <= monthInfo.daysInMonth; day++) {
            const dayKey = String(day).padStart(2, '0');
            let dayTotal = 0;
            
            staffToShow.forEach(staff => {
                this.activities.forEach(activity => {
                    const value = (monthData.data[staff.id] && monthData.data[staff.id][dayKey] && monthData.data[staff.id][dayKey][activity]) || 0;
                    dayTotal += value;
                });
            });
            
            const totalCell = document.createElement('td');
            totalCell.className = 'grid-cell total-cell';
            totalCell.textContent = dayTotal;
            dailyTotalsRow.appendChild(totalCell);
            
            grandTotal += dayTotal;
        }

        // Grand total cell
        const grandTotalCell = document.createElement('td');
        grandTotalCell.className = 'grid-cell total-cell';
        grandTotalCell.textContent = grandTotal;
        dailyTotalsRow.appendChild(grandTotalCell);

        grid.appendChild(dailyTotalsRow);

        // Make logsManager globally accessible
        window.logsManager = this;
    }

    renderWeeklyGrid() {
        const state = this.app.getState();
        const monthKey = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}`;
        const monthData = state.logs[monthKey];
        const monthInfo = Utils.getMonthInfo(this.currentYear, this.currentMonth);
        
        const grid = document.getElementById('logs-grid');
        grid.innerHTML = '';

        // Filter staff based on selection
        let staffToShow = state.staff;
        if (this.selectedStaffId) {
            staffToShow = state.staff.filter(staff => staff.id === this.selectedStaffId);
        }

        // Update info message and grid visibility based on selection
        const infoMessage = document.getElementById('info-message');
        const gridContainer = document.getElementById('logs-grid-container');
        
        if (this.selectedStaffId && staffToShow.length > 0) {
            // Show grid and success message for specific staff
            infoMessage.innerHTML = `📊 Weekly view for ${staffToShow[0].name}. Data is grouped into 7-day periods for better trend analysis.`;
            infoMessage.parentElement.className = 'mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg';
            infoMessage.className = 'text-sm text-green-700 dark:text-green-300';
            gridContainer.style.display = 'block';
        } else {
            // Hide grid and show instruction message for "All Staff"
            infoMessage.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-6xl mb-4">📊</div>
                    <div class="text-lg font-semibold mb-2">Select a Staff Member for Weekly View</div>
                    <div class="text-sm">Choose a specific staff member from the dropdown above to view their weekly activity summary.</div>
                    <div class="text-xs mt-2 text-gray-500 dark:text-gray-400">Weekly data aggregates daily activities into 7-day periods.</div>
                </div>
            `;
            infoMessage.parentElement.className = 'mt-4 p-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg';
            infoMessage.className = 'text-blue-700 dark:text-blue-300';
            gridContainer.style.display = 'none';
            
            // Exit early since we don't need to render the grid
            return;
        }

        // Calculate weeks in month
        const weeks = this.getWeeksInMonth(this.currentYear, this.currentMonth);

        // Create header row
        const headerRow = document.createElement('tr');
        
        // Activity header
        const activityHeader = document.createElement('th');
        activityHeader.className = 'activity-name-cell header-cell freeze-left';
        activityHeader.textContent = 'Activity / Week';
        headerRow.appendChild(activityHeader);

        // Week headers
        weeks.forEach((week, index) => {
            const weekCell = document.createElement('th');
            weekCell.className = 'grid-cell header-cell freeze-top';
            weekCell.innerHTML = `
                <div class="text-center">
                    <div class="font-semibold">Week ${index + 1}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">${week.start}-${week.end}</div>
                </div>
            `;
            headerRow.appendChild(weekCell);
        });

        // Total header
        const totalHeader = document.createElement('th');
        totalHeader.className = 'grid-cell header-cell freeze-top';
        totalHeader.innerHTML = `
            <div class="text-center">
                <div class="font-semibold">Total</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">MON</div>
            </div>
        `;
        headerRow.appendChild(totalHeader);

        grid.appendChild(headerRow);

        // Create activity rows
        const allActivities = [...this.activities];
        
        allActivities.forEach((activity) => {
            const row = document.createElement('tr');

            // Activity name cell
            const activityCell = document.createElement('td');
            activityCell.className = 'activity-name-cell freeze-left';
            activityCell.innerHTML = `
                <div class="flex items-center">
                    <span title="${activity}" class="font-medium text-gray-900">${activity}</span>
                </div>
            `;
            row.appendChild(activityCell);

            let activityTotal = 0;

            // Week cells
            weeks.forEach((week) => {
                const cell = document.createElement('td');
                cell.className = 'grid-cell';
                
                let weekTotal = 0;
                
                // Sum values for this week
                for (let day = week.startDay; day <= week.endDay; day++) {
                    const dayKey = String(day).padStart(2, '0');
                    staffToShow.forEach(staff => {
                        const value = (monthData.data[staff.id] && monthData.data[staff.id][dayKey] && monthData.data[staff.id][dayKey][activity]) || 0;
                        weekTotal += value;
                    });
                }

                cell.textContent = weekTotal || '';
                cell.style.cursor = 'default';
                cell.title = `${activity} - Week total: ${weekTotal}`;
                activityTotal += weekTotal;
                
                row.appendChild(cell);
            });

            // Total cell
            const totalCell = document.createElement('td');
            totalCell.className = 'grid-cell total-cell';
            totalCell.textContent = activityTotal;
            row.appendChild(totalCell);

            grid.appendChild(row);
        });

        // Weekly totals row
        const weeklyTotalsRow = document.createElement('tr');
        
        const weeklyTotalLabel = document.createElement('td');
        weeklyTotalLabel.className = 'activity-name-cell total-cell freeze-left';
        weeklyTotalLabel.innerHTML = '<div class="font-bold">📊 Weekly Totals</div>';
        weeklyTotalsRow.appendChild(weeklyTotalLabel);

        let grandTotal = 0;
        weeks.forEach((week) => {
            let weekTotal = 0;
            
            for (let day = week.startDay; day <= week.endDay; day++) {
                const dayKey = String(day).padStart(2, '0');
                staffToShow.forEach(staff => {
                    this.activities.forEach(activity => {
                        const value = (monthData.data[staff.id] && monthData.data[staff.id][dayKey] && monthData.data[staff.id][dayKey][activity]) || 0;
                        weekTotal += value;
                    });
                });
            }
            
            const totalCell = document.createElement('td');
            totalCell.className = 'grid-cell total-cell';
            totalCell.textContent = weekTotal;
            weeklyTotalsRow.appendChild(totalCell);
            
            grandTotal += weekTotal;
        });

        // Grand total cell
        const grandTotalCell = document.createElement('td');
        grandTotalCell.className = 'grid-cell total-cell';
        grandTotalCell.textContent = grandTotal;
        weeklyTotalsRow.appendChild(grandTotalCell);

        grid.appendChild(weeklyTotalsRow);
    }

    renderMonthlyGrid() {
        const state = this.app.getState();
        const monthKey = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}`;
        const monthData = state.logs[monthKey];
        
        const grid = document.getElementById('logs-grid');
        grid.innerHTML = '';

        // Filter staff based on selection
        let staffToShow = state.staff;
        if (this.selectedStaffId) {
            staffToShow = state.staff.filter(staff => staff.id === this.selectedStaffId);
        }

        // Update info message and grid visibility based on selection
        const infoMessage = document.getElementById('info-message');
        const gridContainer = document.getElementById('logs-grid-container');
        
        if (this.selectedStaffId && staffToShow.length > 0) {
            // Show grid and success message for specific staff
            infoMessage.innerHTML = `📈 Monthly summary for ${staffToShow[0].name}. View total activity points and daily averages for the entire month.`;
            infoMessage.parentElement.className = 'mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg';
            infoMessage.className = 'text-sm text-green-700 dark:text-green-300';
            gridContainer.style.display = 'block';
        } else {
            // Hide grid and show instruction message for "All Staff"
            infoMessage.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-6xl mb-4">📈</div>
                    <div class="text-lg font-semibold mb-2">Select a Staff Member for Monthly Summary</div>
                    <div class="text-sm">Choose a specific staff member from the dropdown above to view their monthly performance summary.</div>
                    <div class="text-xs mt-2 text-gray-500 dark:text-gray-400">Monthly view shows totals and daily averages for all activities.</div>
                </div>
            `;
            infoMessage.parentElement.className = 'mt-4 p-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg';
            infoMessage.className = 'text-blue-700 dark:text-blue-300';
            gridContainer.style.display = 'none';
            
            // Exit early since we don't need to render the grid
            return;
        }

        // Create header row
        const headerRow = document.createElement('tr');
        
        // Activity header
        const activityHeader = document.createElement('th');
        activityHeader.className = 'activity-name-cell header-cell freeze-left';
        activityHeader.textContent = 'Activity';
        headerRow.appendChild(activityHeader);

        // Monthly total header
        const monthHeader = document.createElement('th');
        monthHeader.className = 'grid-cell header-cell freeze-top';
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        monthHeader.innerHTML = `
            <div class="text-center">
                <div class="font-semibold">${monthNames[this.currentMonth]}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">${this.currentYear}</div>
            </div>
        `;
        headerRow.appendChild(monthHeader);

        // Average header
        const avgHeader = document.createElement('th');
        avgHeader.className = 'grid-cell header-cell freeze-top';
        avgHeader.innerHTML = `
            <div class="text-center">
                <div class="font-semibold">Daily Avg</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Per Day</div>
            </div>
        `;
        headerRow.appendChild(avgHeader);

        grid.appendChild(headerRow);

        // Create activity rows
        const allActivities = [...this.activities];
        const monthInfo = Utils.getMonthInfo(this.currentYear, this.currentMonth);
        
        allActivities.forEach((activity) => {
            const row = document.createElement('tr');

            // Activity name cell
            const activityCell = document.createElement('td');
            activityCell.className = 'activity-name-cell freeze-left';
            activityCell.innerHTML = `
                <div class="flex items-center">
                    <span title="${activity}" class="font-medium text-gray-900">${activity}</span>
                </div>
            `;
            row.appendChild(activityCell);

            // Calculate monthly total for this activity
            let monthlyTotal = 0;
            
            for (let day = 1; day <= monthInfo.daysInMonth; day++) {
                const dayKey = String(day).padStart(2, '0');
                staffToShow.forEach(staff => {
                    const value = (monthData.data[staff.id] && monthData.data[staff.id][dayKey] && monthData.data[staff.id][dayKey][activity]) || 0;
                    monthlyTotal += value;
                });
            }

            // Monthly total cell
            const totalCell = document.createElement('td');
            totalCell.className = 'grid-cell';
            totalCell.textContent = monthlyTotal || '';
            totalCell.style.cursor = 'default';
            totalCell.title = `${activity} - Monthly total: ${monthlyTotal}`;
            row.appendChild(totalCell);

            // Daily average cell
            const avgCell = document.createElement('td');
            avgCell.className = 'grid-cell';
            const dailyAvg = monthlyTotal > 0 ? (monthlyTotal / monthInfo.daysInMonth).toFixed(1) : '0';
            avgCell.textContent = dailyAvg;
            avgCell.style.cursor = 'default';
            avgCell.title = `${activity} - Daily average: ${dailyAvg}`;
            row.appendChild(avgCell);

            grid.appendChild(row);
        });

        // Monthly totals row
        const monthlyTotalsRow = document.createElement('tr');
        
        const monthlyTotalLabel = document.createElement('td');
        monthlyTotalLabel.className = 'activity-name-cell total-cell freeze-left';
        monthlyTotalLabel.innerHTML = '<div class="font-bold">📈 Grand Totals</div>';
        monthlyTotalsRow.appendChild(monthlyTotalLabel);

        // Calculate grand totals
        let grandMonthlyTotal = 0;
        
        for (let day = 1; day <= monthInfo.daysInMonth; day++) {
            const dayKey = String(day).padStart(2, '0');
            staffToShow.forEach(staff => {
                this.activities.forEach(activity => {
                    const value = (monthData.data[staff.id] && monthData.data[staff.id][dayKey] && monthData.data[staff.id][dayKey][activity]) || 0;
                    grandMonthlyTotal += value;
                });
            });
        }
        
        const grandTotalCell = document.createElement('td');
        grandTotalCell.className = 'grid-cell total-cell';
        grandTotalCell.textContent = grandMonthlyTotal;
        monthlyTotalsRow.appendChild(grandTotalCell);

        const grandAvgCell = document.createElement('td');
        grandAvgCell.className = 'grid-cell total-cell';
        const grandAvg = grandMonthlyTotal > 0 ? (grandMonthlyTotal / monthInfo.daysInMonth).toFixed(1) : '0';
        grandAvgCell.textContent = grandAvg;
        monthlyTotalsRow.appendChild(grandAvgCell);

        grid.appendChild(monthlyTotalsRow);
    }

    getWeeksInMonth(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const weeks = [];
        
        let currentWeekStart = 1;
        let weekNumber = 1;
        
        // Find the first Sunday or start of month
        let startDate = new Date(firstDay);
        
        while (currentWeekStart <= lastDay.getDate()) {
            const weekEnd = Math.min(currentWeekStart + 6, lastDay.getDate());
            const weekEndDate = new Date(year, month, weekEnd);
            
            // Adjust week end to Sunday or end of month
            while (weekEndDate.getDay() !== 0 && weekEnd < lastDay.getDate()) {
                weekEnd++;
                weekEndDate.setDate(weekEnd);
            }
            
            weeks.push({
                start: currentWeekStart,
                end: Math.min(weekEnd, lastDay.getDate()),
                startDay: currentWeekStart,
                endDay: Math.min(weekEnd, lastDay.getDate())
            });
            
            currentWeekStart = weekEnd + 1;
            weekNumber++;
        }
        
        return weeks;
    }

    openDataModal(cell) {
        this.editingCell = cell;
        
        const staffId = cell.dataset.staffId;
        const day = cell.dataset.day;
        const activity = cell.dataset.activity;
        const currentValue = cell.textContent || '0';
        
        // Get staff info
        const state = this.app.getState();
        const staff = state.staff.find(s => s.id === staffId);
        
        // Format date
        const dayNumber = parseInt(day);
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const formattedDate = `${monthNames[this.currentMonth]} ${dayNumber}, ${this.currentYear}`;
        
        // Populate modal
        document.getElementById('modal-staff-name').textContent = staff.name;
        document.getElementById('modal-activity-name').textContent = activity;
        document.getElementById('modal-date').textContent = formattedDate;
        document.getElementById('current-value').textContent = currentValue;
        document.getElementById('data-entry-value').value = currentValue;
        
        // Show modal
        document.getElementById('data-entry-modal').classList.remove('hidden');
        
        // Focus on input
        setTimeout(() => {
            const input = document.getElementById('data-entry-value');
            input.focus();
            input.select();
        }, 100);

        // Add keyboard event listener for ESC key
        this.modalKeyHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeDataModal();
            }
        };
        document.addEventListener('keydown', this.modalKeyHandler);
    }

    closeDataModal() {
        document.getElementById('data-entry-modal').classList.add('hidden');
        document.getElementById('data-entry-form').reset();
        this.editingCell = null;
        
        // Remove keyboard event listener
        if (this.modalKeyHandler) {
            document.removeEventListener('keydown', this.modalKeyHandler);
            this.modalKeyHandler = null;
        }
    }

    async saveDataFromModal() {
        if (!this.editingCell) return;

        try {
            const input = document.getElementById('data-entry-value');
            const value = parseInt(input.value) || 0;
            
            // Update data
            const staffId = this.editingCell.dataset.staffId;
            const day = this.editingCell.dataset.day;
            const activity = this.editingCell.dataset.activity;
            
            console.log(`💾 Saving activity data: ${activity} = ${value} for staff ${staffId} on day ${day}`);
            
            const state = this.app.getState();
            const monthKey = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}`;
            
            if (!state.logs[monthKey]) {
                state.logs[monthKey] = { data: {} };
            }
            if (!state.logs[monthKey].data[staffId]) {
                state.logs[monthKey].data[staffId] = {};
            }
            if (!state.logs[monthKey].data[staffId][day]) {
                state.logs[monthKey].data[staffId][day] = {};
            }
            
            state.logs[monthKey].data[staffId][day][activity] = value;
            
            // Enhanced sync: Update logs with immediate sync notification
            console.log('🔄 Triggering database sync...');
            await this.app.updateLogsWithSync(state.logs, {
                staffId,
                day,
                activity,
                value,
                monthKey,
                timestamp: Date.now()
            });

            console.log('✅ Activity data saved and synced');

            // Update cell display
            this.editingCell.textContent = value || '';
            
            // Close modal
            this.closeDataModal();

            // Re-render to update totals
            this.renderGrid();
            this.renderSummaryStats();
            this.renderTeamReport();
            
            // Show success message with sync status
            this.app.showToast(`Updated ${activity}: ${value} points`, 'success');
            
        } catch (error) {
            console.error('❌ Failed to save activity data:', error);
            this.app.showToast('Failed to save activity data', 'error');
        }
    }

    setTeamReportPeriod(period) {
        this.teamReportPeriod = period;
        
        // Update button states
        document.querySelectorAll('.team-view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');
        
        // Re-render team report
        this.renderTeamReport();
    }

    renderTeamReport() {
        const state = this.app.getState();
        const monthKey = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}`;
        const monthData = state.logs[monthKey];
        
        if (!monthData) {
            // No data available
            this.clearTeamReport();
            return;
        }

        let periodData = {};
        const monthInfo = Utils.getMonthInfo(this.currentYear, this.currentMonth);

        // Calculate data based on selected period
        switch (this.teamReportPeriod) {
            case 'daily':
                periodData = this.calculateDailyTeamData(state, monthData, monthInfo);
                break;
            case 'weekly':
                periodData = this.calculateWeeklyTeamData(state, monthData, monthInfo);
                break;
            case 'monthly':
                periodData = this.calculateMonthlyTeamData(state, monthData, monthInfo);
                break;
        }

        this.renderTeamActivityTotals(periodData.activityTotals);
        this.renderTeamStaffRankings(periodData.staffTotals);
        this.renderTeamSummaryStats(periodData);
    }

    calculateDailyTeamData(state, monthData, monthInfo) {
        const today = this.selectedDate || new Date();
        const isCurrentMonth = today.getFullYear() === this.currentYear && today.getMonth() === this.currentMonth;
        const targetDay = isCurrentMonth ? today.getDate() : 1; // Default to day 1 if not current month
        const dayKey = String(targetDay).padStart(2, '0');

        const activityTotals = {};
        const staffTotals = {};
        let totalPoints = 0;
        let activeStaff = 0;

        // Initialize
        this.activities.forEach(activity => {
            activityTotals[activity] = 0;
        });

        state.staff.forEach(staff => {
            staffTotals[staff.id] = { name: staff.name, total: 0, activities: {} };
            this.activities.forEach(activity => {
                staffTotals[staff.id].activities[activity] = 0;
            });
        });

        // Calculate for the specific day
        state.staff.forEach(staff => {
            let staffDayTotal = 0;
            this.activities.forEach(activity => {
                const value = (monthData.data[staff.id] && monthData.data[staff.id][dayKey] && monthData.data[staff.id][dayKey][activity]) || 0;
                if (value > 0) {
                    activityTotals[activity] += value;
                    staffTotals[staff.id].activities[activity] = value;
                    staffTotals[staff.id].total += value;
                    staffDayTotal += value;
                    totalPoints += value;
                }
            });
            if (staffDayTotal > 0) activeStaff++;
        });

        return {
            activityTotals,
            staffTotals,
            totalPoints,
            activeStaff,
            period: `Day ${targetDay}`,
            periodType: 'daily'
        };
    }

    calculateWeeklyTeamData(state, monthData, monthInfo) {
        const weeks = this.getWeeksInMonth(this.currentYear, this.currentMonth);
        const currentWeek = this.getCurrentWeek(weeks);

        const activityTotals = {};
        const staffTotals = {};
        let totalPoints = 0;
        let activeStaff = 0;

        // Initialize
        this.activities.forEach(activity => {
            activityTotals[activity] = 0;
        });

        state.staff.forEach(staff => {
            staffTotals[staff.id] = { name: staff.name, total: 0, activities: {} };
            this.activities.forEach(activity => {
                staffTotals[staff.id].activities[activity] = 0;
            });
        });

        // Calculate for current week
        state.staff.forEach(staff => {
            let staffWeekTotal = 0;
            for (let day = currentWeek.startDay; day <= currentWeek.endDay; day++) {
                const dayKey = String(day).padStart(2, '0');
                this.activities.forEach(activity => {
                    const value = (monthData.data[staff.id] && monthData.data[staff.id][dayKey] && monthData.data[staff.id][dayKey][activity]) || 0;
                    if (value > 0) {
                        activityTotals[activity] += value;
                        staffTotals[staff.id].activities[activity] += value;
                        staffTotals[staff.id].total += value;
                        staffWeekTotal += value;
                        totalPoints += value;
                    }
                });
            }
            if (staffWeekTotal > 0) activeStaff++;
        });

        return {
            activityTotals,
            staffTotals,
            totalPoints,
            activeStaff,
            period: `Week ${currentWeek.start}-${currentWeek.end}`,
            periodType: 'weekly'
        };
    }

    calculateMonthlyTeamData(state, monthData, monthInfo) {
        const activityTotals = {};
        const staffTotals = {};
        let totalPoints = 0;
        let activeStaff = 0;

        // Initialize
        this.activities.forEach(activity => {
            activityTotals[activity] = 0;
        });

        state.staff.forEach(staff => {
            staffTotals[staff.id] = { name: staff.name, total: 0, activities: {} };
            this.activities.forEach(activity => {
                staffTotals[staff.id].activities[activity] = 0;
            });
        });

        // Calculate for entire month
        state.staff.forEach(staff => {
            let staffMonthTotal = 0;
            for (let day = 1; day <= monthInfo.daysInMonth; day++) {
                const dayKey = String(day).padStart(2, '0');
                this.activities.forEach(activity => {
                    const value = (monthData.data[staff.id] && monthData.data[staff.id][dayKey] && monthData.data[staff.id][dayKey][activity]) || 0;
                    if (value > 0) {
                        activityTotals[activity] += value;
                        staffTotals[staff.id].activities[activity] += value;
                        staffTotals[staff.id].total += value;
                        staffMonthTotal += value;
                        totalPoints += value;
                    }
                });
            }
            if (staffMonthTotal > 0) activeStaff++;
        });

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];

        return {
            activityTotals,
            staffTotals,
            totalPoints,
            activeStaff,
            period: `${monthNames[this.currentMonth]} ${this.currentYear}`,
            periodType: 'monthly'
        };
    }

    getCurrentWeek(weeks) {
        const today = this.selectedDate || new Date();
        const isCurrentMonth = today.getFullYear() === this.currentYear && today.getMonth() === this.currentMonth;
        const targetDay = isCurrentMonth ? today.getDate() : 1;
        
        for (const week of weeks) {
            if (targetDay >= week.startDay && targetDay <= week.endDay) {
                return week;
            }
        }
        return weeks[0]; // Default to first week
    }

    renderTeamActivityTotals(activityTotals) {
        const container = document.getElementById('team-activity-totals');
        if (!container) return;

        const sortedActivities = Object.entries(activityTotals)
            .filter(([, total]) => total > 0)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

        if (sortedActivities.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-gray-500 dark:text-gray-400">
                    <div class="text-3xl mb-2">📭</div>
                    <div class="text-sm">No activities recorded for this period</div>
                </div>
            `;
            return;
        }

        container.innerHTML = sortedActivities.map(([activity, total], index) => {
            const colors = [
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
                'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
            ];
            const colorClass = colors[Math.min(index, 2)] || 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            
            return `
                <div class="flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-lg border shadow-sm">
                    <div class="flex items-center space-x-3">
                        <div class="text-lg">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎯'}</div>
                        <span class="text-sm font-medium text-gray-900 dark:text-white truncate" title="${activity}">${activity}</span>
                    </div>
                    <span class="text-lg font-bold px-3 py-1 rounded-full ${colorClass}">${total}</span>
                </div>
            `;
        }).join('');
    }

    renderTeamStaffRankings(staffTotals) {
        const container = document.getElementById('team-staff-rankings');
        if (!container) return;

        const sortedStaff = Object.values(staffTotals)
            .filter(staff => staff.total > 0)
            .sort((a, b) => {
                // Sort by staff ID instead of total
                const state = this.app.getState();
                const staffA = state.staff.find(s => s.name === a.name);
                const staffB = state.staff.find(s => s.name === b.name);
                
                if (!staffA || !staffB) return 0;
                
                const aId = staffA.id;
                const bId = staffB.id;
                
                // Try to convert to numbers if they're numeric
                const aNum = parseInt(aId);
                const bNum = parseInt(bId);
                
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return aNum - bNum; // Numeric sort
                } else {
                    return aId.localeCompare(bId); // Alphabetic sort
                }
            })
            .slice(0, 10);

        if (sortedStaff.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-gray-500 dark:text-gray-400">
                    <div class="text-3xl mb-2">👤</div>
                    <div class="text-sm">No staff activity for this period</div>
                </div>
            `;
            return;
        }

        container.innerHTML = sortedStaff.map((staff, index) => {
            const colors = [
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
                'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
            ];
            const colorClass = colors[Math.min(index, 2)] || 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            
            // Get top 3 activities for this staff
            const topActivities = Object.entries(staff.activities)
                .filter(([, value]) => value > 0)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([activity, value]) => `${activity}:${value}`)
                .join('; ');

            return `
                <div class="p-3 bg-white dark:bg-gray-700 rounded-lg border shadow-sm">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center space-x-3">
                            <div class="text-lg">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'}</div>
                            <button onclick="window.showStaffDetailsFromLogs('${this.getStaffIdByName(staff.name)}')" 
                                    class="text-sm font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer underline-offset-2 hover:underline text-left">
                                ${staff.name}
                            </button>
                        </div>
                        <span class="text-lg font-bold px-3 py-1 rounded-full ${colorClass}">${staff.total}</span>
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-400 truncate" title="${topActivities}">
                        ${topActivities || 'No activities'}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderTeamSummaryStats(periodData) {
        const totalPointsEl = document.getElementById('team-total-points');
        const activeStaffEl = document.getElementById('team-active-staff');
        const avgPerformanceEl = document.getElementById('team-avg-performance');
        const topActivityEl = document.getElementById('team-top-activity');

        if (totalPointsEl) totalPointsEl.textContent = periodData.totalPoints;
        if (activeStaffEl) activeStaffEl.textContent = `${periodData.activeStaff}/8`;
        
        const avgPerformance = periodData.activeStaff > 0 ? Math.round(periodData.totalPoints / periodData.activeStaff) : 0;
        if (avgPerformanceEl) avgPerformanceEl.textContent = avgPerformance;

        // Find top activity
        const topActivity = Object.entries(periodData.activityTotals)
            .filter(([, total]) => total > 0)
            .sort(([, a], [, b]) => b - a)[0];
        
        if (topActivityEl) {
            topActivityEl.textContent = topActivity ? topActivity[0].split(' ').slice(0, 2).join(' ') : '-';
            topActivityEl.title = topActivity ? `${topActivity[0]}: ${topActivity[1]} points` : 'No activities';
        }
    }

    clearTeamReport() {
        const containers = ['team-activity-totals', 'team-staff-rankings'];
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                        <div class="text-4xl mb-2">📊</div>
                        <div class="text-sm">No data available for this period</div>
                    </div>
                `;
            }
        });

        // Clear summary stats
        ['team-total-points', 'team-active-staff', 'team-avg-performance'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '0';
        });
        
        const topActivityEl = document.getElementById('team-top-activity');
        if (topActivityEl) topActivityEl.textContent = '-';
    }

    exportTeamReport() {
        const state = this.app.getState();
        const monthKey = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}`;
        const monthData = state.logs[monthKey];
        
        if (!monthData) {
            this.app.showToast('No data available for export', 'error');
            return;
        }

        const monthInfo = Utils.getMonthInfo(this.currentYear, this.currentMonth);
        let periodData = {};

        // Calculate data based on selected period
        switch (this.teamReportPeriod) {
            case 'daily':
                periodData = this.calculateDailyTeamData(state, monthData, monthInfo);
                break;
            case 'weekly':
                periodData = this.calculateWeeklyTeamData(state, monthData, monthInfo);
                break;
            case 'monthly':
                periodData = this.calculateMonthlyTeamData(state, monthData, monthInfo);
                break;
        }

        // Prepare CSV data
        const csvData = [];
        
        // Header
        csvData.push(['Combined Team Performance Report']);
        csvData.push(['Period:', periodData.period]);
        csvData.push(['Generated:', new Date().toLocaleString()]);
        csvData.push([]);

        // Summary stats
        csvData.push(['Summary Statistics']);
        csvData.push(['Total Points:', periodData.totalPoints]);
        csvData.push(['Active Staff:', `${periodData.activeStaff}/8`]);
        csvData.push(['Average per Staff:', Math.round(periodData.totalPoints / Math.max(periodData.activeStaff, 1))]);
        csvData.push([]);

        // Activity totals
        csvData.push(['Activity Performance']);
        csvData.push(['Activity', 'Points']);
        Object.entries(periodData.activityTotals)
            .filter(([, total]) => total > 0)
            .sort(([, a], [, b]) => b - a)
            .forEach(([activity, total]) => {
                csvData.push([activity, total]);
            });
        csvData.push([]);

        // Staff rankings
        csvData.push(['Staff Performance']);
        csvData.push(['Staff', 'Total Points', 'Top Activities']);
        Object.values(periodData.staffTotals)
            .filter(staff => staff.total > 0)
            .sort((a, b) => b.total - a.total)
            .forEach(staff => {
                const topActivities = Object.entries(staff.activities)
                    .filter(([, value]) => value > 0)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([activity, value]) => `${activity}:${value}`)
                    .join('; ');
                csvData.push([staff.name, staff.total, topActivities]);
            });

        const csv = csvData.map(row => row.join(',')).join('\n');
        const filename = `team_report_${this.teamReportPeriod}_${monthKey}.csv`;
        Utils.downloadFile(csv, filename, 'text/csv');
        this.app.showToast(`Team report exported: ${filename}`, 'success');
    }

    // ... existing code ...

    renderSummaryStats() {
        // Three boxes (Daily Breakdown, Activity Performance, Staff Performance) have been removed
        // This function no longer needs to render anything
        return;
    }

    exportCurrentMonth() {
        const state = this.app.getState();
        const monthKey = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}`;
        const monthData = state.logs[monthKey];
        const monthInfo = Utils.getMonthInfo(this.currentYear, this.currentMonth);

        // Filter staff based on selection
        let staffToShow = state.staff;
        if (this.selectedStaffId) {
            staffToShow = state.staff.filter(staff => staff.id === this.selectedStaffId);
        }

        // Prepare CSV data
        const csvData = [];
        const headers = ['Staff', 'Activity', ...Array.from({length: monthInfo.daysInMonth}, (_, i) => `Day ${i + 1}`), 'Total'];
        csvData.push(headers);

        staffToShow.forEach(staff => {
            this.activities.forEach(activity => {
                const row = [staff.name, activity];
                let total = 0;
                
                for (let day = 1; day <= monthInfo.daysInMonth; day++) {
                    const dayKey = String(day).padStart(2, '0');
                    const value = (monthData.data[staff.id] && monthData.data[staff.id][dayKey] && monthData.data[staff.id][dayKey][activity]) || 0;
                    row.push(value);
                    total += value;
                }
                
                row.push(total);
                csvData.push(row);
            });
        });

        const csv = csvData.map(row => row.join(',')).join('\n');
        const staffSuffix = this.selectedStaffId ? `_${staffToShow[0].name.replace(/\s+/g, '_')}` : '_all_staff';
        const filename = `activity_logs_${monthKey}${staffSuffix}.csv`;
        Utils.downloadFile(csv, filename, 'text/csv');
        this.app.showToast('Logs exported successfully', 'success');
    }

    clearCurrentMonth() {
        const confirmMessage = this.selectedStaffId 
            ? 'Clear all activity data for the selected staff member this month? This action cannot be undone.'
            : 'Clear all activity data for all staff this month? This action cannot be undone.';
            
        if (!confirm(confirmMessage)) {
            return;
        }

        const state = this.app.getState();
        const monthKey = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}`;
        
        if (this.selectedStaffId) {
            // Clear data for selected staff only
            state.logs[monthKey].data[this.selectedStaffId] = {};
        } else {
            // Reset data for all staff
            state.staff.forEach(staff => {
                state.logs[monthKey].data[staff.id] = {};
            });
        }
        
        this.app.updateLogsWithSync(state.logs, {
            action: 'clear_month',
            monthKey: monthKey,
            staffId: this.selectedStaffId,
            timestamp: Date.now()
        });
        this.renderGrid();
        this.renderSummaryStats();
        this.renderTeamReport();
        this.app.showToast('Month data cleared successfully', 'success');
    }

    initializeViewMode() {
        // Set initial active state
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === this.viewMode) {
                btn.classList.add('active');
            }
        });
        
        // Set initial team report state
        document.querySelectorAll('.team-view-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.period === this.teamReportPeriod) {
                btn.classList.add('active');
            }
        });
        
        // Set initial description
        const descriptions = {
            daily: 'Day-by-day activity tracking',
            weekly: 'Weekly aggregated view (7-day periods)',
            monthly: 'Monthly summary view'
        };
        document.getElementById('view-description').textContent = descriptions[this.viewMode];
    }

    getStaffIdByName(staffName) {
        const state = this.app.getState();
        const staff = state.staff.find(s => s.name === staffName);
        return staff ? staff.id : '';
    }

    showStaffDetails(staffId) {
        console.log('showStaffDetails called with staffId:', staffId);
        
        // Check if modal exists (i.e., we're on the logs page)
        const modal = document.getElementById('staff-details-modal');
        if (!modal) {
            console.log('Modal not found - not on logs page');
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
        
        // Calculate totals
        let totalToday = 0;
        let activitiesDone = 0;
        let topActivity = '';
        let topActivityCount = 0;

        this.activities.forEach(activity => {
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
        document.getElementById('modal-activities-count').textContent = `${activitiesDone} / ${this.activities.length}`;
        document.getElementById('modal-top-activity').textContent = topActivity || 'None';

        // Populate activities grid
        const grid = document.getElementById('modal-activities-grid');
        grid.innerHTML = this.activities.map(activity => {
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
