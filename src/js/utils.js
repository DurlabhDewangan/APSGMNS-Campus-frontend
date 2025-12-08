/* ---------------------------------------------------------
   UTILITY FUNCTIONS
--------------------------------------------------------- */
const BASE_URL = 
  window.location.hostname.includes("localhost") ||
  window.location.hostname.includes("127.0.0.1")
    ? "http://localhost:8000/api/v1"
    : "https://campus-coders-backend.onrender.com/api/v1";



/* --------------------- TOAST NOTIFICATIONS --------------------- */

export function showToast(message, type = "info") {
  // Remove existing toast if any
  const existingToast = document.getElementById("global-toast");
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast element
  const toast = document.createElement("div");
  toast.id = "global-toast";
  toast.className = `fixed top-5 right-5 px-6 py-3 rounded-xl shadow-lg z-50 transform transition-all duration-300 ${
    type === "error" ? "bg-red-500 text-white" :
    type === "success" ? "bg-green-500 text-white" :
    "bg-[#222] text-white"
  }`;
  
  toast.textContent = message;
  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.remove("transform", "translate-x-full");
  }, 10);

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.classList.add("opacity-0", "transform", "-translate-y-2");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

/* --------------------- LOADING STATES --------------------- */

export function setButtonLoading(button, isLoading, loadingText = "Loading...") {
  if (isLoading) {
    button.disabled = true;
    button.setAttribute("data-original-text", button.textContent);
    button.innerHTML = `
      <div class="flex items-center justify-center gap-2">
        <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        <span>${loadingText}</span>
      </div>
    `;
  } else {
    button.disabled = false;
    const originalText = button.getAttribute("data-original-text") || "Submit";
    button.textContent = originalText;
    button.removeAttribute("data-original-text");
  }
}

/* --------------------- FORM VALIDATION --------------------- */

export function validateForm(formData, rules) {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = formData[field];
    const rule = rules[field];
    
    if (rule.required && (!value || value.trim() === "")) {
      errors[field] = rule.required;
    } else if (rule.minLength && value.length < rule.minLength) {
      errors[field] = rule.minLengthMessage || `Must be at least ${rule.minLength} characters`;
    } else if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = rule.maxLengthMessage || `Must be less than ${rule.maxLength} characters`;
    } else if (rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.patternMessage || "Invalid format";
    } else if (rule.validate && !rule.validate(value)) {
      errors[field] = rule.validateMessage || "Invalid value";
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors: errors
  };
}

/* --------------------- API ERROR HANDLING --------------------- */

export function handleApiError(error) {
  console.error("API Error:", error);
  
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.message || "Something went wrong";
    
    switch (status) {
      case 401:
        showToast("Please login again", "error");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 2000);
        break;
      case 403:
        showToast("Access denied", "error");
        break;
      case 404:
        showToast("Resource not found", "error");
        break;
      case 500:
        showToast("Server error. Please try again later.", "error");
        break;
      default:
        showToast(message, "error");
    }
  } else if (error.request) {
    // Network error
    showToast("Network error. Please check your connection.", "error");
  } else {
    // Other error
    showToast("Something went wrong. Please try again.", "error");
  }
}

/* --------------------- DATE FORMATTING --------------------- */

export function formatDate(dateString, options = {}) {
  const date = new Date(dateString);
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

export function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(dateString, { month: 'short', day: 'numeric' });
}

/* --------------------- LOCAL STORAGE UTILITIES --------------------- */

export const storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Storage set error:", error);
    }
  },
  
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error("Storage get error:", error);
      return null;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Storage remove error:", error);
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Storage clear error:", error);
    }
  }
};

/* --------------------- DEBOUNCE --------------------- */

export function debounce(func, wait) {
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

/* --------------------- THROTTLE --------------------- */

export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/* --------------------- FILE UTILITIES --------------------- */

export function validateFile(file, options = {}) {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxWidth = 4096,
    maxHeight = 4096
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      message: `File size must be less than ${maxSize / 1024 / 1024}MB`
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: `File type must be: ${allowedTypes.join(', ')}`
    };
  }

  return { valid: true, message: "" };
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

/* --------------------- STRING UTILITIES --------------------- */

export function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/* --------------------- NUMBER UTILITIES --------------------- */

export function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/* --------------------- DOM UTILITIES --------------------- */

export function toggleElementVisibility(elementId, isVisible) {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.toggle('hidden', !isVisible);
  }
}

export function addClassToElement(elementId, className) {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.add(className);
  }
}

export function removeClassFromElement(elementId, className) {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.remove(className);
  }
}

/* --------------------- SCROLL UTILITIES --------------------- */

export function scrollToElement(elementId, behavior = 'smooth') {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior });
  }
}

export function isElementInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/* --------------------- URL UTILITIES --------------------- */

export function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

export function updateQueryParam(param, value) {
  const url = new URL(window.location);
  url.searchParams.set(param, value);
  window.history.replaceState({}, '', url);
}

/* --------------------- PERFORMANCE UTILITIES --------------------- */

export function lazyLoadImages() {
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
}

/* --------------------- PERFORMANCE OPTIMIZATIONS --------------------- */

// Debounced scroll handler for infinite scroll
let scrollTimeout;
export function setupInfiniteScroll(loadFunction, threshold = 300) {
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - threshold) {
        loadFunction();
      }
    }, 100);
  });
}

// Image optimization
export function optimizeImageLoad() {
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    // Add lazy loading
    img.loading = 'lazy';
    
    // Handle broken images
    img.addEventListener('error', function() {
      this.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
      this.alt = 'Image not available';
    });
  });
}

// Cache for API responses
const apiCache = new Map();
export async function cachedFetch(url, options = {}) {
  // Ensure credentials are always included for authentication cookies
  const finalOptions = {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  };

  const cacheKey = url + JSON.stringify(finalOptions);

  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }

  const response = await fetch(url, finalOptions);
  const data = await response.json();

  // Cache only successful responses
  if (response.ok) {
    apiCache.set(cacheKey, data);
    setTimeout(() => apiCache.delete(cacheKey), 30000);
  }

  return data;
}


// Initialize utilities when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  lazyLoadImages();
});

// Make functions available globally
window.showToast = showToast;
window.formatDate = formatDate;
window.getTimeAgo = getTimeAgo;