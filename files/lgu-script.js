// ===================================
// LGU Portal - Complete JavaScript with Registration
// ===================================

// Authentication State
const AuthState = {
    isAuthenticated: false,
    currentUser: null,
    currentUserData: null,
    users: []
};

// ===================================
// Role Helper
// ===================================
function isAdmin() {
    return AuthState.currentUserData && AuthState.currentUserData.role === 'Administrator';
}

function isStaff() {
    return AuthState.currentUserData && AuthState.currentUserData.role !== 'Administrator';
}

// ===================================
// Initialize Default Users
// ===================================
function initializeDefaultUsers() {
    const storedUsers = localStorage.getItem('lguUsers');
    if (storedUsers) {
        try {
            AuthState.users = JSON.parse(storedUsers);
        } catch (e) {
            console.error('Error loading users');
            setDefaultUsers();
        }
    } else {
        setDefaultUsers();
    }
}

function setDefaultUsers() {
    AuthState.users = [
        { 
            username: 'admin', 
            password: 'admin123', 
            role: 'Administrator',
            fullName: 'System Administrator',
            email: 'admin@barangaydanao.gov.ph',
            position: 'System Admin',
            createdDate: new Date().toISOString(),
            status: 'Active'
        },
        { 
            username: 'staff', 
            password: 'staff123', 
            role: 'Staff',
            fullName: 'Staff Member',
            email: 'staff@barangaydanao.gov.ph',
            position: 'General Staff',
            createdDate: new Date().toISOString(),
            status: 'Active'
        }
    ];
    saveUsers();
}

function saveUsers() {
    localStorage.setItem('lguUsers', JSON.stringify(AuthState.users));
}

// ===================================
// Form Switching Functions
// ===================================
function showLoginForm() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('registerScreen').style.display = 'none';
    document.getElementById('registerForm').reset();
}

function showRegisterForm() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('registerScreen').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
}

// ===================================
// Authentication Functions
// ===================================
function initAuth() {
    // Initialize users
    initializeDefaultUsers();
    
    // Check if user is already logged in (from localStorage)
    const savedSession = localStorage.getItem('lguSession');
    if (savedSession) {
        try {
            const session = JSON.parse(savedSession);
            if (session.timestamp && Date.now() - session.timestamp < 24 * 60 * 60 * 1000) {
                // Session valid for 24 hours
                const user = AuthState.users.find(u => u.username === session.username);
                if (user) {
                    AuthState.isAuthenticated = true;
                    AuthState.currentUser = session.username;
                    AuthState.currentUserData = user;
                    showDashboard();
                    return;
                }
            }
        } catch (e) {
            console.error('Invalid session data');
        }
    }
    
    // Show login screen
    showLoginScreen();
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('registerScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('registerScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    
    // Update username display with role badge
    if (AuthState.currentUser) {
        const userElement = document.getElementById('currentUser');
        if (userElement) {
            userElement.textContent = AuthState.currentUser;
        }
    }

    // Apply role-based UI restrictions
    applyRoleRestrictions();
    
    // Show pending approvals badge
    updatePendingApprovalsBadge();
    
    // Initialize the app
    initializeApp();
}

// ===================================
// Apply Role-Based Access Control
// ===================================
function applyRoleRestrictions() {
    const admin = isAdmin();

    // Role badge in header
    const roleBadge = document.getElementById('roleBadge');
    if (roleBadge) {
        roleBadge.textContent = admin ? '🔑 Administrator' : '👁️ Staff (View Only)';
        roleBadge.style.background = admin ? '#8B1538' : '#2563eb';
        roleBadge.style.color = 'white';
        roleBadge.style.padding = '3px 12px';
        roleBadge.style.borderRadius = '12px';
        roleBadge.style.fontSize = '0.8em';
        roleBadge.style.fontWeight = '600';
        roleBadge.style.display = 'inline-block';
    }

    // Admin-only element IDs - hide from staff
    const adminOnlyIds = [
        'clearAllDataBtn',
        'exportBtnDashboard',
        'exportBtnManage',
        'exportBtnTrack',
        'usersTab',
    ];
    adminOnlyIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = admin ? '' : 'none';
    });

    // Staff notice banner
    const staffNotice = document.getElementById('staffNoticeBanner');
    if (staffNotice) {
        staffNotice.style.display = admin ? 'none' : 'flex';
    }
}

function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Validate credentials
    const user = AuthState.users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Check if account is pending approval
        if (user.status === 'Pending') {
            showLoginAlert('⏳ Your account is awaiting admin approval. Please wait for confirmation.', 'error');
            return;
        }
        // Check if account is rejected
        if (user.status === 'Rejected') {
            showLoginAlert('✗ Your account registration was not approved. Please contact the Barangay admin.', 'error');
            return;
        }
        AuthState.isAuthenticated = true;
        AuthState.currentUser = username;
        AuthState.currentUserData = user;
        
        // Save session if remember me is checked
        if (rememberMe) {
            localStorage.setItem('lguSession', JSON.stringify({
                username: username,
                timestamp: Date.now()
            }));
        }
        
        // Show success message
        showLoginAlert('✓ Login successful! Welcome, ' + username, 'success');
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
            showDashboard();
        }, 1000);
        
    } else {
        // Failed login
        showLoginAlert('✗ Invalid username or password. Please try again.', 'error');
    }
}

function handleRegister(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('regFullName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const role = document.getElementById('regRole').value;
    const position = document.getElementById('regPosition').value.trim();
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // Validation
    if (!agreeTerms) {
        showRegisterAlert('✗ You must agree to the terms and conditions', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showRegisterAlert('✗ Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showRegisterAlert('✗ Password must be at least 6 characters', 'error');
        return;
    }
    
    if (username.length < 4) {
        showRegisterAlert('✗ Username must be at least 4 characters', 'error');
        return;
    }
    
    // Check if username already exists
    if (AuthState.users.find(u => u.username === username)) {
        showRegisterAlert('✗ Username already exists. Please choose a different username.', 'error');
        return;
    }
    
    // Check if email already exists
    if (AuthState.users.find(u => u.email === email)) {
        showRegisterAlert('✗ Email already registered. Please use a different email.', 'error');
        return;
    }
    
    // Create new user — status Pending until admin approves
    const newUser = {
        username: username,
        password: password,
        fullName: fullName,
        email: email,
        role: role,
        position: position || 'N/A',
        createdDate: new Date().toISOString(),
        status: 'Pending'
    };
    
    // Add to users array
    AuthState.users.push(newUser);
    saveUsers();

    // Notify admin via badge
    updatePendingApprovalsBadge();
    
    // Show success message
    showRegisterAlert('✓ Registration submitted! Your account is awaiting admin approval. You will be able to login once approved.', 'success');
    
    // Redirect to login after delay
    setTimeout(() => {
        showLoginForm();
    }, 3000);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear session
        AuthState.isAuthenticated = false;
        AuthState.currentUser = null;
        AuthState.currentUserData = null;
        localStorage.removeItem('lguSession');
        
        // Reset forms
        document.getElementById('loginForm').reset();
        document.getElementById('registerForm').reset();
        
        // Show login screen
        showLoginScreen();
    }
}

function showLoginAlert(message, type) {
    const alertDiv = document.getElementById('loginAlert');
    if (type === 'success') {
        alertDiv.className = 'alert alert-success show';
        alertDiv.style.background = '#d1fae5';
        alertDiv.style.color = '#065f46';
        alertDiv.style.borderLeft = '4px solid #10b981';
    } else {
        alertDiv.className = 'alert show';
        alertDiv.style.background = '#fee2e2';
        alertDiv.style.color = '#991b1b';
        alertDiv.style.borderLeft = '4px solid #ef4444';
    }
    alertDiv.textContent = message;
    alertDiv.style.display = 'flex';
    alertDiv.style.padding = '16px 20px';
    alertDiv.style.borderRadius = '8px';
    alertDiv.style.marginBottom = '20px';
    alertDiv.style.fontWeight = '500';
    
    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 3000);
}

function showRegisterAlert(message, type) {
    const alertDiv = document.getElementById('registerAlert');
    if (type === 'success') {
        alertDiv.className = 'alert alert-success show';
        alertDiv.style.background = '#d1fae5';
        alertDiv.style.color = '#065f46';
        alertDiv.style.borderLeft = '4px solid #10b981';
    } else {
        alertDiv.className = 'alert show';
        alertDiv.style.background = '#fee2e2';
        alertDiv.style.color = '#991b1b';
        alertDiv.style.borderLeft = '4px solid #ef4444';
    }
    alertDiv.textContent = message;
    alertDiv.style.display = 'flex';
    alertDiv.style.padding = '16px 20px';
    alertDiv.style.borderRadius = '8px';
    alertDiv.style.marginBottom = '20px';
    alertDiv.style.fontWeight = '500';
    
    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 5000);
}

// ===================================
// Pending Approvals Badge
// ===================================
function updatePendingApprovalsBadge() {
    const pending = AuthState.users.filter(u => u.status === 'Pending').length;
    const badge = document.getElementById('pendingApprovalsBadge');
    const usersTab = document.getElementById('usersTab');
    if (badge) {
        badge.textContent = pending;
        badge.style.display = pending > 0 ? 'inline-flex' : 'none';
    }
    if (usersTab) {
        const existing = usersTab.querySelector('.tab-notif-dot');
        if (pending > 0 && !existing) {
            const dot = document.createElement('span');
            dot.className = 'tab-notif-dot';
            dot.textContent = pending;
            usersTab.appendChild(dot);
        } else if (pending === 0 && existing) {
            existing.remove();
        } else if (existing) {
            existing.textContent = pending;
        }
    }
}

