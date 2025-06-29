// Utility functions for the application
export class Utils {
    // Date formatting
    static formatDate(date, format = 'MM/DD/YYYY') {
        const d = new Date(date);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();

        switch (format) {
            case 'MM/DD/YYYY':
                return `${month}/${day}/${year}`;
            case 'DD/MM/YYYY':
                return `${day}/${month}/${year}`;
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            default:
                return d.toLocaleDateString();
        }
    }

    // Currency formatting
    static formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    // Number formatting
    static formatNumber(number, decimals = 0) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    }

    // Generate unique ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Validation
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validatePhone(phone) {
        const re = /^[\+]?[1-9][\d]{0,15}$/;
        return re.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    static validateRequired(value) {
        return value && value.toString().trim().length > 0;
    }

    // CSV handling
    static parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                data.push(row);
            }
        }

        return data;
    }

    static arrayToCSV(data, headers = null) {
        if (!data.length) return '';

        const csvHeaders = headers || Object.keys(data[0]);
        const csvRows = [csvHeaders.join(',')];

        data.forEach(row => {
            const values = csvHeaders.map(header => {
                const value = row[header] || '';
                return `"${value.toString().replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
        });

        return csvRows.join('\n');
    }

    // File download
    static downloadFile(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    // Date range calculations
    static getDateRange(period, date = new Date()) {
        const start = new Date(date);
        const end = new Date(date);

        switch (period) {
            case 'daily':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'weekly':
                const dayOfWeek = start.getDay();
                start.setDate(start.getDate() - dayOfWeek);
                start.setHours(0, 0, 0, 0);
                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;
            case 'monthly':
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                end.setMonth(end.getMonth() + 1);
                end.setDate(0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'yearly':
                start.setMonth(0, 1);
                start.setHours(0, 0, 0, 0);
                end.setMonth(11, 31);
                end.setHours(23, 59, 59, 999);
                break;
        }

        return { start, end };
    }

    // Get month info
    static getMonthInfo(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const monthName = firstDay.toLocaleDateString('en-US', { month: 'long' });

        return {
            year,
            month,
            monthName,
            daysInMonth,
            firstDay,
            lastDay
        };
    }

    // Color generation for charts
    static generateColors(count) {
        const colors = [
            '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
            '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
        ];

        if (count <= colors.length) {
            return colors.slice(0, count);
        }

        // Generate additional colors if needed
        const generatedColors = [...colors];
        for (let i = colors.length; i < count; i++) {
            const hue = (i * 137.508) % 360; // Golden angle approximation
            generatedColors.push(`hsl(${hue}, 70%, 50%)`);
        }

        return generatedColors;
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Deep clone object
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = Utils.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    // Sort array of objects
    static sortBy(array, key, direction = 'asc') {
        return [...array].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];

            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // Filter array of objects
    static filterBy(array, filters) {
        return array.filter(item => {
            return Object.keys(filters).every(key => {
                const filterValue = filters[key];
                const itemValue = item[key];

                if (filterValue === '' || filterValue === null || filterValue === undefined) {
                    return true;
                }

                if (typeof filterValue === 'string') {
                    return itemValue.toString().toLowerCase().includes(filterValue.toLowerCase());
                }

                return itemValue === filterValue;
            });
        });
    }

    // Calculate statistics
    static calculateStats(data) {
        if (!data.length) return { sum: 0, avg: 0, min: 0, max: 0, count: 0 };

        const numbers = data.filter(n => typeof n === 'number' && !isNaN(n));
        if (!numbers.length) return { sum: 0, avg: 0, min: 0, max: 0, count: 0 };

        const sum = numbers.reduce((acc, val) => acc + val, 0);
        const avg = sum / numbers.length;
        const min = Math.min(...numbers);
        const max = Math.max(...numbers);

        return {
            sum: Math.round(sum * 100) / 100,
            avg: Math.round(avg * 100) / 100,
            min,
            max,
            count: numbers.length
        };
    }

    // Responsive table helper
    static makeTableResponsive(tableElement) {
        const wrapper = document.createElement('div');
        wrapper.className = 'overflow-x-auto';
        tableElement.parentNode.insertBefore(wrapper, tableElement);
        wrapper.appendChild(tableElement);

        // Add min-width to table
        tableElement.style.minWidth = '600px';

        return wrapper;
    }

    // Local storage helpers
    static setLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    }

    static getLocalStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Failed to read from localStorage:', error);
            return defaultValue;
        }
    }
}
