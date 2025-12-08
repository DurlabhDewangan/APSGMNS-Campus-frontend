/* ---------------------------------------------------------
   CONFIGURATION
--------------------------------------------------------- */

// ====== Utility: Debounce (Fix missing function) ======
function debounce(func, delay = 400) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(null, args), delay);
  };
}


const BASE_URL = 
  window.location.hostname.includes("localhost") ||
  window.location.hostname.includes("127.0.0.1")
    ? "http://localhost:8000/api/v1"
    : "https://campus-coders-backend.onrender.com/api/v1";


let nextCursor = null;
let loading = false;
let finished = false;

window.gotoProfile = function(username) {
  // redirect to profile page
  window.location.href = `../pages/profile.html?user=${username}`;
};


/* --------------------- USER PROFILE IN SIDEBAR --------------------- */

async function loadMyProfile() {
  const profileBox = document.getElementById("myProfile");

  try {
    const response = await fetch(`${BASE_URL}/users/getMyProfile`, { 
      credentials: "include" 
    });
    const { data: user } = await response.json();

    profileBox.innerHTML = `
      <img src="${user.avatar || 'http://res.cloudinary.com/dr6yn8cgn/image/upload/v1763871496/etjnhzbgfgtcqccv0uxm.jpg'}" 
           class="w-12 h-12 rounded-full object-cover border border-gray-600" />
      <div>
        <p class="text-white font-medium">${user.username || 'User'}</p>
        <p class="text-gray-400 text-sm">${user.fullName || 'Welcome!'}</p>
      </div>
    `;

  } catch (error) {
    console.error("Profile load error:", error);
    profileBox.innerHTML = `
      <div class="text-gray-400">Profile load failed</div>
    `;
  }
}

/* --------------------- RANDOM USERS IN SIDEBAR --------------------- */

async function loadRandomUsers() {
  try {
    const res = await fetch(`${BASE_URL}/users/getAllUser`, {
      credentials: "include"
    });

    const json = await res.json();
    
    if (!json.data || !json.data.users) {
      userListContainer.innerHTML = `<p class="text-gray-400 text-center text-sm">No users found.</p>`;
      return;
    }

    userListContainer.innerHTML = json.data.users
      .map(
        (user) => `
        <div onclick="gotoProfile('${user.username}')" 
          class="flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-800 cursor-pointer rounded-lg">
          <img src="${user.avatar}" class="w-10 h-10 rounded-full border"/>
          <div>
            <span class="text-white font-medium">${user.username}</span>
            <p class="text-xs text-gray-500">${user.fullName || ""}</p>
          </div>
        </div>`
      )
      .join("");
  } catch (err) {
    console.log("Error:", err);
    userListContainer.innerHTML = `<p class="text-red-400 text-center">⚠ Failed to load users</p>`;
  }
}

loadRandomUsers();


// Make available globally
window.loadRandomUsers = loadRandomUsers;


/* --------------------- SIDEBAR SEARCH FUNCTIONALITY --------------------- */

function setupSidebarSearch() {
  const searchInput = document.getElementById('sidebarSearchInput');
  const searchResults = document.getElementById('sidebarSearchResults');
  const userListContainer = document.getElementById('userListContainer');

  if (searchInput) {
    searchInput.addEventListener('input', debounce(function(e) {
      const query = e.target.value.trim();
      
      if (query.length > 0) {
        searchSidebarUsers(query);
      } else {
        searchResults.classList.add('hidden');
        userListContainer.classList.remove('hidden');
      }
    }, 300));
  }
}

async function searchSidebarUsers(query) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/users/search?q=${encodeURIComponent(query)}&limit=20`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
        method: "GET",
  credentials: "include"
    });



    if (response.ok) {
      const data = await response.json();
      const users = data.data?.users || data.users || [];
      displaySidebarSearchResults(users);
    }
  } catch (error) {
    console.error('Sidebar search error:', error);
  }
}

function displaySidebarSearchResults(users) {
  const searchResults = document.getElementById('sidebarSearchResults');
  const userListContainer = document.getElementById('userListContainer');

  if (users.length > 0) {
    searchResults.innerHTML = users.map(user => `
      <div class="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors" data-user-id="${user._id}">
        <img src="${user.avatar || 'http://res.cloudinary.com/dr6yn8cgn/image/upload/v1763871496/etjnhzbgfgtcqccv0uxm.jpg'}" 
             alt="${user.fullName || user.username}" 
             class="w-10 h-10 rounded-full border border-gray-600 object-cover">
        <div class="flex-1 min-w-0">
          <p class="text-white text-sm font-medium truncate">${user.fullName || user.username || 'Unknown User'}</p>
          <p class="text-gray-400 text-xs truncate">@${user.username}</p>
        </div>
        <button class="follow-btn text-blue-400 hover:text-blue-300 text-xs font-medium px-3 py-1 border border-blue-400 rounded-full hover:bg-blue-400 hover:text-white transition-colors" 
                data-user-id="${user._id}"
                onclick="toggleFollow('${user._id}', this)">
          Follow
        </button>
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