// ===================================
// User Management Functions
// ===================================
function displayUsersList() {
    const container = document.getElementById('usersList');

    const pendingUsers = AuthState.users.filter(u => u.status === 'Pending');
    const activeUsers  = AuthState.users.filter(u => u.status === 'Active');
    const otherUsers   = AuthState.users.filter(u => u.status !== 'Pending' && u.status !== 'Active');

    let html = '';

    // ---- PENDING APPROVALS SECTION ----
    if (pendingUsers.length > 0) {
        html += `
        <div style="margin-bottom:28px;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
                <h3 style="color:#8B1538;font-size:1.1em;font-weight:700;">⏳ Pending Approvals</h3>
                <span style="background:#fee2e2;color:#8B1538;padding:3px 12px;border-radius:12px;font-size:12px;font-weight:700;">${pendingUsers.length} awaiting</span>
            </div>
            ${pendingUsers.map(user => `
            <div class="user-card" style="border-left-color:#f59e0b;background:linear-gradient(to right,#fffbeb,white);margin-bottom:14px;animation:fadeIn 0.4s;">
                <div class="user-avatar" style="background:linear-gradient(135deg,#f59e0b,#d97706);">${user.fullName.charAt(0)}</div>
                <div class="user-info">
                    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                        <div class="user-name">${user.fullName}</div>
                        <span style="background:#fef3c7;color:#d97706;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:700;letter-spacing:.3px;">⏳ PENDING</span>
                    </div>
                    <div class="user-username">@${user.username}</div>
                    <div class="user-meta">
                        <span class="user-stat">📧 ${user.email}</span>
                        <span class="user-stat">💼 ${user.position}</span>
                        <span class="user-stat">🎭 ${user.role}</span>
                        <span class="user-stat">📅 Applied: ${new Date(user.createdDate).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="user-actions" style="gap:8px;">
                    <button class="btn btn-success" style="padding:8px 16px;font-size:0.85em;display:flex;align-items:center;gap:5px;" onclick="approveUser('${user.username}')">
                        ✅ Approve
                    </button>
                    <button class="btn btn-danger" style="padding:8px 16px;font-size:0.85em;display:flex;align-items:center;gap:5px;" onclick="rejectUser('${user.username}')">
                        ✗ Reject
                    </button>
                </div>
            </div>`).join('')}
        </div>
        <hr style="border:none;border-top:2px solid #e5e7eb;margin-bottom:24px;">`;
    } else {
        html += `
        <div style="margin-bottom:20px;padding:14px 18px;background:#f0fdf4;border-radius:10px;border-left:4px solid #10b981;display:flex;align-items:center;gap:10px;">
            <span style="font-size:1.3em;">✅</span>
            <span style="color:#065f46;font-weight:600;font-size:0.9em;">No pending approvals — all accounts are up to date.</span>
        </div>`;
    }

    // ---- ACTIVE USERS SECTION ----
    if (activeUsers.length > 0 || otherUsers.length > 0) {
        html += `<div style="margin-bottom:12px;"><h3 style="color:#374151;font-size:1.05em;font-weight:700;margin-bottom:14px;">👥 Active Accounts (${activeUsers.length})</h3>`;
        html += [...activeUsers, ...otherUsers].map(user => {
            const statusColor = user.status === 'Active' ? '#10b981' : user.status === 'Rejected' ? '#ef4444' : '#f59e0b';
            const statusLabel = user.status === 'Active' ? '● Active' : user.status === 'Rejected' ? '✗ Rejected' : user.status;
            return `
            <div class="user-card" style="margin-bottom:12px;">
                <div class="user-avatar">${user.fullName.charAt(0)}</div>
                <div class="user-info">
                    <div class="user-name">${user.fullName}</div>
                    <div class="user-username">@${user.username}</div>
                    <div class="user-meta">
                        <span class="user-stat">📧 ${user.email}</span>
                        <span class="user-stat">💼 ${user.position}</span>
                        <span class="user-stat">📅 Joined: ${new Date(user.createdDate).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="user-actions">
                    <span class="badge-role badge-${user.role.toLowerCase().replace(/\s+/g,'-')}">${user.role}</span>
                    <small style="color:${statusColor};font-weight:600;">${statusLabel}</small>
                    ${isAdmin() && user.username !== 'admin' ? `
                    <button class="btn btn-danger" style="padding:5px 12px;font-size:0.8em;margin-top:6px;" onclick="deleteUser('${user.username}')">
                        🗑️ Delete
                    </button>` : ''}
                </div>
            </div>`;
        }).join('');
        html += '</div>';
    }

    if (AuthState.users.length === 0) {
        html = `<div class="empty-state"><div class="empty-state-icon">👥</div><p>No users registered yet</p></div>`;
    }

    container.innerHTML = html;
}

function approveUser(username) {
    const user = AuthState.users.find(u => u.username === username);
    if (!user) return;

    // Show confirmation modal
    showApprovalModal(user, 'approve');
}

function rejectUser(username) {
    const user = AuthState.users.find(u => u.username === username);
    if (!user) return;
    showApprovalModal(user, 'reject');
}

function showApprovalModal(user, action) {
    // Remove existing
    const existing = document.getElementById('approvalModal');
    if (existing) existing.remove();

    const isApprove = action === 'approve';
    const overlay = document.createElement('div');
    overlay.id = 'approvalModal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.2s;';

    overlay.innerHTML = `
    <div style="background:white;border-radius:16px;padding:36px;max-width:460px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3);animation:slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1);">
        <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:3em;margin-bottom:10px;">${isApprove ? '✅' : '✗'}</div>
            <h2 style="color:${isApprove ? '#065f46' : '#991b1b'};font-size:1.4em;font-weight:700;margin-bottom:6px;">
                ${isApprove ? 'Approve Account' : 'Reject Account'}
            </h2>
            <p style="color:#6b7280;font-size:0.9em;">
                ${isApprove ? 'This will grant the user access to log in.' : 'This will deny the user access to the portal.'}
            </p>
        </div>

        <!-- User Summary Card -->
        <div style="background:${isApprove ? '#f0fdf4' : '#fef2f2'};border:1px solid ${isApprove ? '#bbf7d0' : '#fecaca'};border-radius:10px;padding:16px;margin-bottom:22px;">
            <div style="display:flex;align-items:center;gap:14px;">
                <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#8B1538,#D4AF37);display:flex;align-items:center;justify-content:center;color:white;font-size:1.3em;font-weight:700;flex-shrink:0;">${user.fullName.charAt(0)}</div>
                <div>
                    <div style="font-weight:700;color:#1f2937;font-size:1em;">${user.fullName}</div>
                    <div style="color:#6b7280;font-size:0.85em;">@${user.username}</div>
                    <div style="margin-top:4px;display:flex;gap:8px;flex-wrap:wrap;">
                        <span style="font-size:11px;background:#e5e7eb;padding:2px 8px;border-radius:8px;color:#374151;font-weight:600;">${user.role}</span>
                        <span style="font-size:11px;background:#e5e7eb;padding:2px 8px;border-radius:8px;color:#374151;">📧 ${user.email}</span>
                    </div>
                </div>
            </div>
        </div>

        ${!isApprove ? `
        <div style="margin-bottom:20px;">
            <label style="display:block;font-weight:600;color:#374151;margin-bottom:6px;font-size:14px;">Reason for rejection (optional)</label>
            <textarea id="rejectReason" placeholder="e.g. Incomplete information, Not a recognized staff member..." style="width:100%;padding:10px 14px;border:2px solid #e5e7eb;border-radius:8px;font-size:14px;resize:vertical;min-height:80px;font-family:inherit;"></textarea>
        </div>` : ''}

        <div style="display:flex;gap:12px;">
            <button onclick="confirmApprovalAction('${user.username}','${action}')" style="flex:1;padding:12px;border:none;border-radius:8px;background:${isApprove ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#ef4444,#dc2626)'};color:white;font-size:15px;font-weight:700;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform=''">
                ${isApprove ? '✅ Yes, Approve' : '✗ Yes, Reject'}
            </button>
            <button onclick="closeApprovalModal()" style="flex:1;padding:12px;border:2px solid #e5e7eb;border-radius:8px;background:white;color:#374151;font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">
                Cancel
            </button>
        </div>
    </div>`;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeApprovalModal(); });
}

function closeApprovalModal() {
    const modal = document.getElementById('approvalModal');
    if (modal) modal.remove();
}

function confirmApprovalAction(username, action) {
    const user = AuthState.users.find(u => u.username === username);
    if (!user) return;

    const isApprove = action === 'approve';
    const reason = !isApprove ? (document.getElementById('rejectReason')?.value.trim() || '') : '';

    user.status     = isApprove ? 'Active' : 'Rejected';
    user.approvedBy = AuthState.currentUser;
    user.approvedDate = new Date().toISOString();
    if (reason) user.rejectReason = reason;

    saveUsers();
    closeApprovalModal();
    updatePendingApprovalsBadge();
    displayUsersList();

    // Toast notification
    const toast = document.createElement('div');
    toast.className = 'new-report-toast';
    toast.style.borderLeftColor = isApprove ? '#10b981' : '#ef4444';
    toast.innerHTML = (isApprove ? '✅' : '✗') + ' <span><strong>' + user.fullName + '</strong> has been ' + (isApprove ? 'approved and can now log in.' : 'rejected.') + '</span>';
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
}

window.approveUser = approveUser;
window.rejectUser = rejectUser;
window.closeApprovalModal = closeApprovalModal;
window.confirmApprovalAction = confirmApprovalAction;

function deleteUser(username) {
    if (!isAdmin()) {
        alert('⛔ Access Denied\n\nOnly Administrators can delete users.');
        return;
    }
    if (username === 'admin') {
        alert('Cannot delete the default admin account!');
        return;
    }
    if (confirm('Are you sure you want to delete user: ' + username + '?')) {
        AuthState.users = AuthState.users.filter(u => u.username !== username);
        saveUsers();
        updatePendingApprovalsBadge();
        displayUsersList();
        alert('User deleted successfully!');
    }
}
window.deleteUser = deleteUser;



// Application State Management
const AppState = {
    reports: [],
    reportCounter: 1,
    lguMap: null,
    markers: [],
    currentTab: 'track',
    db: null  // kept for compatibility (auto-poll guard)
};

// ===================================
// Firebase / Firestore Database Operations
// ===================================

async function waitForFirebase(maxAttempts = 30) {
    let attempts = 0;
    while (!window.db && attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 150));
        attempts++;
    }
    if (!window.db) throw new Error('Firebase not initialized. Check firebase-config.js');
    AppState.db = window.db; // keep guard compatible
}

async function loadReportsFromDB() {
    const { collection, getDocs } = window.FirebaseFirestore;
    const snapshot = await getDocs(collection(window.db, 'reports'));
    const reports = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return { ...data, firestoreId: docSnap.id, date: new Date(data.date) };
    });
    console.log(`Loaded ${reports.length} reports from Firestore`);
    return reports;
}

async function updateReportInDB(report) {
    const { doc, updateDoc } = window.FirebaseFirestore;
    if (!report.firestoreId) {
        console.error('Cannot update report: missing firestoreId', report);
        return;
    }
    const reportToSave = {
        ...report,
        date: report.date instanceof Date ? report.date.toISOString() : report.date
    };
    delete reportToSave.firestoreId; // don't store inside the document
    const docRef = doc(window.db, 'reports', report.firestoreId);
    await updateDoc(docRef, reportToSave);
    console.log('Report updated in Firestore:', report.firestoreId);
}

async function deleteAllReportsFromDB() {
    const { collection, getDocs, writeBatch, doc } = window.FirebaseFirestore;
    const snapshot = await getDocs(collection(window.db, 'reports'));
    const batch = writeBatch(window.db);
    snapshot.docs.forEach(docSnap => batch.delete(doc(window.db, 'reports', docSnap.id)));
    await batch.commit();
    console.log('All reports deleted from Firestore');
}

// ===================================
// Initialize Application
// ===================================
document.addEventListener('DOMContentLoaded', async function() {
    await initializeApp();
});

async function initializeApp() {
    try {
        await waitForFirebase();
        const savedReports = await loadReportsFromDB();
        AppState.reports = savedReports;
        
        // Seed known IDs so first refresh detects truly new ones
        savedReports.forEach(r => RefreshState.knownIds.add(r.id));

        console.log('LGU Portal initialized successfully (Firebase)');
        console.log('Loaded reports:', AppState.reports.length);
        
        updateHeaderStats();
        displayReports();
        startAutoPoll();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        AppState.reports = [];
        displayReports();
    }
}

// ===================================
// Update Header Statistics
// ===================================
function updateHeaderStats() {
    const total = AppState.reports.length;
    const resolved = AppState.reports.filter(r => r.status === 'Resolved').length;
    const active = total - resolved;
    
    document.getElementById('headerTotalReports').textContent = total;
    document.getElementById('headerActiveReports').textContent = active;
    document.getElementById('headerResolvedReports').textContent = resolved;
}

// ===================================
// Refresh Reports (check for new)
// ===================================
let RefreshState = {
    knownIds: new Set(),
    pollInterval: null,
    isRefreshing: false
};

