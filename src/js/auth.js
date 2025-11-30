/* ---------------------------------------------------------
   AUTHENTICATION SYSTEM
--------------------------------------------------------- */

const BASE_URL = "https://campus-coders-backend.onrender.com/api/v1";


/* --------------------- LOGIN --------------------- */

export async function login(username, password) {
  try {
    const res = await fetch(`${BASE_URL}/users/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("❌ Login Error:", error);
    return { success: false, message: "Network error. Please try again." };
  }
}

/* --------------------- REGISTER --------------------- */

export async function register(userData) {
  try {
    const res = await fetch(`${BASE_URL}/users/register`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("❌ Register Error:", error);
    return { success: false, message: "Network error. Please try again." };
  }
}

/* --------------------- CHECK AUTH STATUS (FIXED) --------------------- */

export async function checkAuthStatus() {
  try {
    const res = await fetch(`${BASE_URL}/users/getMyProfile`, {
      credentials: "include",
      // Add cache busting to prevent cached responses
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    console.log('🔐 Auth check status:', res.status);
    
    // If 401, DON'T refresh token - just return false
    if (res.status === 401) {
      console.log('🔐 User is not authenticated (401)');
      return false;
    }

    return res.ok;
  } catch (error) {
    console.error("❌ Auth Check Error:", error);
    return false;
  }
}

/* --------------------- REFRESH TOKEN --------------------- */

async function refreshToken() {
  try {
    const res = await fetch(`${BASE_URL}/users/refreshAcesstoken`, {
      credentials: "include"
    });
    
    if (!res.ok) {
      throw new Error('Token refresh failed');
    }
    
    return true;
  } catch (error) {
    console.error("❌ Token Refresh Error:", error);
    // Redirect to login if refresh fails
    window.location.href = "login.html";
    return false;
  }
}

/* --------------------- PROTECTED ROUTE CHECK --------------------- */

export async function requireAuth() {
  const isAuthenticated = await checkAuthStatus();
  
  if (!isAuthenticated) {
    // Clear any invalid cookies
    document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    // Redirect to login
    window.location.href = "login.html";
    return false;
  }
  
  return true;
}

/* --------------------- REDIRECT IF AUTHENTICATED --------------------- */

export async function redirectIfAuthenticated() {
  const isAuthenticated = await checkAuthStatus();
  
  if (isAuthenticated) {
    // Check if profile setup is completed
    try {
      const res = await fetch(`${BASE_URL}/users/getMyProfile`, {
        credentials: "include"
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.data.profileCompleted) {
          window.location.href = "feed.html";
        } else {
          window.location.href = "profile_setup.html";
        }
      }
    } catch (error) {
      console.error("❌ Profile check error:", error);
    }
  }
}

/* --------------------- LOGOUT (FIXED) --------------------- */

export async function logout() {
  try {
    console.log('🚀 Starting logout process...');
    
    // Set flag to prevent auto-redirect
    sessionStorage.setItem('just_logged_out', 'true');
    
    const response = await fetch(`${BASE_URL}/users/logout`, {
      method: "POST",
      credentials: "include"
    });
    
    console.log('📡 Logout API response status:', response.status);
    
  } catch (error) {
    console.error("❌ Logout API Error:", error);
  } finally {
    console.log('🧹 Cleaning up client-side data...');
    
    localStorage.clear();
    // Keep the logout flag in sessionStorage
    sessionStorage.setItem('just_logged_out', 'true');
    
    // Clear cookies
    document.cookie.split(";").forEach(cookie => {
      const name = cookie.split("=")[0].trim();
      document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    });
    
    console.log('✅ Redirecting to login...');
    window.location.replace("login.html");
  }
}
/* --------------------- PASSWORD VALIDATION --------------------- */

export function validatePassword(password) {
  const minLength = 6;
  
  if (password.length < minLength) {
    return {
      valid: false,
      message: `Password must be at least ${minLength} characters long`
    };
  }
  
  return { valid: true, message: "" };
}

/* --------------------- USERNAME VALIDATION --------------------- */

export function validateUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  const minLength = 3;
  const maxLength = 20;
  
  if (username.length < minLength || username.length > maxLength) {
    return {
      valid: false,
      message: `Username must be between ${minLength} and ${maxLength} characters`
    };
  }
  
  if (!usernameRegex.test(username)) {
    return {
      valid: false,
      message: "Username can only contain letters, numbers, and underscores"
    };
  }
  
  return { valid: true, message: "" };
}

/* --------------------- EMAIL VALIDATION --------------------- */

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      message: "Please enter a valid email address"
    };
  }
  
  return { valid: true, message: "" };
}