/* --------------------- TOAST FUNCTION --------------------- */

function showToast(message, type = "info") {
  // Simple toast notification
  const toast = document.createElement("div");
  toast.className = `fixed top-5 right-5 px-6 py-3 rounded-xl shadow-lg z-50 ${
    type === "error" ? "bg-red-500 text-white" :
    type === "success" ? "bg-green-500 text-white" :
    "bg-[#222] text-white"
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

/* --------------------- FOLLOW FUNCTIONALITY --------------------- */

async function toggleFollow(userId, button) {
  try {
    const token = localStorage.getItem('token');
    const isFollowing = button.textContent === 'Following';
    
   const response = await fetch(`${BASE_URL}/users/${userId}/follow`, {
  method: isFollowing ? 'DELETE' : 'POST',
  credentials: "include",   // <-- required
  headers: {
    'Content-Type': 'application/json'
  }
});


    if (response.ok) {
      if (isFollowing) {
        button.textContent = 'Follow';
        button.classList.remove('bg-blue-500', 'text-white');
        button.classList.add('text-blue-400', 'border-blue-400');
      
      } else {
        button.textContent = 'Following';
        button.classList.remove('text-blue-400', 'border-blue-400');
        button.classList.add('bg-blue-500', 'text-white', 'border-blue-500');
      
      }
    } else {
      throw new Error('Follow action failed');
    }
  } catch (error) {
    console.error('Follow error:', error);
  }
}


/* --------------------- LIKE FUNCTIONALITY --------------------- */

async function toggleLike(button) {
  const postId = button.dataset.postId;
  const wasLiked = button.dataset.liked === "true";

  // ---- 1️⃣ Optimistic UI update ----
  applyLikeUI(button, !wasLiked);

  try {
    // ---- 2️⃣ Call API ----
    const response = await fetch(
      `${BASE_URL}/post/${wasLiked ? "postUnlike" : "postLike"}/${postId}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    const data = await response.json();

    // ---- 3️⃣ If backend fails → revert UI ----
    if (!data.success) {
      applyLikeUI(button, wasLiked);
    }

  } catch (error) {
    console.error("Like error:", error);

    // ---- 4️⃣ On network failure → revert ----
    applyLikeUI(button, wasLiked);
  }
}

// -------------------------
// UI Update Helper Function
// -------------------------
function applyLikeUI(button, isLiked) {
  button.dataset.liked = isLiked.toString();

  // Add animation
  button.classList.add("like-anim");
  setTimeout(() => button.classList.remove("like-anim"), 250);

  if (isLiked) {
    // 👍 FILLED STATE
    button.innerHTML = `
      <svg width="35" height="35" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M2 21h4V9H2v12zM22 10.5c0-1.1-.9-2-2-2h-5.3l.8-3.6.1-.7
        c0-.3-.1-.7-.4-1L14 2l-5.6 5.6C8.1 8 8 8.5 8 9v10c0 1.1.9 2 
        2 2h8c.8 0 1.6-.5 1.9-1.2l2-6c.1-.3.1-.6.1-.8v-2.5z"/>
      </svg>
    `;
  } else {
    // 👍 OUTLINE STATE
    button.innerHTML = `
      <svg width="35" height="35" viewBox="0 0 24 24" fill="none"
        stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 9V5a2 2 0 0 0-2-2l-4 6v11h9a2 2 0 0 0 
        2-2l1.4-5a2 2 0 0 0-2-2H14z"/>
        <rect x="2" y="9" width="4" height="12" rx="1"/>
      </svg>
    `;
  }
}



/* --------------------- COMMENT FUNCTIONALITY --------------------- */

let currentPostId = null;

function openComments(postId, caption) {
  currentPostId = postId;
  document.getElementById("commentPostCaption").innerText = caption;
  document.getElementById("commentModal").classList.remove("hidden");
  loadComments();
}

async function loadComments() {
  try {
    const response = await fetch(`${BASE_URL}/post/getAllComments/${currentPostId}`, {
      credentials: "include"
    });

    const { data } = await response.json();
    const commentsBox = document.getElementById("commentsList");

    if (data.length === 0) {
      commentsBox.innerHTML = `<p class="text-gray-500 text-center">No comments yet.</p>`;
    } else {
 commentsBox.innerHTML = data.map(comment => `
  <div class="flex gap-3 mb-3">
    <img src="${comment.userId.avatar}" class="w-9 h-9 rounded-full" />
    <div class="max-w-full">
      <p class="font-semibold text-sm">${comment.userId.username}</p>
      <p class="text-sm text-gray-300"
         style="white-space: normal; word-break: break-word; overflow-wrap: anywhere; line-height:1.4;">
         ${comment.text}
      </p>
      <p class="text-xs text-gray-500">${new Date(comment.createdAt).toLocaleDateString()}</p>
    </div>
  </div>
`).join("");


    }
  } catch (error) {
    console.error("Comments load error:", error);
    document.getElementById("commentsList").innerHTML = `<p class="text-red-500 text-center">Error loading comments</p>`;
  }
}

