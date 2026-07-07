// ===================================================================
// ScholarStream - Consolidated Core API & Utilities Module
// ===================================================================

const API_BASE = 'https://scholarstream-backend-04yg.onrender.com/api';

const ROLES = {
    USER: 'ROLE_USER',
    AUTHOR: 'ROLE_AUTHOR',
    REVIEWER: 'ROLE_REVIEWER',
    ADMIN: 'ROLE_ADMIN'
};

// --- Authentication Manager ---
const auth = {
    getToken() {
        return localStorage.getItem('ss_token');
    },

    getUser() {
        const userStr = localStorage.getItem('ss_user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    },

    saveAuth(token, user) {
        localStorage.setItem('ss_token', token);
        localStorage.setItem('ss_user', JSON.stringify(user));
    },

    clearAuth() {
        localStorage.removeItem('ss_token');
        localStorage.removeItem('ss_user');
        window.location.href = 'login.html';
    },

    isLoggedIn() {
        return !!this.getToken();
    },

    hasRole(role) {
        const user = this.getUser();
        if (!user || !user.roles) return false;
        return user.roles.includes(role);
    },

    getAuthHeaders() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
};

// --- Router Guards ---
const guard = {
    requireAuth() {
        if (!auth.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    requireRole(allowedRoles) {
        if (!this.requireAuth()) return false;
        
        const user = auth.getUser();
        if (!user || !user.roles) {
            window.location.href = 'login.html';
            return false;
        }

        const hasAccess = allowedRoles.some(role => user.roles.includes(role));
        if (!hasAccess) {
            window.location.href = 'dashboard.html?error=unauthorized';
            return false;
        }
        return true;
    },

    redirectIfLoggedIn() {
        if (auth.isLoggedIn()) {
            window.location.href = 'dashboard.html';
        }
    }
};

// --- Utilities ---
const utils = {
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    timeAgo(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) return interval + " years ago";
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) return interval + " months ago";
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) return interval + " days ago";
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) return interval + " hours ago";
        interval = Math.floor(seconds / 60);
        if (interval >= 1) return interval + " minutes ago";
        return "just now";
    },

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    },

    getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },

    showToast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = document.createElement('i');
        let iconName = 'info';
        if (type === 'success') iconName = 'check-circle';
        if (type === 'error') iconName = 'alert-triangle';
        icon.setAttribute('data-lucide', iconName);
        toast.appendChild(icon);

        const span = document.createElement('span');
        span.textContent = message;
        toast.appendChild(span);
        
        container.appendChild(toast);
        if (window.lucide) {
            lucide.createIcons();
        }

        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    createStatusBadgeElement(status) {
        const badge = document.createElement('span');
        const finalStatus = status || 'PENDING';
        badge.className = `badge badge-${finalStatus.toLowerCase()}`;
        badge.textContent = finalStatus;
        return badge;
    },

    createPaperCardElement(paper, isAuthorView = false) {
        const card = document.createElement('div');
        card.className = 'card paper-card';
        card.dataset.id = paper.id;

        // Card header
        const cardHeader = document.createElement('div');
        cardHeader.className = 'card-header';
        
        const badge = this.createStatusBadgeElement(paper.status);
        cardHeader.appendChild(badge);

        const category = document.createElement('span');
        category.className = 'paper-category';
        category.textContent = paper.category ? paper.category.name : 'Uncategorized';
        cardHeader.appendChild(category);
        
        card.appendChild(cardHeader);

        // Card body
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const title = document.createElement('h3');
        title.className = 'paper-title';
        title.textContent = paper.title;
        cardBody.appendChild(title);

        const author = document.createElement('p');
        author.className = 'paper-author';
        const authorName = paper.author ? paper.author.fullName : 'Unknown Author';
        author.textContent = `By ${authorName} | Published: ${this.formatDate(paper.uploadDate)}`;
        cardBody.appendChild(author);

        const abstract = document.createElement('p');
        abstract.className = 'paper-abstract';
        abstract.textContent = this.truncateText(paper.abstractText, 150);
        cardBody.appendChild(abstract);

        if (paper.keywords) {
            const keywords = document.createElement('div');
            keywords.className = 'paper-keywords';
            const strong = document.createElement('strong');
            strong.textContent = 'Keywords: ';
            keywords.appendChild(strong);
            
            const keywordsText = document.createTextNode(paper.keywords);
            keywords.appendChild(keywordsText);
            cardBody.appendChild(keywords);
        }

        card.appendChild(cardBody);

        // Card footer
        const cardFooter = document.createElement('div');
        cardFooter.className = 'card-footer';

        if (isAuthorView) {
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-primary btn-sm btn-edit-paper';
            editBtn.dataset.id = paper.id;
            
            const editIcon = document.createElement('i');
            editIcon.setAttribute('data-lucide', 'edit');
            editBtn.appendChild(editIcon);
            
            const editSpan = document.createElement('span');
            editSpan.textContent = ' Edit Info';
            editBtn.appendChild(editSpan);
            cardFooter.appendChild(editBtn);
        }

        const readBtn = document.createElement('a');
        readBtn.href = `paper-detail.html?id=${paper.id}`;
        readBtn.className = 'btn btn-outline btn-sm';
        readBtn.textContent = 'Read Details';
        cardFooter.appendChild(readBtn);

        card.appendChild(cardFooter);
        return card;
    }
};

