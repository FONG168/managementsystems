// Staff Management Component
import { Utils } from './utils.js';

export class StaffManager {
    constructor(app) {
        this.app = app;
        this.currentSort = { field: 'id', direction: 'asc' }; // Default sort by ID
        this.currentFilter = '';
        this.selectedStaff = new Set();
    }

    render() {
        const content = document.getElementById('main-content');
        content.innerHTML = this.getTemplate();
        this.setupEventListeners();
        this.renderStaffTable();
        
        // Make staffManager globally accessible for inline event handlers
        window.staffManager = this;
    }

    getTemplate() {
        return `
            <div class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <!-- Header -->
                <div class="mb-8">
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        👥 Staff Management
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400">
                        Manage employee information, add new staff, and maintain records.
                    </p>
                </div>

                <!-- Action Bar -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <!-- Search -->
                        <div class="flex-1 max-w-md">
                            <div class="relative">
                                <input type="text" id="staff-search" placeholder="Search staff by name or ID..."
                                    class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                           focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex flex-wrap gap-2">
                            <button id="add-staff-btn" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                ➕ Add Staff
                            </button>
                            <button id="export-staff-btn" class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium transition-colors">
                                💾 Export
                            </button>
                            <button id="load-sample-btn" class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium transition-colors">
                                📋 Sample Data
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Staff Table -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div class="overflow-x-auto">
                        <table id="staff-table" class="w-full min-w-full">
                            <thead class="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer sortable" data-field="id">
                                        ID <span class="sort-icon ml-1">↕️</span>
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer sortable" data-field="name">
                                        Name <span class="sort-icon ml-1">↕️</span>
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer sortable" data-field="department">
                                        Department <span class="sort-icon ml-1">↕️</span>
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer sortable" data-field="position">
                                        Position <span class="sort-icon ml-1">↕️</span>
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer sortable" data-field="email">
                                        Email <span class="sort-icon ml-1">↕️</span>
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer sortable" data-field="salary">
                                        Salary <span class="sort-icon ml-1">↕️</span>
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer sortable" data-field="active">
                                        Status <span class="sort-icon ml-1">↕️</span>
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="staff-table-body" class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                <!-- Staff rows will be inserted here -->
                            </tbody>
                        </table>
                    </div>

                    <!-- Empty State -->
                    <div id="empty-state" class="hidden text-center py-12">
                        <div class="text-gray-400 text-6xl mb-4">👥</div>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No staff members found</h3>
                        <p class="text-gray-500 dark:text-gray-400 mb-4">Get started by adding your first staff member.</p>
                        <button id="add-first-staff-btn" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            ➕ Add First Staff Member
                        </button>
                    </div>
                </div>

                <!-- Staff Modal -->
                <div id="staff-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center p-4">
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div class="p-6">
                            <div class="flex justify-between items-center mb-6">
                                <h2 id="modal-title" class="text-xl font-bold text-gray-900 dark:text-white">
                                    Add New Staff Member
                                </h2>
                                <button id="close-modal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form id="staff-form" class="space-y-4">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee ID *</label>
                                        <input type="text" id="staff-id" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" required>
                                        <div class="text-red-500 text-xs mt-1 hidden" id="id-error"></div>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                                        <input type="text" id="staff-name" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" required>
                                        <div class="text-red-500 text-xs mt-1 hidden" id="name-error"></div>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department *</label>
                                        <select id="staff-department" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" required>
                                            <option value="">Select Department</option>
                                            <option value="Customer Service">Customer Service</option>
                                            <option value="Sales">Sales</option>
                                            <option value="Operations">Operations</option>
                                            <option value="Marketing">Marketing</option>
                                            <option value="Finance">Finance</option>
                                            <option value="Technical Support">Technical Support</option>
                                            <option value="Quality Assurance">Quality Assurance</option>
                                            <option value="Management">Management</option>
                                        </select>
                                        <div class="text-red-500 text-xs mt-1 hidden" id="department-error"></div>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position *</label>
                                        <input type="text" id="staff-position" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" required>
                                        <div class="text-red-500 text-xs mt-1 hidden" id="position-error"></div>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                                        <input type="email" id="staff-email" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" required>
                                        <div class="text-red-500 text-xs mt-1 hidden" id="email-error"></div>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                                        <input type="tel" id="staff-phone" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                                        <div class="text-red-500 text-xs mt-1 hidden" id="phone-error"></div>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date *</label>
                                        <input type="date" id="staff-start-date" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" required>
                                        <div class="text-red-500 text-xs mt-1 hidden" id="start-date-error"></div>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Annual Salary</label>
                                        <input type="number" id="staff-salary" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" min="0" step="0.01">
                                        <div class="text-red-500 text-xs mt-1 hidden" id="salary-error"></div>
                                    </div>
                                </div>

                                <div class="flex items-center">
                                    <input type="checkbox" id="staff-active" class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded mr-2" checked>
                                    <label for="staff-active" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Active Employee</label>
                                </div>

                                <div class="flex justify-end gap-3 pt-6">
                                    <button type="button" id="cancel-btn" class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" id="save-btn" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                        Save Staff Member
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('staff-search');
        searchInput.addEventListener('input', Utils.debounce((e) => {
            this.currentFilter = e.target.value;
            this.renderStaffTable();
        }, 300));

        // Add staff button
        document.getElementById('add-staff-btn').addEventListener('click', () => {
            this.openStaffModal();
        });

        document.getElementById('add-first-staff-btn')?.addEventListener('click', () => {
            this.openStaffModal();
        });

        // Export button
        document.getElementById('export-staff-btn').addEventListener('click', () => {
            this.exportStaff();
        });

        // Sample data button
        document.getElementById('load-sample-btn').addEventListener('click', () => {
            this.loadSampleData();
        });

        // Table sorting
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => {
                const field = header.dataset.field;
                this.sortTable(field);
            });
        });

        // Modal event listeners
        this.setupModalEventListeners();
    }

    setupModalEventListeners() {
        // Staff modal
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeStaffModal();
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.closeStaffModal();
        });

        document.getElementById('staff-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveStaff();
        });
    }

    renderStaffTable() {
        const staff = this.getFilteredAndSortedStaff();
        const tbody = document.getElementById('staff-table-body');
        const emptyState = document.getElementById('empty-state');

        if (staff.length === 0) {
            tbody.innerHTML = '';
            emptyState.classList.remove('hidden');
            document.getElementById('staff-table').style.display = 'none';
        } else {
            emptyState.classList.add('hidden');
            document.getElementById('staff-table').style.display = 'table';
            tbody.innerHTML = staff.map(member => this.createStaffRow(member)).join('');
        }

        this.updateSortIcons();
    }

    createStaffRow(staff) {
        const statusBadge = staff.active 
            ? '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</span>'
            : '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Inactive</span>';

        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">${staff.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">${staff.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">${staff.department}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">${staff.position}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">${staff.email}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <div class="editable-salary cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 rounded px-2 py-1 transition-colors relative group" 
                         onclick="window.staffManager.editSalary('${staff.id}', this)" 
                         data-staff-id="${staff.id}" 
                         data-original-value="${staff.salary || 0}"
                         title="Click to edit salary">
                        ${staff.salary ? Utils.formatCurrency(staff.salary) : '$0.00'}
                        <span class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                            Click to edit
                        </span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">${statusBadge}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <div class="flex space-x-2">
                        <button onclick="window.staffManager.editStaff('${staff.id}')" 
                                class="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-lg">
                            ✏️
                        </button>
                        <button onclick="window.staffManager.deleteStaff('${staff.id}')" 
                                class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-lg">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    getFilteredAndSortedStaff() {
        let staff = [...this.app.getState().staff];

        // Apply filter
        if (this.currentFilter) {
            staff = staff.filter(member => 
                member.name.toLowerCase().includes(this.currentFilter.toLowerCase()) ||
                member.id.toLowerCase().includes(this.currentFilter.toLowerCase()) ||
                member.department.toLowerCase().includes(this.currentFilter.toLowerCase()) ||
                member.email.toLowerCase().includes(this.currentFilter.toLowerCase())
            );
        }

        // Apply sort
        staff.sort((a, b) => {
            const aVal = a[this.currentSort.field];
            const bVal = b[this.currentSort.field];
            const direction = this.currentSort.direction === 'asc' ? 1 : -1;

            // Special handling for ID field to support numeric sorting
            if (this.currentSort.field === 'id') {
                const aNum = parseInt(aVal);
                const bNum = parseInt(bVal);
                
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    // Both are numeric
                    return (aNum - bNum) * direction;
                } else {
                    // Fall back to string comparison
                    return aVal.localeCompare(bVal) * direction;
                }
            }

            // Default string/numeric comparison for other fields
            if (aVal < bVal) return -1 * direction;
            if (aVal > bVal) return 1 * direction;
            return 0;
        });

        return staff;
    }

    sortTable(field) {
        if (this.currentSort.field === field) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.field = field;
            this.currentSort.direction = 'asc';
        }
        this.renderStaffTable();
    }

    updateSortIcons() {
        document.querySelectorAll('.sortable .sort-icon').forEach(icon => {
            icon.textContent = '↕️';
        });

        const currentHeader = document.querySelector(`[data-field="${this.currentSort.field}"] .sort-icon`);
        if (currentHeader) {
            currentHeader.textContent = this.currentSort.direction === 'asc' ? '↑' : '↓';
        }
    }

    openStaffModal(staffId = null) {
        const modal = document.getElementById('staff-modal');
        const form = document.getElementById('staff-form');
        const title = document.getElementById('modal-title');

        // Reset form
        form.reset();
        this.clearFormErrors();

        if (staffId) {
            const staff = this.app.getState().staff.find(s => s.id === staffId);
            if (staff) {
                title.textContent = 'Edit Staff Member';
                this.populateForm(staff);
            }
        } else {
            title.textContent = 'Add New Staff Member';
            // Generate next ID
            document.getElementById('staff-id').value = this.generateNextId();
        }

        modal.classList.remove('hidden');
        document.getElementById('staff-name').focus();
    }

    closeStaffModal() {
        document.getElementById('staff-modal').classList.add('hidden');
    }

    populateForm(staff) {
        document.getElementById('staff-id').value = staff.id;
        document.getElementById('staff-name').value = staff.name;
        document.getElementById('staff-department').value = staff.department;
        document.getElementById('staff-position').value = staff.position;
        document.getElementById('staff-email').value = staff.email;
        document.getElementById('staff-phone').value = staff.phone || '';
        document.getElementById('staff-start-date').value = staff.startDate;
        document.getElementById('staff-salary').value = staff.salary || '';
        document.getElementById('staff-active').checked = staff.active;
    }

    saveStaff() {
        if (!this.validateForm()) return;

        const formData = this.getFormData();
        const state = this.app.getState();
        const existingIndex = state.staff.findIndex(s => s.id === formData.id);

        if (existingIndex >= 0) {
            state.staff[existingIndex] = formData;
            this.app.showToast('Staff member updated successfully', 'success');
        } else {
            // Check for duplicate ID
            if (state.staff.some(s => s.id === formData.id)) {
                this.showFormError('id-error', 'Employee ID already exists');
                return;
            }
            state.staff.push(formData);
            this.app.showToast('Staff member added successfully', 'success');
        }

        this.app.updateStaff(state.staff);
        this.closeStaffModal();
        this.renderStaffTable();
    }

    getFormData() {
        return {
            id: document.getElementById('staff-id').value.trim(),
            name: document.getElementById('staff-name').value.trim(),
            department: document.getElementById('staff-department').value,
            position: document.getElementById('staff-position').value.trim(),
            email: document.getElementById('staff-email').value.trim(),
            phone: document.getElementById('staff-phone').value.trim(),
            startDate: document.getElementById('staff-start-date').value,
            salary: parseFloat(document.getElementById('staff-salary').value) || 0,
            active: document.getElementById('staff-active').checked
        };
    }

    validateForm() {
        this.clearFormErrors();
        let isValid = true;

        const formData = this.getFormData();

        // Required fields
        if (!formData.id) {
            this.showFormError('id-error', 'Employee ID is required');
            isValid = false;
        }

        if (!formData.name) {
            this.showFormError('name-error', 'Name is required');
            isValid = false;
        }

        if (!formData.department) {
            this.showFormError('department-error', 'Department is required');
            isValid = false;
        }

        if (!formData.position) {
            this.showFormError('position-error', 'Position is required');
            isValid = false;
        }

        if (!formData.email) {
            this.showFormError('email-error', 'Email is required');
            isValid = false;
        } else if (!Utils.validateEmail(formData.email)) {
            this.showFormError('email-error', 'Please enter a valid email address');
            isValid = false;
        }

        if (formData.phone && !Utils.validatePhone(formData.phone)) {
            this.showFormError('phone-error', 'Please enter a valid phone number');
            isValid = false;
        }

        if (!formData.startDate) {
            this.showFormError('start-date-error', 'Start date is required');
            isValid = false;
        }

        return isValid;
    }

    clearFormErrors() {
        document.querySelectorAll('.text-red-500').forEach(error => {
            error.classList.add('hidden');
            error.textContent = '';
        });
    }

    showFormError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }

    generateNextId() {
        const staff = this.app.getState().staff;
        const maxId = staff.reduce((max, s) => {
            const num = parseInt(s.id);
            return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        return String(maxId + 1).padStart(3, '0');
    }

    editStaff(staffId) {
        this.openStaffModal(staffId);
    }

    deleteStaff(staffId) {
        if (confirm('Are you sure you want to delete this staff member?')) {
            const state = this.app.getState();
            state.staff = state.staff.filter(s => s.id !== staffId);
            this.app.updateStaff(state.staff);
            this.renderStaffTable();
            this.app.showToast('Staff member deleted successfully', 'success');
        }
    }

    exportStaff() {
        const staff = this.app.getState().staff;
        const csv = Utils.arrayToCSV(staff);
        Utils.downloadFile(csv, `staff_export_${Utils.formatDate(new Date(), 'YYYY-MM-DD')}.csv`, 'text/csv');
        this.app.showToast('Staff data exported successfully', 'success');
    }

    loadSampleData() {
        if (confirm('This will add sample staff data. Continue?')) {
            this.app.loadSampleData();
            this.renderStaffTable();
        }
    }

    editSalary(staffId, element) {
        // If already editing, return
        if (element.querySelector('input')) {
            return;
        }

        const currentValue = element.dataset.originalValue;
        const numericValue = parseFloat(currentValue) || 0;
        
        // Create input field
        const input = document.createElement('input');
        input.type = 'number';
        input.value = numericValue;
        input.min = '0';
        input.step = '0.01';
        input.className = 'w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500';
        
        // Store original content
        const originalContent = element.innerHTML;
        
        // Replace content with input
        element.innerHTML = '';
        element.appendChild(input);
        input.focus();
        input.select();
        
        // Handle save on Enter or blur
        const saveSalary = () => {
            const newValue = parseFloat(input.value) || 0;
            this.updateStaffSalary(staffId, newValue);
            element.innerHTML = Utils.formatCurrency(newValue);
            element.dataset.originalValue = newValue;
        };
        
        // Handle cancel on Escape
        const cancelEdit = () => {
            element.innerHTML = originalContent;
        };
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveSalary();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
            }
        });
        
        input.addEventListener('blur', saveSalary);
    }

    updateStaffSalary(staffId, newSalary) {
        const state = this.app.getState();
        const staffMember = state.staff.find(s => s.id === staffId);
        
        if (staffMember) {
            staffMember.salary = newSalary;
            this.app.saveState();
            this.app.showToast(`Salary updated for ${staffMember.name}: ${Utils.formatCurrency(newSalary)}`, 'success');
        }
    }
}