async function refreshReports() {
    if (RefreshState.isRefreshing) return;
    RefreshState.isRefreshing = true;

    // Spin both buttons
    ['refreshBtn', 'refreshBtnPlain'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.add('spinning');
    });
    ['refreshIcon','refreshIconPlain'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '↻';
    });

    try {
        const freshReports = await loadReportsFromDB();
        const newReports = freshReports.filter(r => !RefreshState.knownIds.has(r.id));

        AppState.reports = freshReports;

        // Register all IDs now
        freshReports.forEach(r => RefreshState.knownIds.add(r.id));

        // Reset badge
        hideBadge();

        // Update all views
        updateHeaderStats();

        // Refresh whichever tab is active
        switch (AppState.currentTab) {
            case 'track':     displayReports();        break;
            case 'dashboard': updateDashboard(); if (AppState.lguMap) updateLGUMapMarkers(); break;
            case 'analytics': updateAnalytics();       break;
            case 'manage':    displayManageReports();  break;
        }

        // Highlight new cards + show toast
        if (newReports.length > 0) {
            showRefreshToast(newReports.length);
            setTimeout(() => {
                newReports.forEach(r => {
                    const card = document.querySelector('[data-report-id="' + r.id + '"]');
                    if (card) card.classList.add('new-report-highlight');
                });
            }, 200);
        } else {
            showRefreshToast(0);
        }

    } catch (e) {
        console.error('Refresh error:', e);
    }

    RefreshState.isRefreshing = false;
    ['refreshBtn','refreshBtnPlain'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.remove('spinning');
    });
}

function showRefreshToast(count) {
    // Remove existing toasts
    document.querySelectorAll('.new-report-toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = 'new-report-toast';
    if (count > 0) {
        toast.innerHTML = '✅ <span>' + count + ' new report' + (count > 1 ? 's' : '') + ' loaded!</span>';
        toast.style.borderLeftColor = '#10b981';
    } else {
        toast.innerHTML = '✓ <span>All reports are up to date</span>';
        toast.style.borderLeftColor = '#D4AF37';
    }
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3500);
}

function hideBadge() {
    const wrap = document.getElementById('newReportsBadgeWrap');
    const plain = document.getElementById('refreshBtnPlain');
    if (wrap) wrap.style.display = 'none';
    if (plain) plain.style.display = '';
}

function showBadge(count) {
    const wrap = document.getElementById('newReportsBadgeWrap');
    const plain = document.getElementById('refreshBtnPlain');
    const badge = document.getElementById('newReportsBadge');
    if (wrap)  { wrap.style.display = ''; }
    if (plain) { plain.style.display = 'none'; }
    if (badge) { badge.textContent = count > 9 ? '9+' : count; }
}

// Auto-poll every 30 seconds for new reports
function startAutoPoll() {
    if (RefreshState.pollInterval) clearInterval(RefreshState.pollInterval);
    RefreshState.pollInterval = setInterval(async () => {
        if (!AppState.db) return;
        try {
            const fresh = await loadReportsFromDB();
            const newOnes = fresh.filter(r => !RefreshState.knownIds.has(r.id));
            if (newOnes.length > 0) {
                showBadge(newOnes.length);
            }
        } catch(e) { /* silent */ }
    }, 30000);
}

window.refreshReports = refreshReports;

// ===================================
// Tab Navigation
// ===================================
function switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.closest('.nav-tab').classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    AppState.currentTab = tabName;
    
    switch(tabName) {
        case 'track':
            displayReports();
            break;
        case 'dashboard':
            updateDashboard();
            initializeLGUMap();
            break;
        case 'analytics':
            updateAnalytics();
            break;
        case 'manage':
            displayManageReports();
            break;
        case 'users':
            displayUsersList();
            updatePendingApprovalsBadge();
            break;
    }
}

// ===================================
// Display Reports (Track Tab)
// ===================================
function displayReports() {
    const reportsList = document.getElementById('reportsList');
    const searchQuery = document.getElementById('searchQuery').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;
    
    let filteredReports = AppState.reports.filter(report => {
        const matchesSearch = !searchQuery || 
            report.id.toLowerCase().includes(searchQuery) ||
            report.category.toLowerCase().includes(searchQuery) ||
            report.location.toLowerCase().includes(searchQuery);
        const matchesStatus = !statusFilter || report.status === statusFilter;
        const matchesCategory = !categoryFilter || report.category === categoryFilter;
        const matchesPriority = !priorityFilter || report.priority === priorityFilter;
        
        return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
    
    filteredReports.sort((a, b) => b.date - a.date);
    
    if (filteredReports.length === 0) {
        reportsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>No reports found</h3>
                <p>Try adjusting your filters or check back later</p>
            </div>
        `;
        return;
    }
    
    reportsList.innerHTML = filteredReports.map(report => `
        <div class="report-card priority-${report.priority.toLowerCase()}" data-report-id="${report.id}">
            <div class="report-header">
                <span class="report-id">${report.id}</span>
                <div class="report-badges">
                    <span class="badge badge-${report.status.toLowerCase().replace(' ', '-')}">${report.status}</span>
                    <span class="badge badge-${report.priority.toLowerCase()}">${report.priority}</span>
                </div>
            </div>
            <div class="report-category">${report.category}</div>
            <div class="report-description">${report.description}</div>
            <div class="report-meta">
                <span>📍 ${report.location}</span>
                <span>📅 ${formatDate(report.date)}</span>
                <span>👤 ${report.name}</span>
                <span>📞 ${report.contact}</span>
                ${report.responseTime ? `<span>⏱️ Response: ${report.responseTime} days</span>` : ''}
            </div>
            <div class="report-actions">
                <button class="btn btn-primary" onclick="printReport('${report.id}')">
                    <span>🖨️</span> Print Report
                </button>
            </div>
        </div>
    `).join('');
}

// ===================================
// Dashboard Updates
// ===================================
function updateDashboard() {
    const total = AppState.reports.length;
    const pending = AppState.reports.filter(r => r.status === 'Pending').length;
    const inProgress = AppState.reports.filter(r => r.status === 'In Progress').length;
    const resolved = AppState.reports.filter(r => r.status === 'Resolved').length;
    
    document.getElementById('dashTotalReports').textContent = total;
    document.getElementById('dashPendingCount').textContent = pending;
    document.getElementById('dashInProgressCount').textContent = inProgress;
    document.getElementById('dashResolvedCount').textContent = resolved;
    
    updateCategoryChart();
    updateRecentActivity();
}

// ===================================
// Initialize LGU Map
// ===================================
function initializeLGUMap() {
    if (AppState.lguMap) {
        updateLGUMapMarkers();
        return;
    }
    
    AppState.lguMap = L.map('lguMap').setView([9.796891, 123.906304], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(AppState.lguMap);
    
    const barangayBounds = [
        [9.790, 123.900],
        [9.790, 123.912],
        [9.804, 123.912],
        [9.804, 123.900]
    ];
    
    L.polygon(barangayBounds, {
        color: '#8B1538',
        fillOpacity: 0,
        weight: 2
    }).addTo(AppState.lguMap);
    
    updateLGUMapMarkers();
    
    setTimeout(() => {
        AppState.lguMap.invalidateSize();
    }, 100);
}

// ===================================
// Update LGU Map Markers
// ===================================
function updateLGUMapMarkers() {
    if (!AppState.lguMap) return;
    
    AppState.markers.forEach(marker => marker.remove());
    AppState.markers = [];
    
    AppState.reports.forEach(report => {
        if (report.coordinates) {
            const color = getMarkerColor(report);
            
            const marker = L.marker([report.coordinates.lat, report.coordinates.lng], {
                icon: L.icon({
                    iconUrl: color.url,
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).addTo(AppState.lguMap);
            
            marker.bindPopup(`
                <div class="popup-title">${report.id}</div>
                <div class="popup-content">
                    <strong>${report.category}</strong><br>
                    ${report.location}<br>
                    <span style="color: ${color.hex}; font-weight: bold;">${report.status}</span> - 
                    <span style="color: ${getPriorityColor(report.priority)};">${report.priority} Priority</span><br>
                    <small>${formatDate(report.date)}</small>
                </div>
            `);
            
            AppState.markers.push(marker);
        }
    });
}

// ===================================
// Get Marker Color
// ===================================
function getMarkerColor(report) {
    if (report.status === 'Resolved') {
        return {
            url: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
            hex: '#6b7280'
        };
    }
    
    switch(report.priority) {
        case 'High':
            return {
                url: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                hex: '#ef4444'
            };
        case 'Medium':
            return {
                url: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
                hex: '#f59e0b'
            };
        case 'Low':
            return {
                url: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                hex: '#10b981'
            };
        default:
            return {
                url: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                hex: '#2563eb'
            };
    }
}

function getPriorityColor(priority) {
    switch(priority) {
        case 'High': return '#ef4444';
        case 'Medium': return '#f59e0b';
        case 'Low': return '#10b981';
        default: return '#6b7280';
    }
}

// ===================================
// Update Category Chart
// ===================================
function updateCategoryChart() {
    const categoryChart = document.getElementById('categoryChart');
    
    const categories = {};
    AppState.reports.forEach(report => {
        categories[report.category] = (categories[report.category] || 0) + 1;
    });
    
    const total = AppState.reports.length;
    categoryChart.innerHTML = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => {
            const percentage = ((count / total) * 100).toFixed(1);
            return `
                <div class="chart-bar">
                    <div class="chart-bar-label">
                        <span>${category}</span>
                        <span class="chart-bar-value">${count} (${percentage}%)</span>
                    </div>
                    <div class="chart-bar-track">
                        <div class="chart-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }).join('');
}

// ===================================
// Update Recent Activity
// ===================================
function updateRecentActivity() {
    const recentActivity = document.getElementById('recentActivity');
    const recentReports = AppState.reports
        .sort((a, b) => b.date - a.date)
        .slice(0, 10);
    
    recentActivity.innerHTML = recentReports.map(report => `
        <div style="padding: 12px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong style="color: var(--primary-color);">${report.id}</strong> - 
                <span>${report.category}</span>
                <span style="margin-left: 10px; font-size: 0.9em; color: #6b7280;">📍 ${report.location}</span>
            </div>
            <span style="color: #6b7280; font-size: 0.9em;">${formatDate(report.date)}</span>
        </div>
    `).join('');
}

// ===================================
// Analytics Updates
// ===================================
function updateAnalytics() {
    const resolvedReports = AppState.reports.filter(r => r.status === 'Resolved' && r.responseTime);
    const avgTime = resolvedReports.length > 0
        ? (resolvedReports.reduce((sum, r) => sum + r.responseTime, 0) / resolvedReports.length).toFixed(1)
        : 'N/A';
    
    document.getElementById('avgResponseTime').textContent = avgTime !== 'N/A' ? `${avgTime} days` : avgTime;
    
    const resolutionRate = AppState.reports.length > 0
        ? ((AppState.reports.filter(r => r.status === 'Resolved').length / AppState.reports.length) * 100).toFixed(0)
        : 0;
    document.getElementById('resolutionRate').textContent = `${resolutionRate}%`;
    
    const uniqueReporters = new Set(AppState.reports.map(r => r.contact)).size;
    document.getElementById('activeUsers').textContent = uniqueReporters;
    
    const criticalIssues = AppState.reports.filter(r => r.priority === 'High' && r.status !== 'Resolved').length;
    document.getElementById('criticalIssues').textContent = criticalIssues;
    
    updatePriorityChart();
    updateLocationHotspots();
    renderCategoryChart(AnalyticsState.categoryChartType);
    renderStatusChart(AnalyticsState.statusChartType);
    renderTrendChart(AnalyticsState.trendChartType);
    populatePrintMonthSelect();
}

// ===================================
// Analytics Chart State
// ===================================
const AnalyticsState = {
    categoryChartType: 'bar',
    statusChartType: 'groupedBar',
    trendChartType: 'line',
    categoryChartInstance: null,
    statusChartInstance: null,
    trendChartInstance: null
};

// Category emoji + color mapping
const CATEGORY_META = {
    'Waste Management':        { emoji: '🗑️',  color: '#ef4444', light: 'rgba(239,68,68,0.15)' },
    'Infrastructure Damage':   { emoji: '🏗️',  color: '#f59e0b', light: 'rgba(245,158,11,0.15)' },
    'Environmental Violation': { emoji: '🌳',  color: '#10b981', light: 'rgba(16,185,129,0.15)' },
    'Public Safety':           { emoji: '🚨',  color: '#8B1538', light: 'rgba(139,21,56,0.15)' },
    'Water & Sanitation':      { emoji: '💧',  color: '#2563eb', light: 'rgba(37,99,235,0.15)' },
    'Street Lighting':         { emoji: '💡',  color: '#D4AF37', light: 'rgba(212,175,55,0.15)' },
    'Other':                   { emoji: '📋',  color: '#6b7280', light: 'rgba(107,114,128,0.15)' }
};

function getCategoryMeta(cat) {
    return CATEGORY_META[cat] || { emoji: '📋', color: '#6b7280', light: 'rgba(107,114,128,0.15)' };
}

// ===================================
// Category Chart
// ===================================
function switchCategoryChart(type) {
    AnalyticsState.categoryChartType = type;
    // Update active button
    document.querySelectorAll('#categorySwitcher .chart-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });
    renderCategoryChart(type);
}

function renderCategoryChart(type) {
    const canvas = document.getElementById('categoryChartCanvas');
    if (!canvas) return;

    const ALL_CATEGORIES = Object.keys(CATEGORY_META);
    const counts = {};
    ALL_CATEGORIES.forEach(c => counts[c] = 0);
    AppState.reports.forEach(r => {
        if (counts[r.category] !== undefined) counts[r.category]++;
        else counts['Other'] = (counts['Other'] || 0) + 1;
    });

    // Build sorted arrays
    const sorted = ALL_CATEGORIES
        .map(c => ({ cat: c, count: counts[c] }))
        .sort((a, b) => b.count - a.count);

    const labels = sorted.map(s => getCategoryMeta(s.cat).emoji + ' ' + s.cat);
    const data   = sorted.map(s => s.count);
    const colors = sorted.map(s => getCategoryMeta(s.cat).color);
    const lights = sorted.map(s => getCategoryMeta(s.cat).light);

    // Destroy previous
    if (AnalyticsState.categoryChartInstance) {
        AnalyticsState.categoryChartInstance.destroy();
        AnalyticsState.categoryChartInstance = null;
    }

    const ctx = canvas.getContext('2d');

    let chartType = type;
    let chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: ctx => ` ${ctx.parsed.y ?? ctx.parsed} reports`
                }
            }
        }
    };
    let chartData = {};

    if (type === 'bar') {
        chartType = 'bar';
        chartData = {
            labels,
            datasets: [{
                label: 'Reports',
                data,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false
            }]
        };
        chartOptions.indexAxis = 'x';
        chartOptions.scales = {
            y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f3f4f6' } },
            x: { ticks: { font: { size: 11 } } }
        };
    } else if (type === 'horizontalBar') {
        chartType = 'bar';
        chartData = {
            labels,
            datasets: [{
                label: 'Reports',
                data,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 2,
                borderRadius: 4
            }]
        };
        chartOptions.indexAxis = 'y';
        chartOptions.scales = {
            x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f3f4f6' } },
            y: { ticks: { font: { size: 11 } } }
        };
        chartOptions.plugins.tooltip.callbacks = { label: ctx => ` ${ctx.parsed.x} reports` };
    } else if (type === 'pie' || type === 'doughnut') {
        chartType = type;
        chartData = {
            labels,
            datasets: [{
                data,
                backgroundColor: colors,
                borderColor: '#ffffff',
                borderWidth: 3,
                hoverOffset: 8
            }]
        };
        chartOptions.plugins.legend = { display: true, position: 'bottom', labels: { padding: 15, font: { size: 12 } } };
        chartOptions.plugins.tooltip.callbacks = {
            label: ctx => ` ${ctx.label}: ${ctx.parsed} reports`
        };
        delete chartOptions.scales;
    } else if (type === 'polarArea') {
        chartType = 'polarArea';
        chartData = {
            labels,
            datasets: [{
                data,
                backgroundColor: colors.map(c => c + 'cc'),
                borderColor: colors,
                borderWidth: 2
            }]
        };
        chartOptions.plugins.legend = { display: true, position: 'bottom', labels: { padding: 15, font: { size: 12 } } };
        chartOptions.scales = { r: { beginAtZero: true, ticks: { stepSize: 1 } } };
        chartOptions.plugins.tooltip.callbacks = { label: ctx => ` ${ctx.label}: ${ctx.parsed.r} reports` };
    }

    AnalyticsState.categoryChartInstance = new Chart(ctx, {
        type: chartType,
        data: chartData,
        options: chartOptions
    });

    // Legend pills
    const legendEl = document.getElementById('categoryChartLegend');
    if (legendEl) {
        const total = data.reduce((a, b) => a + b, 0);
        legendEl.innerHTML = sorted.map(s => {
            const meta = getCategoryMeta(s.cat);
            const pct = total > 0 ? ((s.count / total) * 100).toFixed(1) : '0.0';
            return `<span class="cat-legend-pill">
                <span class="cat-legend-dot" style="background:${meta.color};"></span>
                ${meta.emoji} ${s.cat}: <strong>${s.count}</strong> <span style="color:#9ca3af;">(${pct}%)</span>
            </span>`;
        }).join('');
    }
}

