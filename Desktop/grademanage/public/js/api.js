// API utility functions for the Student Grade Management System

class API {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('token');
    }

    // Get authentication headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const config = {
                headers: this.getHeaders(),
                ...options
            };

            console.log(`API Request: ${config.method || 'GET'} ${url}`);
            
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            
            // Handle authentication errors
            if (error.message.includes('401') || error.message.includes('token')) {
                this.logout();
                window.location.href = '/login.html';
                return;
            }
            
            throw error;
        }
    }

    // Authentication methods
    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (response.success) {
            this.token = response.token;
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
        }
        
        return response;
    }

    async register(userData) {
        return await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async getProfile() {
        return await this.request('/auth/me');
    }

    async updateProfile(profileData) {
        return await this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async changePassword(currentPassword, newPassword) {
        return await this.request('/auth/password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    }

    async getNotifications() {
        return await this.request('/auth/notifications');
    }

    async markNotificationRead(notificationId) {
        return await this.request(`/auth/notifications/${notificationId}/read`, {
            method: 'PUT'
        });
    }

    // Course methods
    async getCourses(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        const endpoint = queryString ? `/courses?${queryString}` : '/courses';
        return await this.request(endpoint);
    }

    async getMyCourses() {
        return await this.request('/courses/my');
    }

    async getCourse(courseId) {
        return await this.request(`/courses/${courseId}`);
    }

    async createCourse(courseData) {
        return await this.request('/courses', {
            method: 'POST',
            body: JSON.stringify(courseData)
        });
    }

    async updateCourse(courseId, courseData) {
        return await this.request(`/courses/${courseId}`, {
            method: 'PUT',
            body: JSON.stringify(courseData)
        });
    }

    async deleteCourse(courseId) {
        return await this.request(`/courses/${courseId}`, {
            method: 'DELETE'
        });
    }

    async enrollInCourse(courseId) {
        return await this.request(`/courses/${courseId}/enroll`, {
            method: 'POST'
        });
    }

    async dropFromCourse(courseId) {
        return await this.request(`/courses/${courseId}/drop`, {
            method: 'POST'
        });
    }

    async getCourseAnalytics(courseId) {
        return await this.request(`/courses/${courseId}/analytics`);
    }

    // Grade methods
    async getGrades(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        const endpoint = queryString ? `/grades?${queryString}` : '/grades';
        return await this.request(endpoint);
    }

    async getStudentGrades(studentId) {
        return await this.request(`/grades/student/${studentId}`);
    }

    async getCourseGrades(courseId) {
        return await this.request(`/grades/course/${courseId}`);
    }

    async createGrade(gradeData) {
        return await this.request('/grades', {
            method: 'POST',
            body: JSON.stringify(gradeData)
        });
    }

    async updateGrade(gradeId, gradeData) {
        return await this.request(`/grades/${gradeId}`, {
            method: 'PUT',
            body: JSON.stringify(gradeData)
        });
    }

    async deleteGrade(gradeId) {
        return await this.request(`/grades/${gradeId}`, {
            method: 'DELETE'
        });
    }

    async getStudentAnalytics(studentId) {
        return await this.request(`/grades/analytics/student/${studentId}`);
    }

    // Utility methods
    logout() {
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    isAuthenticated() {
        return !!this.token;
    }

    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    // Health check
    async healthCheck() {
        return await this.request('/health');
    }
}

// Utility functions
function showAlert(message, type = 'info', duration = 5000) {
    // Create alert element
    const alertId = 'alert-' + Date.now();
    const alertHTML = `
        <div id="${alertId}" class="fixed top-4 right-4 max-w-sm w-full bg-white border-l-4 border-${getAlertColor(type)}-500 rounded-lg shadow-lg p-4 z-50 transform translate-x-full transition-transform duration-300">
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <i class="fas ${getAlertIcon(type)} text-${getAlertColor(type)}-500"></i>
                </div>
                <div class="ml-3 w-0 flex-1">
                    <p class="text-sm font-medium text-gray-900">${message}</p>
                </div>
                <div class="ml-4 flex-shrink-0 flex">
                    <button class="inline-flex text-gray-400 hover:text-gray-600" onclick="dismissAlert('${alertId}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add to body
    document.body.insertAdjacentHTML('beforeend', alertHTML);
    
    // Show alert
    setTimeout(() => {
        const alert = document.getElementById(alertId);
        if (alert) {
            alert.classList.remove('translate-x-full');
        }
    }, 100);

    // Auto dismiss
    if (duration > 0) {
        setTimeout(() => {
            dismissAlert(alertId);
        }, duration);
    }
}

function dismissAlert(alertId) {
    const alert = document.getElementById(alertId);
    if (alert) {
        alert.classList.add('translate-x-full');
        setTimeout(() => {
            alert.remove();
        }, 300);
    }
}

function getAlertColor(type) {
    switch (type) {
        case 'success': return 'green';
        case 'error': return 'red';
        case 'warning': return 'yellow';
        default: return 'blue';
    }
}

function getAlertIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getLetterGradeColor(letterGrade) {
    switch (letterGrade) {
        case 'A+':
        case 'A':
        case 'A-':
            return 'text-green-600';
        case 'B+':
        case 'B':
        case 'B-':
            return 'text-blue-600';
        case 'C+':
        case 'C':
        case 'C-':
            return 'text-yellow-600';
        case 'D+':
        case 'D':
        case 'D-':
            return 'text-orange-600';
        case 'F':
            return 'text-red-600';
        default:
            return 'text-gray-600';
    }
}

function checkAuth() {
    const api = new API();
    if (!api.isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Loading utility
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="flex justify-center items-center p-8">
                <i class="fas fa-spinner fa-spin text-2xl text-blue-600"></i>
                <span class="ml-2 text-gray-600">Loading...</span>
            </div>
        `;
    }
}

function hideLoading() {
    // Remove loading states
    document.querySelectorAll('.fa-spinner').forEach(spinner => {
        spinner.classList.add('hidden');
    });
}

// Global API instance
window.api = new API();
window.showAlert = showAlert;
window.dismissAlert = dismissAlert;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.getLetterGradeColor = getLetterGradeColor;
window.checkAuth = checkAuth;
window.showLoading = showLoading;
window.hideLoading = hideLoading;