// --- HTTP Fetch API Wrapper ---
const api = {
    async request(path, options = {}) {
        const url = `${API_BASE}${path}`;
        
        const headers = {
            ...auth.getAuthHeaders(),
            ...options.headers
        };

        if (!(options.body instanceof FormData) && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                auth.clearAuth();
                throw new Error('Session expired. Please log in again.');
            }

            if (options.isDownload) {
                if (!response.ok) throw new Error('File download failed');
                return response;
            }

            const contentType = response.headers.get('Content-Type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'An error occurred');
                }
                return data;
            } else {
                const text = await response.text();
                if (!response.ok) {
                    throw new Error(text || 'An error occurred');
                }
                try {
                    return JSON.parse(text);
                } catch (e) {
                    return text;
                }
            }
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // ================= AUTH ENDPOINTS =================
    loginUser(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    },

    registerUser(registerData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(registerData)
        });
    },

    // ================= PAPER ENDPOINTS =================
    getApprovedPapers() {
        return this.request('/papers');
    },

    getAllPapers() {
        return this.request('/papers/all');
    },

    searchPapers(query) {
        return this.request(`/papers/search/app?q=${encodeURIComponent(query)}`);
    },

    getPapersByCategory(categoryId) {
        return this.request(`/papers/category/${categoryId}`);
    },

    getAllCategories() {
        return this.request('/papers/category/all');
    },

    getPaperById(id) {
        return this.request(`/papers/${id}`);
    },

    async downloadPaper(id, title) {
        const response = await this.request(`/papers/download/${id}`, {
            method: 'GET',
            isDownload: true
        });
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${title || 'paper'}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
    },

    getStats() {
        return this.request('/papers/stats');
    },

    uploadPaper(formData) {
        return this.request('/papers/upload', {
            method: 'POST',
            body: formData
        });
    },

    createPaper(paperDTO) {
        return this.request('/papers', {
            method: 'POST',
            body: JSON.stringify(paperDTO)
        });
    },

    updatePaper(id, paperDTO) {
        return this.request(`/papers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(paperDTO)
        });
    },

    deletePaper(id) {
        return this.request(`/papers/${id}`, {
            method: 'DELETE'
        });
    },

    flagPaper(id, reason) {
        return this.request(`/papers/${id}/flag?reason=${encodeURIComponent(reason)}`, {
            method: 'POST'
        });
    },

    // ================= REVIEW ENDPOINTS =================
    getAllReviews() {
        return this.request('/reviews');
    },

    submitReview(review, paperId, reviewerId) {
        return this.request(`/reviews?paperId=${paperId}&reviewerId=${reviewerId}`, {
            method: 'POST',
            body: JSON.stringify(review)
        });
    },

    deleteReview(id) {
        return this.request(`/reviews/${id}`, {
            method: 'DELETE'
        });
    },

    // ================= BOOKMARK ENDPOINTS =================
    getBookmarks(userId) {
        return this.request(`/bookmarks?userId=${userId}`);
    },

    addBookmark(paperId, userId) {
        return this.request(`/bookmarks/${paperId}?userId=${userId}`, {
            method: 'POST'
        });
    },

    removeBookmark(id) {
        return this.request(`/bookmarks/${id}`, {
            method: 'DELETE'
        });
    },

    // ================= COMMENT ENDPOINTS =================
    getComments(paperId) {
        return this.request(`/comments/${paperId}`);
    },

    addComment(content, userId, paperId) {
        return this.request(`/comments?userId=${userId}&paperId=${paperId}`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    },

    deleteComment(id) {
        return this.request(`/comments/${id}`, {
            method: 'DELETE'
        });
    },

    // ================= ADMIN ENDPOINTS =================
    getAllUsers() {
        return this.request('/admin/users');
    },

    updatePaperStatus(id, status) {
        return this.request(`/admin/papers/${id}/status?status=${status}`, {
            method: 'PUT'
        });
    },

    getReports() {
        return this.request('/admin/reports');
    }
};

// --- Shared Navbar Logic ---
function setupNavbar() {
    const loggedIn = auth.isLoggedIn();
    const user = auth.getUser();
    
    // Toggle links based on login state
    const authOnly = document.querySelectorAll('.auth-only');
    const guestOnly = document.querySelectorAll('.guest-only');
    const authorOnly = document.querySelectorAll('.author-only');
    const reviewerOnly = document.querySelectorAll('.reviewer-only');
    const adminOnly = document.querySelectorAll('.admin-only');

    if (loggedIn) {
        authOnly.forEach(el => el.classList.remove('hidden'));
        guestOnly.forEach(el => el.classList.add('hidden'));
        
        if (auth.hasRole(ROLES.AUTHOR) || auth.hasRole(ROLES.ADMIN)) {
            authorOnly.forEach(el => el.classList.remove('hidden'));
        } else {
            authorOnly.forEach(el => el.classList.add('hidden'));
        }
        
        if (auth.hasRole(ROLES.REVIEWER) || auth.hasRole(ROLES.ADMIN)) {
            reviewerOnly.forEach(el => el.classList.remove('hidden'));
        } else {
            reviewerOnly.forEach(el => el.classList.add('hidden'));
        }
        
        if (auth.hasRole(ROLES.ADMIN)) {
            adminOnly.forEach(el => el.classList.remove('hidden'));
        } else {
            adminOnly.forEach(el => el.classList.add('hidden'));
        }

        // Setup user profile menu
        const menuWrapper = document.querySelector('.user-menu-wrapper');
        if (menuWrapper) {
            menuWrapper.classList.remove('hidden');
            const avatar = menuWrapper.querySelector('.user-avatar');
            const nameSpan = menuWrapper.querySelector('.user-name');
            if (avatar) avatar.textContent = user.username.charAt(0).toUpperCase();
            if (nameSpan) nameSpan.textContent = user.username;
            
            // Fill dropdown info
            const fullName = menuWrapper.querySelector('.dropdown-fullname');
            const email = menuWrapper.querySelector('.dropdown-email');
            const roleBadge = menuWrapper.querySelector('.dropdown-header .badge');
            if (fullName) fullName.textContent = user.fullName || user.username;
            if (email) email.textContent = user.email;
            if (roleBadge) roleBadge.textContent = user.roles[0].replace('ROLE_', '');
        }
    } else {
        authOnly.forEach(el => el.classList.add('hidden'));
        guestOnly.forEach(el => el.classList.remove('hidden'));
        authorOnly.forEach(el => el.classList.add('hidden'));
        reviewerOnly.forEach(el => el.classList.add('hidden'));
        adminOnly.forEach(el => el.classList.add('hidden'));
        
        const menuWrapper = document.querySelector('.user-menu-wrapper');
        if (menuWrapper) menuWrapper.classList.add('hidden');
    }

    // Bind logout events
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.clearAuth();
        });
    }

    // Dropdown toggle
    const userMenuBtn = document.querySelector('.user-menu-btn');
    const userDropdown = document.querySelector('.user-dropdown');
    if (userMenuBtn && userDropdown) {
        // Remove older event listeners by replacing the element
        const newBtn = userMenuBtn.cloneNode(true);
        userMenuBtn.parentNode.replaceChild(newBtn, userMenuBtn);
        
        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        
        document.addEventListener('click', () => {
            userDropdown.classList.remove('show');
        });
    }

    // Mobile Hamburger
    const hamburger = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        const newHamburger = hamburger.cloneNode(true);
        hamburger.parentNode.replaceChild(newHamburger, hamburger);
        newHamburger.addEventListener('click', () => {
            navLinks.classList.toggle('mobile-show');
        });
    }

    // Set active class link
    const path = window.location.pathname;
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (path.endsWith(href) || (href === 'index.html' && path.endsWith('/'))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });



    if (window.lucide) {
        lucide.createIcons();
    }
}

// Render dynamic elements on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    setupNavbar();
});