async function sendComment() {
  const input = document.getElementById("commentInput");
  const text = input.value.trim();
  
  if (!text) return;

  try {
    await fetch(`${BASE_URL}/post/comment/${currentPostId}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    
    input.value = "";
    loadComments();
  } catch (error) {
    console.error("Comment post error:", error);
    showToast("Failed to post comment", "error");
  }
}

function closeCommentModal() {
  document.getElementById("commentModal").classList.add("hidden");
  document.getElementById("commentInput").value = "";
}

/* --------------------- CREATE POST --------------------- */

let selectedImages = [];

function openCreatePostModal() {
  document.getElementById("createPostModal").classList.remove("hidden");
}

function closeCreatePostModal() {
  document.getElementById("createPostModal").classList.add("hidden");
  selectedImages = [];
  document.getElementById("imagePreview").innerHTML = "";
  document.getElementById("postMedia").value = "";
  document.getElementById("postCaption").value = "";
}

function renderPreviewImages() {
  const previewBox = document.getElementById("imagePreview");
  previewBox.innerHTML = "";

  selectedImages.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wrapper = document.createElement("div");
      wrapper.className = "relative";
      wrapper.innerHTML = `
        <img src="${e.target.result}" class="w-full h-24 object-cover rounded" />
        <button 
          onclick="removeImage(${index})"
          class="absolute top-1 right-1 bg-black/70 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center">
          ✖
        </button>
      `;
      previewBox.appendChild(wrapper);
    };
    reader.readAsDataURL(file);
  });
}

function removeImage(index) {
  selectedImages.splice(index, 1);
  renderPreviewImages();
}

async function createPost() {
  const caption = document.getElementById("postCaption").value;
  const submitBtn = document.getElementById("submitPostBtn");

  if (!caption && selectedImages.length === 0) {
    showToast("Add caption or images");
    return;
  }

  // Show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>';

  try {
    const formData = new FormData();
    formData.append("caption", caption);
    selectedImages.forEach(file => formData.append("media", file));

    const response = await fetch(`${BASE_URL}/post/createPost`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const data = await response.json();

    if (data.success) {
      showToast("Post uploaded successfully", "success");
      closeCreatePostModal();
      location.reload(); // Simple refresh to show new post
    } else {
      showToast(data.message || "Upload failed", "error");
    }
  } catch (error) {
    console.error("Post creation error:", error);
    showToast("Upload failed", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Post';
  }
}

/* --------------------- FEED MANAGEMENT --------------------- */

async function loadFeed() {
  if (loading || finished) return;
  loading = true;

  let url = `${BASE_URL}/post/getfeed`;
  if (nextCursor) url += `?cursor=${nextCursor}`;

  try {
    const response = await fetch(url, { credentials: "include" });
    const data = await response.json();

    if (!data.data.posts.length) {
      finished = true;
      return;
    }

    nextCursor = data.data.nextCursor;
    data.data.posts.forEach(post => renderPostCard(post));

  } catch (error) {
    console.error("Feed load error:", error);
  }

  loading = false;
}
/* --------------------- POST CARD RENDER --------------------- */

function renderPostCard(post) {
  const div = document.createElement("div");
  div.className = "bg-[#111] p-4 rounded-2xl shadow-md mb-8 border border-gray-800 w-full max-w-[600px] mx-auto";

  div.innerHTML = `
  <div class="post">
    <!-- Header -->
    <div onclick= "gotoProfile('${post.user.username}')" class="flex items-center gap-3 mb-3">
      <img src="${post.user.avatar}" class="w-11 h-11 rounded-full border border-gray-600" />
      <div class="flex flex-col">
        <span class="text-white font-semibold text-sm">${post.user.username}</span>
        <span class="text-gray-400 text-xs">${new Date(post.createdAt).toDateString()}</span>
      </div>
    </div>

    <!-- Media - Simple single image display -->
       <!-- Media - Swiper Carousel -->
    ${post.media.length > 0 ? `
      <div class="swiper post-swiper max-h-[480px] rounded-xl overflow-hidden bg-black">
        <div class="swiper-wrapper">
          ${post.media.map(m => `
            <div class="swiper-slide flex justify-center items-center">
              <img src="${m.mediaURL}" class="max-h-[480px] w-full object-contain bg-black"/>
            </div>
          `).join("")}
        </div>

        ${post.media.length > 1 ? `
          <div class="swiper-pagination"></div>
          <div class="swiper-button-next"></div>
          <div class="swiper-button-prev"></div>
        ` : ''}
      </div>
    ` : ''}
<!-- Action Buttons -->
<div class="flex justify-between items-center text-2xl mt-4 px-1">
  <div class="flex gap-5">

    <!-- LIKE BUTTON (SVG + Optimistic UI) -->
    <button 
      class="like-btn hover:scale-110 transition"
      data-post-id="${post._id}"
      data-liked="${post.isLiked}"
    >
      ${post.isLiked 
        ? `
        <svg width="35" height="35" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M2 21h4V9H2v12zM22 10.5c0-1.1-.9-2-2-2h-5.3l.8-3.6.1-.7
          c0-.3-.1-.7-.4-1L14 2l-5.6 5.6C8.1 8 8 8.5 8 9v10c0 1.1.9 2 
          2 2h8c.8 0 1.6-.5 1.9-1.2l2-6c.1-.3.1-.6.1-.8v-2.5z"/>
        </svg>
        `
        : `
        <svg width="35" height="35" viewBox="0 0 24 24" fill="none"
          stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 9V5a2 2 0 0 0-2-2l-4 6v11h9a2 2 0 0 0 
          2-2l1.4-5a2 2 0 0 0-2-2H14z"/>
          <rect x="2" y="9" width="4" height="12" rx="1"/>
        </svg>
        `
      }
    </button>

    <!-- COMMENT BUTTON -->
    <button 
      class="comment-btn hover:scale-110 transition"
      data-post-id="${post._id}"
      onclick="openCommentBox('${post._id}')"
    >
      <svg width="35" height="35" viewBox="0 0 24 24" fill="none"
      stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7
        8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8
        8.5 8.5 0 0117 0z"/>
      </svg>
    </button>

  </div>
</div>


 


    <!-- Caption -->
    <p class="text-gray-200 text-sm mt-2 break-words">${post.caption}</p>
    <div>
  `;

  
    // Initialize Swiper if multiple images
  if (post.media.length > 1) {
    new Swiper(div.querySelector(".post-swiper"), {
      loop: true,
      pagination: { 
        el: div.querySelector(".swiper-pagination"), 
        clickable: true 
      },
      navigation: {
        nextEl: div.querySelector(".swiper-button-next"),
        prevEl: div.querySelector(".swiper-button-prev"),
      },
    });
  }

  

  document.getElementById("feedContainer").appendChild(div);

  // Add event listeners
const likeBtn = div.querySelector(".like-btn");

if (likeBtn) {
  likeBtn.addEventListener("click", () => toggleLike(likeBtn));
} else {
  console.warn("❌ No like button found in this post");
}


  const commentBtn = div.querySelector(".comment-btn");
  commentBtn.addEventListener("click", () => {
    openComments(post._id, post.caption);
  });

    }

 


  /* --------------------- USER PROFILE IN SIDEBAR --------------------- */



/* --------------------- LOGOUT --------------------- */

function logout() {
  localStorage.removeItem('token');
  window.location.href = "login.html";
}



/* --------------------- INITIALIZATION --------------------- */

document.addEventListener("DOMContentLoaded", () => {
    
  console.log("📌 feed.js loaded successfully");

  
  // Add these lines:
  loadMyProfile(); // Load sidebar profile
  loadRandomUsers(); // Load random 20 users
  setupSidebarSearch(); // Setup sidebar search



  // Event listeners for modals
  document.getElementById("openCreatePostModal").addEventListener("click", openCreatePostModal);
  document.getElementById("closeCreatePostModal").addEventListener("click", closeCreatePostModal);
  document.getElementById("closeCommentModal").addEventListener("click", closeCommentModal);
  
  // Comment functionality
  document.getElementById("sendCommentBtn").addEventListener("click", sendComment);
  
  // Enter key for comment input
  document.getElementById("commentInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendComment();
  });

  // File input for post creation
  document.getElementById("postMedia").addEventListener("change", () => {
    selectedImages = [...selectedImages, ...document.getElementById("postMedia").files];
    renderPreviewImages();
    document.getElementById("postMedia").value = "";
  });

  // Post creation
  document.getElementById("submitPostBtn").addEventListener("click", createPost);

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", logout);



  /* --------------------- INFINITE SCROLL --------------------- */

window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
    loadFeed();
  }
});

  // Load feed
  loadFeed();
 
});





// Make functions available globally
window.openComments = openComments;
window.removeImage = removeImage;
window.toggleFollow = toggleFollow;
window.toggleLike = toggleLike;