// ===================================
// Status (Pending/Resolved) Chart
// ===================================
function switchStatusChart(type) {
    AnalyticsState.statusChartType = type;
    document.querySelectorAll('#statusSwitcher .chart-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });
    renderStatusChart(type);
}

function renderStatusChart(type) {
    const canvas = document.getElementById('statusChartCanvas');
    if (!canvas) return;

    const ALL_CATEGORIES = Object.keys(CATEGORY_META);
    const pending  = {};
    const inProg   = {};
    const resolved = {};
    ALL_CATEGORIES.forEach(c => { pending[c] = 0; inProg[c] = 0; resolved[c] = 0; });

    AppState.reports.forEach(r => {
        const cat = ALL_CATEGORIES.includes(r.category) ? r.category : 'Other';
        if (r.status === 'Pending')     pending[cat]++;
        else if (r.status === 'In Progress') inProg[cat]++;
        else if (r.status === 'Resolved')    resolved[cat]++;
    });

    const labels        = ALL_CATEGORIES.map(c => getCategoryMeta(c).emoji + ' ' + c);
    const pendingData   = ALL_CATEGORIES.map(c => pending[c]);
    const inProgData    = ALL_CATEGORIES.map(c => inProg[c]);
    const resolvedData  = ALL_CATEGORIES.map(c => resolved[c]);
    const catColors     = ALL_CATEGORIES.map(c => getCategoryMeta(c).color);

    const totalPending  = pendingData.reduce((a, b) => a + b, 0);
    const totalInProg   = inProgData.reduce((a, b) => a + b, 0);
    const totalResolved = resolvedData.reduce((a, b) => a + b, 0);
    const grandTotal    = totalPending + totalInProg + totalResolved;

    if (AnalyticsState.statusChartInstance) {
        AnalyticsState.statusChartInstance.destroy();
        AnalyticsState.statusChartInstance = null;
    }

    const ctx = canvas.getContext('2d');
    let chartConfig = {};

    const baseOpts = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'top', labels: { padding: 16, font: { size: 13, weight: '600' } } },
            tooltip: { mode: 'index', intersect: false }
        }
    };

    if (type === 'groupedBar') {
        chartConfig = {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: '🕐 Pending',     data: pendingData,  backgroundColor: '#f59e0b', borderColor: '#f59e0b', borderWidth: 2, borderRadius: 4 },
                    { label: '🔄 In Progress', data: inProgData,   backgroundColor: '#2563eb', borderColor: '#2563eb', borderWidth: 2, borderRadius: 4 },
                    { label: '✅ Resolved',    data: resolvedData, backgroundColor: '#10b981', borderColor: '#10b981', borderWidth: 2, borderRadius: 4 }
                ]
            },
            options: { ...baseOpts, scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f3f4f6' } },
                x: { ticks: { font: { size: 10 } } }
            }}
        };
    } else if (type === 'stackedBar') {
        chartConfig = {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: '🕐 Pending',     data: pendingData,  backgroundColor: '#f59e0b', borderRadius: 0 },
                    { label: '🔄 In Progress', data: inProgData,   backgroundColor: '#2563eb', borderRadius: 0 },
                    { label: '✅ Resolved',    data: resolvedData, backgroundColor: '#10b981', borderRadius: 0 }
                ]
            },
            options: { ...baseOpts, scales: {
                y: { beginAtZero: true, stacked: true, ticks: { stepSize: 1 }, grid: { color: '#f3f4f6' } },
                x: { stacked: true, ticks: { font: { size: 10 } } }
            }}
        };
    } else if (type === 'pie') {
        chartConfig = {
            type: 'pie',
            data: {
                labels: ['🕐 Pending', '🔄 In Progress', '✅ Resolved'],
                datasets: [{
                    data: [totalPending, totalInProg, totalResolved],
                    backgroundColor: ['#f59e0b', '#2563eb', '#10b981'],
                    borderColor: '#ffffff',
                    borderWidth: 3,
                    hoverOffset: 8
                }]
            },
            options: { ...baseOpts,
                plugins: { ...baseOpts.plugins, legend: { display: true, position: 'bottom' },
                    tooltip: { callbacks: { label: c => ` ${c.label}: ${c.parsed} reports` } }
                }
            }
        };
    } else if (type === 'doughnut') {
        chartConfig = {
            type: 'doughnut',
            data: {
                labels: ['🕐 Pending', '🔄 In Progress', '✅ Resolved'],
                datasets: [{
                    data: [totalPending, totalInProg, totalResolved],
                    backgroundColor: ['#f59e0b', '#2563eb', '#10b981'],
                    borderColor: '#ffffff',
                    borderWidth: 3,
                    hoverOffset: 8
                }]
            },
            options: { ...baseOpts,
                plugins: { ...baseOpts.plugins, legend: { display: true, position: 'bottom' },
                    tooltip: { callbacks: { label: c => ` ${c.label}: ${c.parsed} reports` } }
                }
            }
        };
    } else if (type === 'line') {
        chartConfig = {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { label: '🕐 Pending',     data: pendingData,  borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)',  tension: 0.4, fill: true, pointRadius: 5, pointHoverRadius: 7 },
                    { label: '🔄 In Progress', data: inProgData,   borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.1)',   tension: 0.4, fill: true, pointRadius: 5, pointHoverRadius: 7 },
                    { label: '✅ Resolved',    data: resolvedData, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)',  tension: 0.4, fill: true, pointRadius: 5, pointHoverRadius: 7 }
                ]
            },
            options: { ...baseOpts, scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f3f4f6' } },
                x: { ticks: { font: { size: 10 } } }
            }}
        };
    }

    AnalyticsState.statusChartInstance = new Chart(ctx, chartConfig);

    // Summary pills
    const summaryEl = document.getElementById('statusChartSummary');
    if (summaryEl) {
        const resRate = grandTotal > 0 ? ((totalResolved / grandTotal) * 100).toFixed(0) : 0;
        summaryEl.innerHTML = `
            <span class="status-summary-pill" style="background:#fef3c7; color:#92400e;">🕐 Pending: <strong style="margin-left:4px;">${totalPending}</strong></span>
            <span class="status-summary-pill" style="background:#dbeafe; color:#1e40af;">🔄 In Progress: <strong style="margin-left:4px;">${totalInProg}</strong></span>
            <span class="status-summary-pill" style="background:#d1fae5; color:#065f46;">✅ Resolved: <strong style="margin-left:4px;">${totalResolved}</strong></span>
            <span class="status-summary-pill" style="background:#f3f4f6; color:#374151;">📊 Resolution Rate: <strong style="margin-left:4px;">${resRate}%</strong></span>
        `;
    }
}

