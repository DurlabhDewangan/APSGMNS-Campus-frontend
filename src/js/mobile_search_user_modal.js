/* ==================== CONFIGURATION ==================== */
const BASE_URL = "https://campus-coders-backend.onrender.com/api/v1";


/* ==================== DEBOUNCE FUNCTION ==================== */
function debounce(func, delay = 400) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(null, args), delay);
  };
}

/* ==================== MOBILE SEARCH FUNCTIONALITY ==================== */

// Open mobile search modal
function openSearchModal() {
  document.getElementById('searchModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  
  // Load random users when modal opens
  loadRandomUsersForMobile();
}

// Close mobile search modal
function closeSearchModal() {
  document.getElementById('searchModal').classList.add('hidden');
  document.body.style.overflow = 'auto';
  
  // Reset search
  document.getElementById('searchInputMobile').value = '';
  document.getElementById('searchResultsMobile').classList.add('hidden');
  document.getElementById('userListContainerMobile').classList.remove('hidden');
}

// Setup mobile search functionality
function setupMobileSearch() {
  const searchInput = document.getElementById('searchInputMobile');
  const searchResults = document.getElementById('searchResultsMobile');
  const userListContainer = document.getElementById('userListContainerMobile');

  if (searchInput) {
    searchInput.addEventListener('input', debounce(function(e) {
      const query = e.target.value.trim();
      
      if (query.length > 0) {
        searchMobileUsers(query);
      } else {
        searchResults.classList.add('hidden');
        userListContainer.classList.remove('hidden');
      }
    }, 300));
  }

  // Close modal events
  document.getElementById('closeSearchModal')?.addEventListener('click', closeSearchModal);
  document.getElementById('searchModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeSearchModal();
  });
}

// Search users for mobile
async function searchMobileUsers(query) {
  try {
    const response = await fetch(`${BASE_URL}/users/search?q=${encodeURIComponent(query)}&limit=20`, {
      method: "GET",
      credentials: "include"
    });

    if (response.ok) {
      const data = await response.json();
      const users = data.data?.users || data.users || [];
      displayMobileSearchResults(users);
    }
  } catch (error) {
    console.error('Mobile search error:', error);
  }
}

// Display mobile search results
function displayMobileSearchResults(users) {
  const searchResults = document.getElementById('searchResultsMobile');
  const userListContainer = document.getElementById('userListContainerMobile');

  if (users.length > 0) {
    searchResults.innerHTML = users.map(user => `
      <div onclick="gotoProfile('${user.username}')" class="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
        <img src="${user.avatar || 'http://res.cloudinary.com/dr6yn8cgn/image/upload/v1763871496/etjnhzbgfgtcqccv0uxm.jpg'}" 
             class="w-10 h-10 rounded-full border border-gray-600 object-cover">
        <div class="flex-1 min-w-0">
          <p class="text-white text-sm font-medium truncate">${user.fullName || user.username || 'Unknown User'}</p>
          <p class="text-gray-400 text-xs truncate">@${user.username}</p>
        </div>
      </div>
    `).join('');

    searchResults.classList.remove('hidden');
    userListContainer.classList.add('hidden');
  } else {
    searchResults.innerHTML = `
      <div class="text-center py-4">
        <p class="text-gray-400">No users found</p>
      </div>
    `;
    searchResults.classList.remove('hidden');
    userListContainer.classList.add('hidden');
  }
}

// Load random users for mobile
async function loadRandomUsersForMobile() {
  const userListContainer = document.getElementById('userListContainerMobile');
  
  try {
    const res = await fetch(`${BASE_URL}/users/getAllUser`, {
      credentials: "include"
    });

    const json = await res.json();
    
    if (!json.data?.users) {
      userListContainer.innerHTML = `<p class="text-gray-400 text-center text-sm">No users found.</p>`;
      return;
    }

    userListContainer.innerHTML = json.data.users
      .map(user => `
        <div onclick="gotoProfile('${user.username}')" 
          class="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
          <img src="${user.avatar}" class="w-10 h-10 rounded-full border border-gray-600 object-cover"/>
          <div class="flex-1 min-w-0">
            <p class="text-white text-sm font-medium truncate">${user.username}</p>
            <p class="text-gray-400 text-xs truncate">${user.fullName || ""}</p>
          </div>
        </div>`
      ).join("");
  } catch (err) {
    console.log("Error loading mobile users:", err);
    userListContainer.innerHTML = `<p class="text-red-400 text-center text-sm">Failed to load users</p>`;
  }
}

// Initialize mobile search when page loads
document.addEventListener('DOMContentLoaded', function() {
  setupMobileSearch();
  
  // Add click event to mobile search button
  document.getElementById('searchMobile')?.addEventListener('click', openSearchModal);
});

// Make functions available globally
window.openSearchModal = openSearchModal;
window.closeSearchModal = closeSearchModal;