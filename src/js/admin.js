const BASE_URL = 
  window.location.hostname.includes("localhost") ||
  window.location.hostname.includes("127.0.0.1")
    ? "http://localhost:8000/api/v1"
    : "https://campus-coders-backend.onrender.com/api/v1";


class AdminPanel {
    constructor() {
        this.currentAdmin = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.loadDashboard();
    }

    async checkAuth() {
        try {
            const response = await fetch(`${BASE_URL}/users/getMyProfile`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.data.role === 'admin') {
                    this.currentAdmin = data.data;
                    this.showAdminPanel();
                    this.loadAdminData();
                } else {
                    this.showLoginModal();
                }
            } else {
                this.showLoginModal();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showLoginModal();
        }
    }

    showLoginModal() {
        document.getElementById('loginModal').classList.add('active');
    }

    showAdminPanel() {
        document.getElementById('loginModal').classList.remove('active');
    }

    setupEventListeners() {
        // Login form
        document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Generate code buttons
        document.getElementById('generateCodeBtn').addEventListener('click', () => {
            this.generateInviteCode();
        });
        document.getElementById('generateCodeBtn2').addEventListener('click', () => {
            this.generateInviteCode();
        });

        // Copy code
        document.getElementById('copyCodeBtn').addEventListener('click', () => {
            this.copyToClipboard(document.getElementById('generatedCode').textContent);
        });

        // Close code modal
        document.getElementById('closeCodeModal').addEventListener('click', () => {
            document.getElementById('codeModal').classList.remove('active');
        });

        // User search
        document.getElementById('userSearch').addEventListener('input', (e) => {
            this.searchUsers(e.target.value);
        });
    }

    async handleLogin() {
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        const messageEl = document.getElementById('loginMessage');

        try {
            const response = await fetch(`${BASE_URL}/admin/login`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                this.currentAdmin = data.data.user;
                this.showAdminPanel();
                this.loadAdminData();
                messageEl.textContent = '';
            } else {
                messageEl.textContent = data.message || 'Login failed';
                messageEl.className = 'message error';
            }
        } catch (error) {
            messageEl.textContent = 'Network error. Please try again.';
            messageEl.className = 'message error';
        }
    }

    async handleLogout() {
        try {
            await fetch(`${BASE_URL}/admin/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear client-side data
            localStorage.clear();
            document.cookie.split(";").forEach(cookie => {
                const name = cookie.split("=")[0].trim();
                document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            });
            
            this.currentAdmin = null;
            this.showLoginModal();
        }
    }

    switchTab(tabName) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        // Update page title
        document.getElementById('pageTitle').textContent = 
            tabName.charAt(0).toUpperCase() + tabName.slice(1).replace('-', ' ');

        // Load tab-specific data
        switch(tabName) {
            case 'users':
                this.loadUsers();
                break;
            case 'invite-codes':
                this.loadInviteCodes();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
        }
    }

    async loadAdminData() {
        document.getElementById('adminName').textContent = this.currentAdmin.username;
        await this.loadDashboard();
    }

    async loadDashboard() {
        try {
            // Load stats
            const statsResponse = await fetch(`${BASE_URL}/admin/stats`, {
                credentials: 'include'
            });
            
            if (statsResponse.ok) {
                const stats = await statsResponse.json();
                this.updateDashboardStats(stats.data);
            }

            // Load recent activity
            this.loadRecentActivity();
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        }
    }

    updateDashboardStats(stats) {
        if (stats.totalUsers !== undefined) {
            document.getElementById('totalUsers').textContent = stats.totalUsers;
        }
        if (stats.activeCodes !== undefined) {
            document.getElementById('activeCodes').textContent = stats.activeCodes;
        }
        if (stats.usedCodes !== undefined) {
            document.getElementById('usedCodes').textContent = stats.usedCodes;
        }
        if (stats.newToday !== undefined) {
            document.getElementById('newToday').textContent = stats.newToday;
        }
    }

    async loadRecentActivity() {
        // This would typically come from your API
        const activities = [
            { action: 'New user registered', user: 'john_doe', time: '2 hours ago' },
            { action: 'Invite code used', user: 'jane_smith', time: '4 hours ago' },
            { action: 'New invite code generated', user: 'Admin', time: '6 hours ago' }
        ];

        const activityList = document.getElementById('recentActivity');
        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <strong>${activity.action}</strong> by ${activity.user}
                <span style="color: #9ca3af; float: right;">${activity.time}</span>
            </div>
        `).join('');
    }

    async loadUsers() {
        try {
            const response = await fetch(`${BASE_URL}/admin/users`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.renderUsersTable(data.data);
            } else {
                document.getElementById('usersTable').innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; color: #9ca3af;">
                            Failed to load users
                        </td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            document.getElementById('usersTable').innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #9ca3af;">
                        Error loading users
                    </td>
                </tr>
            `;
        }
    }

    renderUsersTable(users) {
        const tbody = document.getElementById('usersTable');
        
        if (!users || users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #9ca3af;">
                        No users found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>
                    <span class="role-badge ${user.role}">${user.role}</span>
                </td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    <span class="status-badge active">Active</span>
                </td>
                <td>
                    <button class="btn-secondary" onclick="admin.viewUser('${user._id}')">View</button>
                </td>
            </tr>
        `).join('');
    }

    async loadInviteCodes() {
        try {
            const response = await fetch(`${BASE_URL}/admin/invite-codes`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.renderCodesTable(data.data);
            }
        } catch (error) {
            console.error('Failed to load invite codes:', error);
        }
    }

    renderCodesTable(codes) {
        const tbody = document.getElementById('codesTable');
        
        if (!codes || codes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #9ca3af;">
                        No invite codes found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = codes.map(code => `
            <tr>
                <td><code>${code.code}</code></td>
                <td>${code.createdBy?.username || 'Unknown'}</td>
                <td>
                    <span class="status-badge ${code.isUsed ? 'used' : 'active'}">
                        ${code.isUsed ? 'Used' : 'Active'}
                    </span>
                </td>
                <td>${code.usedBy?.username || 'Not used'}</td>
                <td>${new Date(code.createdAt).toLocaleDateString()}</td>
                <td>
                    ${!code.isUsed ? `
                        <button class="btn-secondary" onclick="admin.copyCode('${code.code}')">Copy</button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    async generateInviteCode() {
        try {
            const response = await fetch(`${BASE_URL}/admin/generateCode`, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                document.getElementById('generatedCode').textContent = data.data.code;
                document.getElementById('codeModal').classList.add('active');
                
                // Refresh the codes table if we're on that tab
                if (document.getElementById('invite-codes').classList.contains('active')) {
                    this.loadInviteCodes();
                }
            } else {
                alert('Failed to generate invite code');
            }
        } catch (error) {
            console.error('Failed to generate invite code:', error);
            alert('Error generating invite code');
        }
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById('copyCodeBtn');
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        });
    }

    copyCode(code) {
        this.copyToClipboard(code);
    }

    searchUsers(query) {
        const rows = document.querySelectorAll('#usersTable tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
        });
    }

    viewUser(userId) {
        // Implement user detail view
        console.log('View user:', userId);
        alert(`View user details for ID: ${userId}`);
    }

    loadAnalytics() {
        // Placeholder for analytics charts
        console.log('Loading analytics...');
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new AdminPanel();
});