// Expose chart switchers globally
window.switchCategoryChart = switchCategoryChart;
window.switchStatusChart = switchStatusChart;
window.switchTrendChart = switchTrendChart;

// ===================================
// Monthly Trend Analysis — 8 months
// ===================================

// Build last-8-months labels based on current date
function getLast8Months() {
    const months = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
            year: d.getFullYear(),
            month: d.getMonth()   // 0-indexed
        });
    }
    return months;
}

// Sample baseline data per category per month (realistic Barangay-level numbers)
// Index 0 = 8 months ago, index 7 = current month
const TREND_SAMPLE = {
    'Waste Management':        [12, 15, 10, 18, 14, 20, 17, 22],
    'Infrastructure Damage':   [ 7,  9,  8, 11, 10, 13, 11, 15],
    'Environmental Violation': [ 3,  5,  4,  6,  5,  8,  6,  9],
    'Public Safety':           [ 5,  4,  6,  5,  7,  6,  8,  7],
    'Water & Sanitation':      [ 6,  8,  7,  9,  8, 10,  9, 11],
    'Street Lighting':         [ 4,  6,  5,  7,  6,  8,  7,  9],
    'Other':                   [ 2,  3,  2,  4,  3,  5,  4,  6]
};

// Merge real DB reports into the sample data
function buildTrendData() {
    const months = getLast8Months();
    const categories = Object.keys(CATEGORY_META);

    // Deep-copy sample
    const data = {};
    categories.forEach(c => { data[c] = [...TREND_SAMPLE[c]]; });

    // Add real reports from IndexedDB on top
    AppState.reports.forEach(r => {
        const rDate = r.date instanceof Date ? r.date : new Date(r.date);
        const idx = months.findIndex(m => m.year === rDate.getFullYear() && m.month === rDate.getMonth());
        if (idx === -1) return;
        const cat = categories.includes(r.category) ? r.category : 'Other';
        data[cat][idx]++;
    });

    // Total per month
    const totals = months.map((_, i) => categories.reduce((s, c) => s + data[c][i], 0));
    return { months, data, totals, categories };
}

function switchTrendChart(type) {
    AnalyticsState.trendChartType = type;
    document.querySelectorAll('#trendSwitcher .chart-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });
    renderTrendChart(type);
}

function renderTrendChart(type) {
    const canvas = document.getElementById('trendChartCanvas');
    if (!canvas) return;

    const { months, data, totals, categories } = buildTrendData();
    const labels = months.map(m => m.label);

    if (AnalyticsState.trendChartInstance) {
        AnalyticsState.trendChartInstance.destroy();
        AnalyticsState.trendChartInstance = null;
    }

    const ctx = canvas.getContext('2d');

    const baseOpts = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'top', labels: { padding: 14, font: { size: 12, weight: '600' }, boxWidth: 14 } },
            tooltip: { mode: 'index', intersect: false }
        },
        scales: {
            y: { beginAtZero: true, ticks: { stepSize: 5 }, grid: { color: '#f3f4f6' } },
            x: { grid: { display: false } }
        }
    };

    let chartConfig;

    if (type === 'line' || type === 'area') {
        const isFill = (type === 'area');
        chartConfig = {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: '📊 Total Reports',
                        data: totals,
                        borderColor: '#8B1538',
                        backgroundColor: isFill ? 'rgba(139,21,56,0.12)' : 'transparent',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: isFill,
                        pointRadius: 6,
                        pointHoverRadius: 9,
                        pointBackgroundColor: '#8B1538',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        yAxisID: 'y'
                    },
                    {
                        label: '✅ Resolved',
                        data: months.map((m, i) => {
                            // count resolved from sample (approx 60-75% of total)
                            const t = totals[i];
                            // use real resolved count if available, else estimate
                            const realResolved = AppState.reports.filter(r => {
                                const d = r.date instanceof Date ? r.date : new Date(r.date);
                                return d.getFullYear() === m.year && d.getMonth() === m.month && r.status === 'Resolved';
                            }).length;
                            return realResolved + Math.round(TREND_SAMPLE['Waste Management'][i] * 0.65);
                        }),
                        borderColor: '#10b981',
                        backgroundColor: isFill ? 'rgba(16,185,129,0.10)' : 'transparent',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: isFill,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        borderDash: [],
                        yAxisID: 'y'
                    },
                    {
                        label: '🕐 Pending',
                        data: months.map((m, i) => {
                            const realPending = AppState.reports.filter(r => {
                                const d = r.date instanceof Date ? r.date : new Date(r.date);
                                return d.getFullYear() === m.year && d.getMonth() === m.month && r.status === 'Pending';
                            }).length;
                            return realPending + Math.round(TREND_SAMPLE['Waste Management'][i] * 0.25);
                        }),
                        borderColor: '#f59e0b',
                        backgroundColor: isFill ? 'rgba(245,158,11,0.10)' : 'transparent',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: isFill,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        pointBackgroundColor: '#f59e0b',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        borderDash: [5, 3],
                        yAxisID: 'y'
                    }
                ]
            },
            options: baseOpts
        };

    } else if (type === 'bar') {
        chartConfig = {
            type: 'bar',
            data: {
                labels,
                datasets: categories.map(cat => ({
                    label: getCategoryMeta(cat).emoji + ' ' + cat,
                    data: data[cat],
                    backgroundColor: getCategoryMeta(cat).color,
                    borderRadius: 4,
                    borderSkipped: false
                }))
            },
            options: { ...baseOpts, plugins: { ...baseOpts.plugins }, scales: {
                y: { beginAtZero: true, ticks: { stepSize: 5 }, grid: { color: '#f3f4f6' } },
                x: { grid: { display: false } }
            }}
        };

    } else if (type === 'stackedBar') {
        chartConfig = {
            type: 'bar',
            data: {
                labels,
                datasets: categories.map(cat => ({
                    label: getCategoryMeta(cat).emoji + ' ' + cat,
                    data: data[cat],
                    backgroundColor: getCategoryMeta(cat).color,
                    borderRadius: 0
                }))
            },
            options: { ...baseOpts, scales: {
                y: { beginAtZero: true, stacked: true, ticks: { stepSize: 10 }, grid: { color: '#f3f4f6' } },
                x: { stacked: true, grid: { display: false } }
            }}
        };

    } else if (type === 'radar') {
        chartConfig = {
            type: 'radar',
            data: {
                labels,
                datasets: [
                    {
                        label: '📊 Total Reports',
                        data: totals,
                        borderColor: '#8B1538',
                        backgroundColor: 'rgba(139,21,56,0.15)',
                        borderWidth: 2,
                        pointRadius: 4
                    },
                    {
                        label: '🗑️ Waste Mgmt',
                        data: data['Waste Management'],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239,68,68,0.08)',
                        borderWidth: 2,
                        pointRadius: 3
                    },
                    {
                        label: '🏗️ Infrastructure',
                        data: data['Infrastructure Damage'],
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245,158,11,0.08)',
                        borderWidth: 2,
                        pointRadius: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top', labels: { padding: 14, font: { size: 12 } } }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: { stepSize: 10, font: { size: 10 } },
                        pointLabels: { font: { size: 11 } }
                    }
                }
            }
        };
    }

    AnalyticsState.trendChartInstance = new Chart(ctx, chartConfig);

    // Monthly summary mini-cards
    const summaryEl = document.getElementById('trendMonthlySummary');
    if (summaryEl) {
        const peak = Math.max(...totals);
        summaryEl.innerHTML = months.map((m, i) => {
            const isPeak = totals[i] === peak;
            return `<div style="text-align:center; padding:10px 8px; border-radius:10px; background:${isPeak ? 'linear-gradient(135deg,#8B1538,#D4AF37)' : '#f9fafb'}; border:1px solid ${isPeak ? 'transparent' : '#e5e7eb'};">
                <div style="font-size:0.78em; font-weight:600; color:${isPeak ? 'rgba(255,255,255,0.85)' : '#6b7280'}; text-transform:uppercase; letter-spacing:.5px;">${m.label}</div>
                <div style="font-size:1.6em; font-weight:700; color:${isPeak ? '#fff' : '#1f2937'}; line-height:1.2; margin:4px 0;">${totals[i]}</div>
                <div style="font-size:0.72em; color:${isPeak ? 'rgba(255,255,255,0.75)' : '#9ca3af'};">${isPeak ? '🏆 Peak' : 'reports'}</div>
            </div>`;
        }).join('');
    }
}

// ===================================
// Populate Print Month Selector
// ===================================
function populatePrintMonthSelect() {
    const select = document.getElementById('printMonthSelect');
    if (!select) return;

    const months = getLast8Months();
    select.innerHTML = '<option value="">-- Choose Month --</option>';
    months.forEach((m, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = m.label + ' (' + new Date(m.year, m.month).toLocaleString('default', { month: 'long', year: 'numeric' }) + ')';
        select.appendChild(opt);
    });

    // Preview on change
    select.addEventListener('change', function() {
        const preview = document.getElementById('printMonthPreview');
        if (!preview) return;
        if (this.value === '') {
            preview.innerHTML = 'Select a month above to preview the report count before printing.';
            preview.style.color = '#6b7280';
            return;
        }
        const idx = parseInt(this.value);
        const m = months[idx];
        const { data, totals, categories } = buildTrendData();
        const total = totals[idx];
        const catBreakdown = categories.map(c => {
            const meta = getCategoryMeta(c);
            return `<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:16px;background:#f3f4f6;font-size:13px;font-weight:600;">
                <span style="width:10px;height:10px;border-radius:50%;background:${meta.color};display:inline-block;"></span>
                ${meta.emoji} ${c}: <strong style="color:${meta.color};">${data[c][idx]}</strong>
            </span>`;
        }).join('');

        // Real DB reports for this month
        const realReports = AppState.reports.filter(r => {
            const d = r.date instanceof Date ? r.date : new Date(r.date);
            return d.getFullYear() === m.year && d.getMonth() === m.month;
        });

        preview.style.color = '#374151';
        preview.innerHTML = `
            <div style="margin-bottom:12px;">
                <strong style="font-size:1.1em; color:#8B1538;">📅 ${new Date(m.year, m.month).toLocaleString('default', { month: 'long', year: 'numeric' })}</strong>
                <span style="margin-left:12px; font-size:0.9em; color:#6b7280;">Total Reports: <strong style="color:#1f2937;">${total}</strong></span>
                ${realReports.length > 0 ? `<span style="margin-left:12px; font-size:0.85em; background:#d1fae5; color:#065f46; padding:2px 8px; border-radius:10px;">✅ ${realReports.length} real DB report(s)</span>` : ''}
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:8px;">${catBreakdown}</div>
        `;
    });
}

