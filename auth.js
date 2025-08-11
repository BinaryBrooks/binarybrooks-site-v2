// BinaryBrooks Authentication Integration
// This file handles authentication for your existing site

const AUTH_CONFIG = {
  // Your Emergent authentication system endpoints
  backendUrl: 'https://b5f9e0ec-4903-45fe-ab0a-d5e93e8b0310.preview.emergentagent.com/api',
  emergentAuthUrl: 'https://auth.emergentagent.com/',
};

class BinaryBrooksAuth {
  constructor() {
    this.user = null;
    this.sessionToken = localStorage.getItem('bb_session_token');
    this.init();
  }

  async init() {
    // Check if user is authenticated on page load
    if (this.sessionToken) {
      await this.checkAuth();
    }
    this.updateUI();
    this.handleAuthCallback();
  }

  async checkAuth() {
    try {
      const response = await fetch(`${AUTH_CONFIG.backendUrl}/auth/user`, {
        headers: { Authorization: `Bearer ${this.sessionToken}` }
      });

      if (response.ok) {
        this.user = await response.json();
      } else {
        // Invalid token, clear it
        localStorage.removeItem('bb_session_token');
        this.sessionToken = null;
        this.user = null;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('bb_session_token');
      this.sessionToken = null;
      this.user = null;
    }
  }

  login() {
    const currentUrl = window.location.origin;
    const redirectUrl = encodeURIComponent(`${currentUrl}/auth-callback.html`);
    window.location.href = `${AUTH_CONFIG.emergentAuthUrl}?redirect=${redirectUrl}`;
  }

  async logout() {
    try {
      if (this.sessionToken) {
        await fetch(`${AUTH_CONFIG.backendUrl}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.sessionToken}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('bb_session_token');
      this.sessionToken = null;
      this.user = null;
      this.updateUI();
      // Redirect to home
      window.location.href = 'index.html';
    }
  }

  async handleAuthCallback() {
    // Check if we're on the auth callback page
    if (window.location.pathname.includes('auth-callback.html')) {
      const hash = window.location.hash;
      if (hash && hash.includes('session_id=')) {
        const sessionId = hash.split('session_id=')[1];
        
        try {
          const response = await fetch(`${AUTH_CONFIG.backendUrl}/auth/callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId })
          });

          const result = await response.json();
          
          if (result.success) {
            localStorage.setItem('bb_session_token', result.session_token);
            this.sessionToken = result.session_token;
            this.user = result.user;
            
            // Redirect to home page after successful login
            window.location.href = 'index.html';
          } else {
            console.error('Authentication failed');
            window.location.href = 'index.html';
          }
        } catch (error) {
          console.error('Auth callback error:', error);
          window.location.href = 'index.html';
        }
      }
    }
  }

  updateUI() {
    // Update navigation based on auth state
    const authContainer = document.getElementById('bb-auth-container');
    if (!authContainer) return;

    if (this.user) {
      // User is logged in - show profile link and logout
      authContainer.innerHTML = `
        <div class="flex items-center gap-3">
          <a href="profile.html" class="flex items-center gap-2 text-sm font-medium hover:text-primary">
            <img src="${this.user.picture}" alt="${this.user.name}" class="w-6 h-6 rounded-full">
            <span class="hidden sm:inline">${this.user.name}</span>
          </a>
          <button onclick="bbAuth.logout()" class="px-3 py-2 rounded-md bg-red-500 text-white text-sm hover:bg-red-600">
            Logout
          </button>
        </div>
      `;
    } else {
      // User is not logged in - show login/signup buttons
      authContainer.innerHTML = `
        <div class="flex items-center gap-3">
          <button onclick="bbAuth.login()" class="px-3 py-2 rounded-md border border-primary text-primary hover:bg-primary hover:text-white text-sm">
            Sign In
          </button>
          <button onclick="bbAuth.login()" class="px-3 py-2 rounded-md bg-primary text-white hover:bg-blue-600 text-sm">
            Sign Up
          </button>
        </div>
      `;
    }

    // Update mobile navigation
    const mobileAuthContainer = document.getElementById('bb-mobile-auth-container');
    if (mobileAuthContainer) {
      if (this.user) {
        mobileAuthContainer.innerHTML = `
          <a href="profile.html" class="py-2 flex items-center gap-2">
            <img src="${this.user.picture}" alt="${this.user.name}" class="w-5 h-5 rounded-full">
            Profile
          </a>
          <button onclick="bbAuth.logout()" class="py-2 text-red-600">Logout</button>
        `;
      } else {
        mobileAuthContainer.innerHTML = `
          <button onclick="bbAuth.login()" class="py-2">Sign In</button>
          <button onclick="bbAuth.login()" class="py-2 font-semibold text-primary">Sign Up</button>
        `;
      }
    }
  }

  // Helper method to check if user is authenticated
  isAuthenticated() {
    return this.user !== null;
  }

  // Get current user info
  getCurrentUser() {
    return this.user;
  }
}

// Initialize authentication when DOM is loaded
let bbAuth;
document.addEventListener('DOMContentLoaded', function() {
  bbAuth = new BinaryBrooksAuth();
});

// Make bbAuth globally available for onclick handlers
window.bbAuth = bbAuth;