// ===================================
// Print Chart Card
// ===================================
function printChartCard(cardId, title) {
    const card = document.getElementById(cardId);
    if (!card) return;

    // Get chart canvas image
    let chartImgSrc = '';
    const canvas = card.querySelector('canvas');
    if (canvas) {
        chartImgSrc = canvas.toDataURL('image/png', 1.0);
    }

    // Get legend HTML (strip switcher buttons)
    const legendEl = card.querySelector('#categoryChartLegend, #statusChartSummary, #trendMonthlySummary');
    const legendHTML = legendEl ? legendEl.innerHTML : '';

    const now = new Date();
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title} — Barangay Danao</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 32px; color: #1f2937; }
        .print-header { display:flex; align-items:center; gap:20px; border-bottom: 3px solid #8B1538; padding-bottom:20px; margin-bottom:28px; }
        .print-header-text h1 { font-size:1.5em; color:#8B1538; font-weight:700; }
        .print-header-text p { color:#6b7280; font-size:0.9em; margin-top:4px; }
        .chart-title { font-size:1.25em; font-weight:700; color:#1f2937; margin-bottom:20px; padding: 10px 16px; background: linear-gradient(135deg, rgba(139,21,56,0.08), rgba(212,175,55,0.08)); border-left: 4px solid #8B1538; border-radius:4px; }
        .chart-img { width:100%; max-width:800px; display:block; margin:0 auto 24px; border:1px solid #e5e7eb; border-radius:8px; padding:12px; background:#fafafa; }
        .legend-area { display:flex; flex-wrap:wrap; gap:8px; margin-top:16px; padding-top:14px; border-top:1px solid #e5e7eb; }
        .legend-area span { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:16px; background:#f3f4f6; font-size:13px; font-weight:600; }
        .print-footer { margin-top:40px; padding-top:16px; border-top:1px solid #e5e7eb; color:#9ca3af; font-size:12px; display:flex; justify-content:space-between; }
        @media print { body { padding:16px; } button { display:none; } }
    </style>
</head>
<body>
    <div class="print-header">
        <div class="print-header-text">
            <h1>Barangay Danao — Analytics Report</h1>
            <p>Barangay Danao, Antequera, Bohol &nbsp;|&nbsp; Printed: ${now.toLocaleString()}</p>
        </div>
    </div>
    <div class="chart-title">📊 ${title}</div>
    ${chartImgSrc ? `<img class="chart-img" src="${chartImgSrc}" alt="${title} Chart">` : '<p style="color:#6b7280; text-align:center; padding:40px;">No chart image available</p>'}
    ${legendHTML ? `<div class="legend-area">${legendHTML}</div>` : ''}
    <div class="print-footer">
        <span>Barangay Danao Citizen Reporting Platform</span>
        <span>Page 1 of 1</span>
    </div>
    <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`);
    printWindow.document.close();
}

// ===================================
// Print Monthly Report (all reports for chosen month)
// ===================================
function printMonthlyReport() {
    const select = document.getElementById('printMonthSelect');
    if (!select || select.value === '') {
        alert('⚠️ Please select a month first.');
        return;
    }
    const idx = parseInt(select.value);
    const months = getLast8Months();
    const m = months[idx];
    const { data, totals, categories } = buildTrendData();

    // Real DB reports for this month
    const realReports = AppState.reports.filter(r => {
        const d = r.date instanceof Date ? r.date : new Date(r.date);
        return d.getFullYear() === m.year && d.getMonth() === m.month;
    });

    const monthLabel = new Date(m.year, m.month).toLocaleString('default', { month: 'long', year: 'numeric' });
    const now = new Date();

    // Category breakdown rows
    const catRows = categories.map(c => {
        const meta = getCategoryMeta(c);
        const count = data[c][idx];
        const pct = totals[idx] > 0 ? ((count / totals[idx]) * 100).toFixed(1) : '0.0';
        return `<tr>
            <td style="padding:10px 14px;">${meta.emoji} ${c}</td>
            <td style="padding:10px 14px; text-align:center; font-weight:700; color:${meta.color};">${count}</td>
            <td style="padding:10px 14px;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="flex:1; background:#f3f4f6; border-radius:4px; height:10px; overflow:hidden;">
                        <div style="width:${pct}%; background:${meta.color}; height:100%; border-radius:4px;"></div>
                    </div>
                    <span style="font-size:12px; color:#6b7280; min-width:40px;">${pct}%</span>
                </div>
            </td>
        </tr>`;
    }).join('');

    // Real report rows
    const reportRows = realReports.length > 0
        ? realReports.map(r => {
            const statusColor = r.status === 'Resolved' ? '#10b981' : r.status === 'In Progress' ? '#2563eb' : '#f59e0b';
            const prioColor = r.priority === 'High' ? '#ef4444' : r.priority === 'Medium' ? '#f59e0b' : '#10b981';
            return `<tr>
                <td style="padding:8px 12px; font-weight:600; color:#8B1538;">${r.id}</td>
                <td style="padding:8px 12px;">${r.name}</td>
                <td style="padding:8px 12px;">${r.category}</td>
                <td style="padding:8px 12px;">${r.location}</td>
                <td style="padding:8px 12px; text-align:center;"><span style="background:${statusColor}22; color:${statusColor}; padding:2px 8px; border-radius:10px; font-weight:600; font-size:12px;">${r.status}</span></td>
                <td style="padding:8px 12px; text-align:center;"><span style="background:${prioColor}22; color:${prioColor}; padding:2px 8px; border-radius:10px; font-weight:600; font-size:12px;">${r.priority}</span></td>
                <td style="padding:8px 12px; font-size:12px; color:#6b7280;">${r.date instanceof Date ? r.date.toLocaleDateString() : new Date(r.date).toLocaleDateString()}</td>
            </tr>`;
          }).join('')
        : `<tr><td colspan="7" style="text-align:center; padding:30px; color:#9ca3af;">No real-time reports recorded for this month (sample data shown in summary above)</td></tr>`;

    // Get chart images
    const chartImgs = [
        { canvas: document.getElementById('categoryChartCanvas'), title: 'Reports by Category' },
        { canvas: document.getElementById('statusChartCanvas'),   title: 'Pending vs Resolved' },
        { canvas: document.getElementById('trendChartCanvas'),    title: 'Monthly Trend' }
    ].filter(c => c.canvas).map(c => `
        <div style="margin-bottom:32px; break-inside:avoid;">
            <div style="font-weight:700; color:#8B1538; margin-bottom:10px; font-size:1em;">📊 ${c.title}</div>
            <img style="width:100%; border:1px solid #e5e7eb; border-radius:6px; padding:8px; background:#fafafa;" src="${c.canvas.toDataURL('image/png',1.0)}" alt="${c.title}">
        </div>`).join('');

    const pending   = realReports.filter(r => r.status === 'Pending').length;
    const inProg    = realReports.filter(r => r.status === 'In Progress').length;
    const resolved  = realReports.filter(r => r.status === 'Resolved').length;

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Monthly Report — ${monthLabel} — Barangay Danao</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding:32px; color:#1f2937; font-size:14px; }
        .print-header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:4px solid #8B1538; padding-bottom:20px; margin-bottom:28px; }
        .org-name { font-size:1.6em; font-weight:800; color:#8B1538; }
        .org-sub { color:#6b7280; font-size:0.9em; margin-top:4px; }
        .report-title { font-size:1.1em; color:#374151; font-weight:600; text-align:right; }
        .report-date { color:#9ca3af; font-size:0.85em; margin-top:4px; text-align:right; }
        .section-title { font-size:1.1em; font-weight:700; color:#8B1538; margin:28px 0 14px; padding:8px 14px; background:linear-gradient(135deg,rgba(139,21,56,0.07),rgba(212,175,55,0.07)); border-left:4px solid #8B1538; border-radius:4px; }
        .summary-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:24px; }
        .summary-box { text-align:center; padding:14px 10px; border-radius:10px; border:1px solid #e5e7eb; }
        .summary-box .val { font-size:2em; font-weight:800; }
        .summary-box .lbl { font-size:11px; text-transform:uppercase; letter-spacing:.5px; font-weight:600; color:#6b7280; margin-top:4px; }
        table { width:100%; border-collapse:collapse; margin-bottom:24px; }
        thead { background:linear-gradient(135deg,#8B1538,#D4AF37); color:white; }
        thead th { padding:10px 14px; text-align:left; font-size:13px; }
        tbody tr:nth-child(even) { background:#f9fafb; }
        tbody tr:hover { background:#fef3e6; }
        td { border-bottom:1px solid #f3f4f6; }
        .print-footer { margin-top:40px; padding-top:14px; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; color:#9ca3af; font-size:12px; }
        .page-break { page-break-before:always; }
        @media print { button { display:none; } .page-break { page-break-before:always; } }
    </style>
</head>
<body>
    <div class="print-header">
        <div>
            <div class="org-name">Barangay Danao</div>
            <div class="org-sub">Antequera, Bohol — Citizen Reporting Platform</div>
        </div>
        <div>
            <div class="report-title">📅 Monthly Report: ${monthLabel}</div>
            <div class="report-date">Printed: ${now.toLocaleString()}</div>
            <div class="report-date">Prepared by: ${window.AuthState?.currentUserData?.fullName || 'LGU Staff'}</div>
        </div>
    </div>

    <div class="section-title">📊 Monthly Summary — ${monthLabel}</div>
    <div class="summary-grid">
        <div class="summary-box" style="background:#fef3e6; border-color:#8B153844;">
            <div class="val" style="color:#8B1538;">${totals[idx]}</div>
            <div class="lbl">Total Reports</div>
        </div>
        <div class="summary-box" style="background:#fef3c7; border-color:#f59e0b44;">
            <div class="val" style="color:#f59e0b;">${pending}</div>
            <div class="lbl">Pending</div>
        </div>
        <div class="summary-box" style="background:#dbeafe; border-color:#2563eb44;">
            <div class="val" style="color:#2563eb;">${inProg}</div>
            <div class="lbl">In Progress</div>
        </div>
        <div class="summary-box" style="background:#d1fae5; border-color:#10b98144;">
            <div class="val" style="color:#10b981;">${resolved}</div>
            <div class="lbl">Resolved</div>
        </div>
    </div>

    <div class="section-title">📋 Reports by Category</div>
    <table>
        <thead><tr><th>Category</th><th style="text-align:center;">Count</th><th>Distribution</th></tr></thead>
        <tbody>${catRows}</tbody>
    </table>

    <div class="section-title">📝 Detailed Report List</div>
    <table>
        <thead>
            <tr>
                <th>Report ID</th><th>Name</th><th>Category</th><th>Location</th><th>Status</th><th>Priority</th><th>Date</th>
            </tr>
        </thead>
        <tbody>${reportRows}</tbody>
    </table>

    <div class="page-break"></div>
    <div class="section-title">📈 Analytics Charts — ${monthLabel}</div>
    ${chartImgs}

    <div class="print-footer">
        <span>Barangay Danao Citizen Reporting Platform — Confidential</span>
        <span>${monthLabel} Monthly Report</span>
    </div>
    <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`);
    printWindow.document.close();
}

// ===================================
// Print All Charts
// ===================================
function printAllChartsReport() {
    const now = new Date();
    const chartDefs = [
        { canvas: document.getElementById('categoryChartCanvas'), title: 'Reports by Category', legendId: 'categoryChartLegend' },
        { canvas: document.getElementById('statusChartCanvas'),   title: 'Pending vs Resolved by Category', legendId: 'statusChartSummary' },
        { canvas: document.getElementById('trendChartCanvas'),    title: 'Monthly Trend Analysis (8 Months)', legendId: 'trendMonthlySummary' }
    ];

    const chartSections = chartDefs.filter(c => c.canvas).map(c => {
        const imgSrc = c.canvas.toDataURL('image/png', 1.0);
        const legendEl = c.legendId ? document.getElementById(c.legendId) : null;
        const legendHTML = legendEl ? legendEl.innerHTML : '';
        return `
            <div style="break-inside:avoid; margin-bottom:40px;">
                <div style="font-size:1.1em; font-weight:700; color:#8B1538; padding:8px 14px; background:linear-gradient(135deg,rgba(139,21,56,0.07),rgba(212,175,55,0.07)); border-left:4px solid #8B1538; border-radius:4px; margin-bottom:16px;">📊 ${c.title}</div>
                <img style="width:100%; border:1px solid #e5e7eb; border-radius:8px; padding:10px; background:#fafafa;" src="${imgSrc}" alt="${c.title}">
                ${legendHTML ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid #f3f4f6;">${legendHTML}</div>` : ''}
            </div>`;
    }).join('<div style="page-break-after:always;"></div>');

    const total    = AppState.reports.length;
    const resolved = AppState.reports.filter(r => r.status === 'Resolved').length;
    const pending  = AppState.reports.filter(r => r.status === 'Pending').length;
    const high     = AppState.reports.filter(r => r.priority === 'High' && r.status !== 'Resolved').length;

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Analytics Report — Barangay Danao</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding:32px; color:#1f2937; }
        .print-header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:4px solid #8B1538; padding-bottom:20px; margin-bottom:28px; }
        .org-name { font-size:1.6em; font-weight:800; color:#8B1538; }
        .org-sub { color:#6b7280; font-size:0.9em; margin-top:4px; }
        .summary-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:28px; }
        .summary-box { text-align:center; padding:14px 10px; border-radius:10px; border:1px solid #e5e7eb; }
        .summary-box .val { font-size:2em; font-weight:800; }
        .summary-box .lbl { font-size:11px; text-transform:uppercase; letter-spacing:.5px; font-weight:600; color:#6b7280; margin-top:4px; }
        .print-footer { margin-top:40px; padding-top:14px; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; color:#9ca3af; font-size:12px; }
        @media print { button { display:none; } }
    </style>
</head>
<body>
    <div class="print-header">
        <div>
            <div class="org-name">Barangay Danao</div>
            <div class="org-sub">Antequera, Bohol — Analytics Report</div>
        </div>
        <div style="text-align:right;">
            <div style="font-size:1em; font-weight:600; color:#374151;">All Charts Summary</div>
            <div style="color:#9ca3af; font-size:0.85em; margin-top:4px;">Printed: ${now.toLocaleString()}</div>
        </div>
    </div>

    <div class="summary-grid">
        <div class="summary-box" style="background:#fef3e6; border-color:#8B153844;">
            <div class="val" style="color:#8B1538;">${total}</div>
            <div class="lbl">Total Reports</div>
        </div>
        <div class="summary-box" style="background:#fef3c7; border-color:#f59e0b44;">
            <div class="val" style="color:#f59e0b;">${pending}</div>
            <div class="lbl">Pending</div>
        </div>
        <div class="summary-box" style="background:#d1fae5; border-color:#10b98144;">
            <div class="val" style="color:#10b981;">${resolved}</div>
            <div class="lbl">Resolved</div>
        </div>
        <div class="summary-box" style="background:#fee2e2; border-color:#ef444444;">
            <div class="val" style="color:#ef4444;">${high}</div>
            <div class="lbl">Critical Issues</div>
        </div>
    </div>

    ${chartSections}

    <div class="print-footer">
        <span>Barangay Danao Citizen Reporting Platform — Confidential</span>
        <span>Analytics Report — ${now.toLocaleDateString()}</span>
    </div>
    <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`);
    printWindow.document.close();
}

window.printChartCard = printChartCard;
window.printMonthlyReport = printMonthlyReport;
window.printAllChartsReport = printAllChartsReport;
function updatePriorityChart() {
    const priorityChart = document.getElementById('priorityChart');
    
    const priorities = { High: 0, Medium: 0, Low: 0 };
    AppState.reports.forEach(report => {
        priorities[report.priority]++;
    });
    
    const total = AppState.reports.length;
    priorityChart.innerHTML = Object.entries(priorities).map(([priority, count]) => {
        const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
        const color = getPriorityColor(priority);
        
        return `
            <div class="chart-bar">
                <div class="chart-bar-label">
                    <span>${priority} Priority</span>
                    <span class="chart-bar-value">${count} (${percentage}%)</span>
                </div>
                <div class="chart-bar-track">
                    <div class="chart-bar-fill" style="width: ${percentage}%; background: ${color};"></div>
                </div>
            </div>
        `;
    }).join('');
}

// ===================================
// Update Location Hotspots
// ===================================
function updateLocationHotspots() {
    const locationHotspots = document.getElementById('locationHotspots');
    
    const locations = {};
    AppState.reports.forEach(report => {
        locations[report.location] = (locations[report.location] || 0) + 1;
    });
    
    const topLocations = Object.entries(locations)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    if (topLocations.length === 0) {
        locationHotspots.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 20px;">No location data available yet</p>';
        return;
    }
    
    locationHotspots.innerHTML = topLocations.map(([location, count], index) => `
        <div style="padding: 15px; margin-bottom: 10px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid var(--primary-color);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong style="font-size: 1.2em; color: var(--primary-color);">#${index + 1}</strong>
                    <span style="margin-left: 10px;">${location}</span>
                </div>
                <span style="font-size: 1.5em; font-weight: bold; color: var(--primary-color);">${count}</span>
            </div>
        </div>
    `).join('');
}

// ===================================
// Display Manage Reports
// ===================================
function displayManageReports() {
    const manageList = document.getElementById('manageReportsList');
    
    const sortedReports = [...AppState.reports].sort((a, b) => {
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        if (a.status !== 'Resolved' && b.status === 'Resolved') return -1;
        if (a.status === 'Resolved' && b.status !== 'Resolved') return 1;
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.date - a.date;
    });
    
    manageList.innerHTML = sortedReports.map((report) => {
        const isVerified = report.autoVerified || false;
        const requiresReview = report.requiresReview && !report.autoVerified;
        
        return `
        <div class="manage-report-card priority-${report.priority.toLowerCase()}" style="${report.priority === 'High' && !report.autoVerified ? 'border: 2px solid #ef4444;' : ''}">
            <div class="manage-report-header">
                <div>
                    <span class="report-id">${report.id}</span>
                    <div class="report-badges" style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;">
                        <span class="badge badge-${report.priority.toLowerCase()}">${report.priority}</span>
                        ${isVerified ? '<span class="badge" style="background: #d1fae5; color: #065f46;">✓ AUTO-VERIFIED</span>' : ''}
                        ${requiresReview ? '<span class="badge" style="background: #fef3c7; color: #92400e;">⚠️ NEEDS REVIEW</span>' : ''}
                    </div>
                    ${report.verificationReason ? `<div style="margin-top: 5px; font-size: 12px; color: #666;"><em>${report.verificationReason}</em></div>` : ''}
                </div>
                <span class="badge badge-${report.status.toLowerCase().replace(' ', '-')}">${report.status}</span>
            </div>
            <div class="manage-report-body">
                <div class="report-category">${report.category}</div>
                <div class="report-description">${report.description}</div>
                <div class="report-meta">
                    <span>📍 ${report.location}</span>
                    <span>📅 ${formatDate(report.date)}</span>
                    <span>👤 ${report.name}</span>
                </div>
            </div>
            <div class="manage-report-footer">
                ${isAdmin() ? `
                <div class="status-selector">
                    <select class="status-select" onchange="updateReportStatus('${report.id}', this.value)">
                        <option value="Pending" ${report.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="In Progress" ${report.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Resolved" ${report.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                </div>
                ` : `
                <div class="status-selector">
                    <span class="badge badge-${report.status.toLowerCase().replace(' ', '-')}" style="font-size:0.95em;padding:8px 16px;">${report.status}</span>
                    <small style="color:#6b7280;margin-left:6px;">🔒 View Only</small>
                </div>
                `}
                <div style="display:flex;gap:8px;">
                    <button class="btn btn-primary" onclick="viewReportDetails('${report.id}')">
                        View Details
                    </button>
                    <button class="btn btn-secondary" onclick="printReport('${report.id}')">
                        🖨️ Print
                    </button>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

// ===================================
// Update Report Status
// ===================================
async function updateReportStatus(reportId, newStatus) {
    if (!isAdmin()) {
        alert('⛔ Access Denied\n\nOnly Administrators can update report status.');
        // Revert the select back to current status
        displayManageReports();
        return;
    }
    const report = AppState.reports.find(r => r.id === reportId);
    if (!report) return;
    
    report.status = newStatus;
    
    if (newStatus === 'Resolved' && !report.responseTime) {
        const daysDiff = Math.floor((new Date() - report.date) / (1000 * 60 * 60 * 24));
        report.responseTime = daysDiff;
    }
    
    try {
        await updateReportInDB(report);
        console.log('Report status updated in database');
    } catch (error) {
        console.error('Error updating database:', error);
    }
    
    displayManageReports();
    updateDashboard();
    updateAnalytics();
    updateHeaderStats();
    
    if (AppState.lguMap) {
        updateLGUMapMarkers();
    }
    
    alert(`Report ${report.id} status updated to: ${newStatus}`);
}

// ===================================
// View Report Details
// ===================================
function viewReportDetails(reportId) {
    const report = AppState.reports.find(r => r.id === reportId);
    if (!report) return;
    
    alert(`
Report Details:
━━━━━━━━━━━━━━━
ID: ${report.id}
Name: ${report.name}
Contact: ${report.contact}
Email: ${report.email || 'N/A'}
Category: ${report.category}
Location: ${report.location}
Priority: ${report.priority}
Status: ${report.status}
Date: ${formatDate(report.date)}
Description: ${report.description}
${report.coordinates ? `Coordinates: ${report.coordinates.lat}, ${report.coordinates.lng}` : ''}
${report.responseTime ? `Response Time: ${report.responseTime} days` : ''}
    `);
}

// ===================================
// Print Report
// ===================================
function printReport(reportId) {
    const report = AppState.reports.find(r => r.id === reportId);
    if (!report) {
        alert('Report not found!');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Report - ${report.id}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: Arial, sans-serif;
                    padding: 40px;
                    color: #333;
                    line-height: 1.6;
                }
                
                .print-header {
                    text-align: center;
                    border-bottom: 3px solid #8B1538;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                
                .print-header h1 {
                    color: #8B1538;
                    font-size: 24px;
                    margin-bottom: 5px;
                }
                
                .print-header p {
                    color: #666;
                    font-size: 14px;
                }
                
                .report-id-section {
                    background: #f3f4f6;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 25px;
                    text-align: center;
                }
                
                .report-id-section h2 {
                    color: #8B1538;
                    font-size: 28px;
                    font-family: 'Courier New', monospace;
                }
                
                .status-priority {
                    display: flex;
                    gap: 20px;
                    justify-content: center;
                    margin-top: 10px;
                }
                
                .badge {
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: 12px;
                    text-transform: uppercase;
                }
                
                .badge-pending { background: #fef3c7; color: #92400e; }
                .badge-in-progress { background: #dbeafe; color: #1e40af; }
                .badge-resolved { background: #d1fae5; color: #065f46; }
                .badge-high { background: #fee2e2; color: #991b1b; }
                .badge-medium { background: #fef3c7; color: #92400e; }
                .badge-low { background: #d1fae5; color: #065f46; }
                
                .report-section {
                    margin-bottom: 25px;
                    page-break-inside: avoid;
                }
                
                .section-title {
                    font-size: 16px;
                    font-weight: bold;
                    color: #8B1538;
                    margin-bottom: 10px;
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 5px;
                }
                
                .info-grid {
                    display: grid;
                    grid-template-columns: 150px 1fr;
                    gap: 12px;
                    margin-bottom: 15px;
                }
                
                .info-label {
                    font-weight: bold;
                    color: #666;
                }
                
                .info-value {
                    color: #333;
                }
                
                .description-box {
                    background: #f9fafb;
                    padding: 15px;
                    border-left: 4px solid #8B1538;
                    border-radius: 4px;
                    margin-top: 10px;
                }
                
                .footer {
                    margin-top: 50px;
                    padding-top: 20px;
                    border-top: 2px solid #e5e7eb;
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                }
                
                @media print {
                    body {
                        padding: 20px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1>🏛️ CITIZEN REPORT</h1>
                <p>Barangay Danao, Antequera, Bohol</p>
            </div>
            
            <div class="report-id-section">
                <h2>${report.id}</h2>
                <div class="status-priority">
                    <span class="badge badge-${report.status.toLowerCase().replace(' ', '-')}">${report.status}</span>
                    <span class="badge badge-${report.priority.toLowerCase()}">${report.priority} Priority</span>
                </div>
            </div>
            
            <div class="report-section">
                <div class="section-title">📋 Report Information</div>
                <div class="info-grid">
                    <div class="info-label">Category:</div>
                    <div class="info-value">${report.category}</div>
                    
                    <div class="info-label">Date Submitted:</div>
                    <div class="info-value">${formatDate(report.date)}</div>
                    
                    <div class="info-label">Location:</div>
                    <div class="info-value">${report.location}</div>
                    
                    ${report.coordinates ? `
                    <div class="info-label">Coordinates:</div>
                    <div class="info-value">${report.coordinates.lat}, ${report.coordinates.lng}</div>
                    ` : ''}
                    
                    ${report.responseTime ? `
                    <div class="info-label">Response Time:</div>
                    <div class="info-value">${report.responseTime} days</div>
                    ` : ''}
                </div>
            </div>
            
            <div class="report-section">
                <div class="section-title">👤 Reporter Information</div>
                <div class="info-grid">
                    <div class="info-label">Name:</div>
                    <div class="info-value">${report.name}</div>
                    
                    <div class="info-label">Contact Number:</div>
                    <div class="info-value">${report.contact}</div>
                    
                    ${report.email ? `
                    <div class="info-label">Email:</div>
                    <div class="info-value">${report.email}</div>
                    ` : ''}
                </div>
            </div>
            
            <div class="report-section">
                <div class="section-title">📝 Issue Description</div>
                <div class="description-box">
                    ${report.description}
                </div>
            </div>
            
            <div class="footer">
                <p>This is an official report from the Barangay Danao Citizen Reporting Platform</p>
                <p>Printed on: ${new Date().toLocaleString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</p>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
}

// ===================================
// Export to Excel with Menu Options
// ===================================
function exportToExcel() {
    if (!isAdmin()) {
        alert('⛔ Access Denied\n\nOnly Administrators can export data.');
        return;
    }
    if (AppState.reports.length === 0) {
        alert('No reports to export!');
        return;
    }
    
    // Create modal for export options
    showExportMenu();
}

// Show Export Menu Modal
function showExportMenu() {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    // Count reports per category
    const categoryCounts = {
        'Waste Management': AppState.reports.filter(r => r.category === 'Waste Management').length,
        'Infrastructure Damage': AppState.reports.filter(r => r.category === 'Infrastructure Damage').length,
        'Environmental Violation': AppState.reports.filter(r => r.category === 'Environmental Violation').length,
        'Public Safety': AppState.reports.filter(r => r.category === 'Public Safety').length,
        'Water & Sanitation': AppState.reports.filter(r => r.category === 'Water & Sanitation').length,
        'Street Lighting': AppState.reports.filter(r => r.category === 'Street Lighting').length,
        'Other': AppState.reports.filter(r => r.category === 'Other').length
    };
    
    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;
    
    modal.innerHTML = `
        <div style="margin-bottom: 25px;">
            <h2 style="color: #8B1538; margin-bottom: 10px;">📊 Export Reports to Excel</h2>
            <p style="color: #666;">Choose which reports you want to export</p>
        </div>
        
        <div style="margin-bottom: 20px;">
            <button onclick="exportAllReports(); closeExportMenu();" 
                    style="width: 100%; padding: 15px; background: linear-gradient(135deg, #8B1538, #D4AF37); 
                           color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; 
                           cursor: pointer; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
                <span>📑 All Records</span>
                <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 14px;">
                    ${AppState.reports.length} reports
                </span>
            </button>
        </div>
        
        <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-bottom: 15px;">
            <h3 style="color: #8B1538; font-size: 16px; margin-bottom: 15px;">Export by Category:</h3>
        </div>
        
        <div style="display: grid; gap: 10px;">
            <button onclick="exportCategory('Waste Management'); closeExportMenu();" 
                    class="export-category-btn" ${categoryCounts['Waste Management'] === 0 ? 'disabled' : ''}>
                <span style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">🗑️</span>
                    <span>Waste Management</span>
                </span>
                <span class="count-badge">${categoryCounts['Waste Management']} reports</span>
            </button>
            
            <button onclick="exportCategory('Infrastructure Damage'); closeExportMenu();" 
                    class="export-category-btn" ${categoryCounts['Infrastructure Damage'] === 0 ? 'disabled' : ''}>
                <span style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">🏗️</span>
                    <span>Infrastructure Damage</span>
                </span>
                <span class="count-badge">${categoryCounts['Infrastructure Damage']} reports</span>
            </button>
            
            <button onclick="exportCategory('Environmental Violation'); closeExportMenu();" 
                    class="export-category-btn" ${categoryCounts['Environmental Violation'] === 0 ? 'disabled' : ''}>
                <span style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">🌳</span>
                    <span>Environmental Violation</span>
                </span>
                <span class="count-badge">${categoryCounts['Environmental Violation']} reports</span>
            </button>
            
            <button onclick="exportCategory('Public Safety'); closeExportMenu();" 
                    class="export-category-btn" ${categoryCounts['Public Safety'] === 0 ? 'disabled' : ''}>
                <span style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">🚨</span>
                    <span>Public Safety</span>
                </span>
                <span class="count-badge">${categoryCounts['Public Safety']} reports</span>
            </button>
            
            <button onclick="exportCategory('Water & Sanitation'); closeExportMenu();" 
                    class="export-category-btn" ${categoryCounts['Water & Sanitation'] === 0 ? 'disabled' : ''}>
                <span style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">💧</span>
                    <span>Water & Sanitation</span>
                </span>
                <span class="count-badge">${categoryCounts['Water & Sanitation']} reports</span>
            </button>
            
            <button onclick="exportCategory('Street Lighting'); closeExportMenu();" 
                    class="export-category-btn" ${categoryCounts['Street Lighting'] === 0 ? 'disabled' : ''}>
                <span style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">💡</span>
                    <span>Street Lighting</span>
                </span>
                <span class="count-badge">${categoryCounts['Street Lighting']} reports</span>
            </button>
            
            <button onclick="exportCategory('Other'); closeExportMenu();" 
                    class="export-category-btn" ${categoryCounts['Other'] === 0 ? 'disabled' : ''}>
                <span style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">📋</span>
                    <span>Other</span>
                </span>
                <span class="count-badge">${categoryCounts['Other']} reports</span>
            </button>
        </div>
        
        <div style="margin-top: 25px; text-align: center;">
            <button onclick="closeExportMenu();" 
                    style="padding: 12px 30px; background: #f3f4f6; color: #333; border: none; 
                           border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                Cancel
            </button>
        </div>
        
        <style>
            .export-category-btn {
                width: 100%;
                padding: 12px 15px;
                background: white;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: space-between;
                text-align: left;
            }
            
            .export-category-btn:hover:not(:disabled) {
                background: #f9fafb;
                border-color: #8B1538;
                transform: translateX(5px);
            }
            
            .export-category-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .count-badge {
                background: #8B1538;
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
            }
            
            .export-category-btn:disabled .count-badge {
                background: #9ca3af;
            }
        </style>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Store reference for closing
    window.exportMenuOverlay = overlay;
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeExportMenu();
        }
    });
}

// Close Export Menu
function closeExportMenu() {
    if (window.exportMenuOverlay) {
        document.body.removeChild(window.exportMenuOverlay);
        window.exportMenuOverlay = null;
    }
}

// Export all reports in one file
function exportAllReports() {
    const excelData = AppState.reports.map(report => ({
        'Report ID': report.id,
        'Date Submitted': formatDate(report.date),
        'Name': report.name,
        'Contact Number': report.contact,
        'Email': report.email || 'N/A',
        'Category': report.category,
        'Location': report.location,
        'Description': report.description,
        'Priority': report.priority,
        'Status': report.status,
        'Latitude': report.coordinates ? report.coordinates.lat : 'N/A',
        'Longitude': report.coordinates ? report.coordinates.lng : 'N/A',
        'Response Time (days)': report.responseTime || 'N/A'
    }));
    
    downloadCSV(excelData, `Barangay_Danao_All_Reports_${new Date().toISOString().split('T')[0]}.csv`);
    
    setTimeout(() => {
        alert(`✅ All Reports Exported!\n\nTotal: ${AppState.reports.length} reports\nFile: Barangay_Danao_All_Reports_${new Date().toISOString().split('T')[0]}.csv`);
    }, 100);
}

// Helper function to download CSV
function downloadCSV(data, filename) {
    const headers = Object.keys(data[0]);
    let csv = headers.join(',') + '\n';
    
    data.forEach(row => {
        const values = headers.map(header => {
            let value = row[header];
            if (typeof value === 'string') {
                value = value.replace(/"/g, '""');
                if (value.includes(',') || value.includes('\n')) {
                    value = `"${value}"`;
                }
            }
            return value;
        });
        csv += values.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Export specific category
function exportCategory(category) {
    const categoryReports = AppState.reports.filter(r => r.category === category);
    
    if (categoryReports.length === 0) {
        alert(`No reports found for ${category}!`);
        return;
    }
    
    const excelData = categoryReports.map(report => ({
        'Report ID': report.id,
        'Date Submitted': formatDate(report.date),
        'Name': report.name,
        'Contact Number': report.contact,
        'Email': report.email || 'N/A',
        'Location': report.location,
        'Description': report.description,
        'Priority': report.priority,
        'Status': report.status,
        'Latitude': report.coordinates ? report.coordinates.lat : 'N/A',
        'Longitude': report.coordinates ? report.coordinates.lng : 'N/A',
        'Response Time (days)': report.responseTime || 'N/A'
    }));
    
    const fileName = `Barangay_Danao_${category.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(excelData, fileName);
    
    setTimeout(() => {
        alert(`✅ ${category} Reports Exported!\n\nTotal: ${categoryReports.length} reports\nFile: ${fileName}`);
    }, 100);
}

// ===================================
// Clear All Data
// ===================================
async function clearAllData() {
    if (!isAdmin()) {
        alert('⛔ Access Denied\n\nOnly Administrators can clear data.');
        return;
    }
    if (!confirm('Are you sure you want to delete ALL reports? This action cannot be undone!')) {
        return;
    }
    
    if (!confirm('This will permanently delete all data from the database. Are you absolutely sure?')) {
        return;
    }
    
    try {
        await deleteAllReportsFromDB();
        AppState.reports = [];
        AppState.reportCounter = 1;
        
        displayReports();
        displayManageReports();
        updateDashboard();
        updateAnalytics();
        updateHeaderStats();
        
        if (AppState.lguMap) {
            updateLGUMapMarkers();
        }
        
        alert('All data has been cleared successfully!');
    } catch (error) {
        console.error('Error clearing data:', error);
        alert('Error clearing data. Please try again.');
    }
}

// ===================================
// Utility Functions
// ===================================
function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// ===================================
// Export for Global Access
// ===================================
window.switchTab = switchTab;
window.displayReports = displayReports;
window.updateDashboard = updateDashboard;
window.updateAnalytics = updateAnalytics;
window.displayManageReports = displayManageReports;
window.updateReportStatus = updateReportStatus;
window.viewReportDetails = viewReportDetails;
window.exportToExcel = exportToExcel;
window.exportAllReports = exportAllReports;
window.exportCategory = exportCategory;
window.closeExportMenu = closeExportMenu;
window.clearAllData = clearAllData;
window.printReport = printReport;
// Export authentication functions for global access
window.handleLogin = handleLogin;
window.logout = logout;

// ===================================
// Initialize Application
// ===================================
document.addEventListener('DOMContentLoaded', function() {
    // Set up login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Initialize authentication
    initAuth();
});
window.handleRegister = handleRegister;
window.showLoginForm = showLoginForm;
window.showRegisterForm = showRegisterForm;
window.displayUsersList = displayUsersList;

// Update initialization to include register form
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});