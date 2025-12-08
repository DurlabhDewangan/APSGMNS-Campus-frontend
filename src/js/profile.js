const BASE_URL = 
  window.location.hostname.includes("localhost") ||
  window.location.hostname.includes("127.0.0.1")
    ? "http://localhost:8000/api/v1"
    : "https://campus-coders-backend.onrender.com/api/v1";


const params = new URLSearchParams(window.location.search);
const username = params.get("user");

/* --------------------- PROFILE STATE --------------------- */
let currentProfileUser = null;
let isOwnProfile = false;

/* --------------------- CORE FUNCTIONS --------------------- */

async function loadProfile() {
  try {
    const url = username 
      ? `${BASE_URL}/users/getUserProfile/${username}`
      : `${BASE_URL}/users/getMyProfile`;

    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Failed to load profile");

    const user = data.data;
    currentProfileUser = user;

const loggedInUserId = localStorage.getItem("userId")?.trim();
const loggedInUsername = localStorage.getItem("username")?.trim()?.toLowerCase();

// Normalize comparison values
const viewingUsername = username?.trim()?.toLowerCase();
const profileUsername = user.username?.trim()?.toLowerCase();

isOwnProfile = (
  !username ||                // direct profile (no param)
  profileUsername === loggedInUsername ||   // user matched by username
  viewingUsername === loggedInUsername ||   // URL username matches logged-in user
  user._id === loggedInUserId               // id match
);


console.log({
  loggedInUserId,
  loggedInUsername,
  viewingUsername,
  profileUsername,
  isOwnProfile
});


    // Check follow status ONLY for other users
    let isFollowingUser = false;
    if (!isOwnProfile && user.username) {
      isFollowingUser = await checkFollowStatus(user.username);
    }

    // Update mobile header
    const mobileHeader = document.getElementById("mobileHeaderUsername");
    if (mobileHeader) mobileHeader.textContent = user.username;

    // Render both layouts
    renderProfile(user, isFollowingUser);

  } catch (error) {
    handleProfileError(error);
  }
}

function renderProfile(user, isFollowingUser) {
  const profileHTML = generateProfileHTML(user, isFollowingUser);
  const mobileProfileHTML = generateMobileProfileHTML(user, isFollowingUser);

  document.getElementById("profileContainer").innerHTML = profileHTML;
  document.getElementById("profileContainerMobile").innerHTML = mobileProfileHTML;
}

function generateProfileHTML(user, isFollowingUser) {
  return `
    <div class="flex items-center gap-16">
      <img src="${user.avatar}" class="w-40 h-40 rounded-full object-cover border-4 border-gray-700" />
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-5">
          <span class="text-3xl font-semibold">${user.username}</span>
          ${isOwnProfile 
            ? `<button class="border border-gray-600 px-4 py-1 rounded-md hover:bg-gray-800 transition">Edit Profile</button>`
            : `<button onclick="toggleProfileFollow('${user.username}', this)" class="${getFollowButtonClass(isFollowingUser)}">${isFollowingUser ? "Following" : "Follow"}</button>`
          }
        </div>
        
        <p class="text-lg font-semibold">${user.fullName || user.username}</p>
        
        <div class="flex gap-8 text-lg">
          <span><strong id="postCount">0</strong> posts</span>
          <span><b>${user.followersCount}</b> followers</span>
          <span><b>${user.followingCount}</b> following</span>
        </div>
        
        ${renderUserDetails(user)}
        <p class="text-gray-300 max-w-md">${user.bio || "No bio yet."}</p>
      </div>
    </div>
  `;
}

function generateMobileProfileHTML(user, isFollowingUser) {
  return `
    <div class="flex flex-col">
      <div class="flex items-start gap-4 mb-6">
        <img src="${user.avatar}" class="w-20 h-20 rounded-full object-cover border-2 border-gray-600 flex-shrink-0" />
        <div class="flex-1">
          <div class="flex justify-around text-center mb-4">
            <div class="flex-1">
              <div class="font-bold text-lg" id="postCountMobile">0</div>
              <div class="text-gray-400 text-xs">Posts</div>
            </div>
            <div class="flex-1 border-x border-gray-700">
              <div class="font-bold text-lg">${user.followersCount}</div>
              <div class="text-gray-400 text-xs">Followers</div>
            </div>
            <div class="flex-1">
              <div class="font-bold text-lg">${user.followingCount}</div>
              <div class="text-gray-400 text-xs">Following</div>
            </div>
          </div>
          
          ${isOwnProfile 
            ? `<button class="w-full border border-gray-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-800 transition">Edit Profile</button>`
            : `<button onclick="toggleProfileFollow('${user.username}', this)" class="${getMobileFollowButtonClass(isFollowingUser)}">${isFollowingUser ? "Following" : "Follow"}</button>`
          }
        </div>
      </div>

      <div class="space-y-3">
        <div>
          <h2 class="font-semibold text-base">${user.username}</h2>
          ${user.fullName ? `<p class="text-gray-300 text-sm">${user.fullName}</p>` : ''}
        </div>
        ${user.bio ? `<p class="text-gray-300 text-sm">${user.bio}</p>` : ''}
        ${renderMobileUserDetails(user)}
      </div>
    </div>
  `;
}

function renderUserDetails(user) {
  if (!user.course && !user.year && !user.gender) return '';
  return `
    <div class="flex gap-4 text-sm text-gray-400">
      ${user.course ? `<span>🎓 ${user.course}</span>` : ''}
      ${user.year ? `<span>📅 ${user.year}</span>` : ''}
      ${user.gender ? `<span>👤 ${user.gender}</span>` : ''}
    </div>
  `;
}

function renderMobileUserDetails(user) {
  if (!user.course && !user.year && !user.gender) return '';
  return `
    <div class="flex flex-wrap gap-2 text-gray-400 text-xs">
      ${user.course ? `<span class="bg-gray-800 px-2 py-1 rounded">🎓 ${user.course}</span>` : ''}
      ${user.year ? `<span class="bg-gray-800 px-2 py-1 rounded">📅 ${user.year}</span>` : ''}
      ${user.gender ? `<span class="bg-gray-800 px-2 py-1 rounded">👤 ${user.gender}</span>` : ''}
    </div>
  `;
}

function getFollowButtonClass(isFollowing) {
  const baseClass = "px-4 py-1 rounded-md font-semibold transition-all";
  return isFollowing 
    ? `${baseClass} bg-gray-600 text-gray-300 border border-gray-500 hover:bg-gray-700 following`
    : `${baseClass} bg-blue-500 text-white hover:bg-blue-600`;
}

function getMobileFollowButtonClass(isFollowing) {
  const baseClass = "w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors";
  return isFollowing 
    ? `${baseClass} bg-gray-600 text-gray-300 border border-gray-500 hover:bg-gray-700 following`
    : `${baseClass} bg-blue-500 text-white hover:bg-blue-600`;
}

/* --------------------- POSTS MANAGEMENT --------------------- */

async function loadUserPosts() {
  try {
    const url = username
      ? `${BASE_URL}/post/getUserPost/${username}`
      : `${BASE_URL}/post/getMyPosts`;

    const res = await fetch(url, { credentials: "include" });
    const response = await res.json();
    const posts = response.data?.posts || response.data || [];

    // Update post counts
    updatePostCounts(posts.length);

    // Render posts grid
    const postsHTML = posts.length > 0 ? generatePostsHTML(posts) : generateEmptyPostsHTML();
    
    document.getElementById("postGrid").innerHTML = postsHTML;
    document.getElementById("postGridMobile").innerHTML = postsHTML;

  } catch (err) {
    handlePostsError(err);
  }
}

function updatePostCounts(count) {
  document.getElementById("postCount").textContent = count;
  const mobileCount = document.getElementById("postCountMobile");
  if (mobileCount) mobileCount.textContent = count;
}

function generatePostsHTML(posts) {
  return posts.map(post => `
    <div class="relative aspect-square bg-gray-800 rounded overflow-hidden cursor-pointer group"
         onclick="openPostModal('${post._id}')">
      <img src="${post.media[0]?.mediaURL}" 
           class="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
           alt="Post image" />
      <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition duration-300 flex items-center justify-center">
        <div class="opacity-0 group-hover:opacity-100 transition duration-300 flex gap-4 text-white">
          <span class="flex items-center gap-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M2 21h4V9H2v12zM22 10.5c0-1.1-.9-2-2-2h-5.3l.8-3.6.1-.7
              c0-.3-.1-.7-.4-1L14 2l-5.6 5.6C8.1 8 8 8.5 8 9v10c0 1.1.9 2 
              2 2h8c.8 0 1.6-.5 1.9-1.2l2-6c.1-.3.1-.6.1-.8v-2.5z"/>
            </svg>
            ${post.likesCount}
          </span>
          <span class="flex items-center gap-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7
              8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8
              8.5 8.5 0 0117 0z"/>
            </svg>
            ${post.commentsCount}
          </span>
        </div>
      </div>
    </div>
  `).join("");
}

function generateEmptyPostsHTML() {
  return `
    <div class="col-span-3 text-center py-16">
      <p class="text-gray-500 text-lg">No posts yet</p>
      <p class="text-gray-400 text-sm mt-2">
        ${isOwnProfile ? "Share your first post!" : "This user hasn't posted anything yet."}
      </p>
      ${isOwnProfile ? `
        <button onclick="window.location.href='feed.html'" 
                class="mt-4 px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600">
          Create Post
        </button>
      ` : ''}
    </div>
  `;
}

/* --------------------- FOLLOW FUNCTIONALITY --------------------- */

async function checkFollowStatus(username) {
  try {
    const res = await fetch(`${BASE_URL}/users/isFollowing/${username}`, {
      credentials: "include",
    });
    const data = await res.json();
    return data.data.isFollowing;
  } catch (err) {
    console.error("❌ Follow Status Error:", err);
    return false;
  }
}

async function toggleProfileFollow(username, button) {
  if (!username || !button) return;

  const isCurrentlyFollowing = button.classList.contains("following");
  
  try {
    if (isCurrentlyFollowing) {
      await unfollowProfileUser(username, button);
    } else {
      await followProfileUser(username, button);
    }
  } catch (error) {
    showToast("Failed to update follow status");
  }
}

async function followProfileUser(username, button = null) {
  try {
    if (button) {
      button.innerHTML = "...";
      button.disabled = true;
    }

    const res = await fetch(`${BASE_URL}/users/follow/${username}`, {
      method: "GET",
      credentials: "include",
    });

    const data = await res.json();

    if (data.success) {
      showToast(`Started following ${username}`);
      if (button) updateProfileFollowButton(button, true);
      setTimeout(() => loadProfile(), 500);
    } else {
      showToast(data.message || "Failed to follow user");
    }
  } catch (err) {
    showToast("Failed to follow user");
  } finally {
    if (button) button.disabled = false;
  }
}

async function unfollowProfileUser(username, button = null) {
  try {
    if (button) {
      button.innerHTML = "...";
      button.disabled = true;
    }

    const res = await fetch(`${BASE_URL}/users/unfollow/${username}`, {
      method: "GET",
      credentials: "include",
    });

    const data = await res.json();

    if (data.success) {
      showToast(`Unfollowed ${username}`);
      if (button) updateProfileFollowButton(button, false);
      setTimeout(() => loadProfile(), 500);
    } else {
      showToast(data.message || "Failed to unfollow user");
    }
  } catch (err) {
    showToast("Failed to unfollow user");
  } finally {
    if (button) button.disabled = false;
  }
}

function updateProfileFollowButton(button, isFollowing) {
  if (isFollowing) {
    button.innerHTML = "Following";
    button.classList.remove("bg-blue-500", "text-white", "hover:bg-blue-600");
    button.classList.add("bg-gray-600", "text-gray-300", "border", "border-gray-500", "hover:bg-gray-700", "following");
  } else {
    button.innerHTML = "Follow";
    button.classList.remove("bg-gray-600", "text-gray-300", "border", "border-gray-500", "hover:bg-gray-700", "following");
    button.classList.add("bg-blue-500", "text-white", "hover:bg-blue-600");
  }
}

/* --------------------- TAB MANAGEMENT --------------------- */

function switchTab(tabName) {
  // Update active tab styling
  document.querySelectorAll(".profile-tab").forEach((tab) => {
    const isActive = tab.textContent.toLowerCase().includes(tabName);
    tab.classList.toggle("border-white", isActive);
    tab.classList.toggle("text-white", isActive);
    tab.classList.toggle("text-gray-400", !isActive);
    tab.classList.toggle("border-transparent", !isActive);
  });

  // Load tab content
  const tabHandlers = {
    posts: loadUserPosts,
    followers: loadFollowers,
    following: loadFollowing
  };

  const handler = tabHandlers[tabName];
  if (handler) handler();
}

async function loadFollowers() {
  await loadUserList('followers', `${BASE_URL}/users/getfollowers/${username || currentProfileUser?.username}`);
}

async function loadFollowing() {
  await loadUserList('following', `${BASE_URL}/users/getfollowing/${username || currentProfileUser?.username}`);
}

async function loadUserList(type, url) {
  try {
    const res = await fetch(url, { credentials: "include" });
    const { data: users } = await res.json();

    const content = users.length > 0 
      ? users.map(user => generateUserListItem(user)).join('')
      : `<p class="text-gray-500 text-center py-8">No ${type} yet</p>`;

    const grid = document.getElementById("postGrid");
    grid.innerHTML = `
      <div class="col-span-3">
        <h3 class="text-xl font-semibold mb-4">${type.charAt(0).toUpperCase() + type.slice(1)}</h3>
        <div class="space-y-3">${content}</div>
      </div>
    `;

    document.getElementById("postGridMobile").innerHTML = grid.innerHTML;

  } catch (err) {
    console.error(`❌ ${type} Load Error:`, err);
  }
}

function generateUserListItem(user) {
  const loggedInUsername = localStorage.getItem("username");
  const isCurrentUser = user.username === loggedInUsername;
  
  return `
    <div class="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-gray-800">
      <div class="flex items-center gap-3 cursor-pointer"
           onclick="redirectToUserProfile('${user.username}')">
        <img src="${user.avatar}" class="w-12 h-12 rounded-full border border-gray-600" />
        <div>
          <p class="font-semibold">${user.username}</p>
          <p class="text-sm text-gray-400">${user.fullName || ""}</p>
        </div>
      </div>
      ${!isCurrentUser ? `
        <button data-follow-user="${user.username}"
                onclick="toggleFollow('${user.username}', this)"
                class="follow-btn px-3 py-1 rounded-lg text-sm font-semibold transition-all bg-blue-500 text-white hover:bg-blue-600">
          Follow
        </button>
      ` : ''}
    </div>
  `;
}

/* --------------------- UTILITIES --------------------- */

function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "fixed top-5 right-5 bg-[#222] text-white px-4 py-2 rounded-xl shadow-lg hidden transition-opacity duration-300 z-50";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.remove("hidden", "opacity-0");
  toast.classList.add("opacity-100");

  setTimeout(() => {
    toast.classList.remove("opacity-100");
    toast.classList.add("opacity-0");
    setTimeout(() => toast.classList.add("hidden"), 300);
  }, 2000);
}

function handleProfileError(error) {
  console.error("❌ Profile Load Error:", error);
  const errorHTML = `
    <div class="text-red-500 text-center py-8">
      <p class="text-lg">Error loading profile</p>
      <p class="text-sm">${error.message}</p>
      <button onclick="window.location.href='feed.html'" 
              class="mt-4 px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600">
        Back to Feed
      </button>
    </div>
  `;
  document.getElementById("profileContainer").innerHTML = errorHTML;
  document.getElementById("profileContainerMobile").innerHTML = errorHTML;
}

function handlePostsError(err) {
  console.error("❌ Post Load Error:", err);
  const errorHTML = `
    <div class="col-span-3 text-center text-red-500 py-8">
      <p>Failed to load posts</p>
    </div>
  `;
  document.getElementById("postGrid").innerHTML = errorHTML;
  document.getElementById("postGridMobile").innerHTML = errorHTML;
}

function openPostModal(postId) {
  showToast(`Opening post ${postId}`);
}

function redirectToUserProfile(username) {
  window.location.href = `profile.html?user=${username}`;
}

/* --------------------- INITIALIZATION --------------------- */

document.addEventListener("DOMContentLoaded", async () => {
  await loadProfile();
  await loadUserPosts();
  
  // Tab listeners
  document.querySelectorAll(".profile-tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      const tabName = e.target.textContent.toLowerCase();
      switchTab(tabName);
    });
  });
});

// Keep these global functions for backward compatibility
window.toggleProfileFollow = toggleProfileFollow;
window.redirectToUserProfile = redirectToUserProfile;
window.switchTab = switchTab;

/* --------------------- POSTS MANAGEMENT --------------------- */

async function loadUserPosts() {
  try {
    const url = username
      ? `${BASE_URL}/post/getUserPost/${username}`
      : `${BASE_URL}/post/getMyPosts`;

    const res = await fetch(url, { credentials: "include" });
    const response = await res.json();
    const posts = response.data?.posts || response.data || [];

    // Update post counts
    updatePostCounts(posts.length);

    // Render posts grid
    const postsHTML = posts.length > 0 ? generatePostsHTML(posts) : generateEmptyPostsHTML();
    
    document.getElementById("postGrid").innerHTML = postsHTML;
    document.getElementById("postGridMobile").innerHTML = postsHTML;

  } catch (err) {
    handlePostsError(err);
  }
}

function updatePostCounts(count) {
  document.getElementById("postCount").textContent = count;
  const mobileCount = document.getElementById("postCountMobile");
  if (mobileCount) mobileCount.textContent = count;
}

function generatePostsHTML(posts) {
  return posts.map(post => `
    <div class="relative aspect-square bg-gray-800 rounded overflow-hidden cursor-pointer group"
         onclick="openPostModal('${post._id}')">
      <img src="${post.media[0]?.mediaURL}" 
           class="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
           alt="Post image" />
      <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition duration-300 flex items-center justify-center">
        <div class="opacity-0 group-hover:opacity-100 transition duration-300 flex gap-4 text-white">
          <span class="flex items-center gap-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M2 21h4V9H2v12zM22 10.5c0-1.1-.9-2-2-2h-5.3l.8-3.6.1-.7
              c0-.3-.1-.7-.4-1L14 2l-5.6 5.6C8.1 8 8 8.5 8 9v10c0 1.1.9 2 
              2 2h8c.8 0 1.6-.5 1.9-1.2l2-6c.1-.3.1-.6.1-.8v-2.5z"/>
            </svg>
            ${post.likesCount}
          </span>
          <span class="flex items-center gap-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7
              8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8
              8.5 8.5 0 0117 0z"/>
            </svg>
            ${post.commentsCount}
          </span>
        </div>
      </div>
    </div>
  `).join("");
}

function generateEmptyPostsHTML() {
  return `
    <div class="col-span-3 text-center py-16">
      <p class="text-gray-500 text-lg">No posts yet</p>
      <p class="text-gray-400 text-sm mt-2">
        ${isOwnProfile ? "Share your first post!" : "This user hasn't posted anything yet."}
      </p>
      ${isOwnProfile ? `
        <button onclick="window.location.href='feed.html'" 
                class="mt-4 px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600">
          Create Post
        </button>
      ` : ''}
    </div>
  `;
}

/* --------------------- FOLLOW FUNCTIONALITY --------------------- */

async function checkFollowStatus(username) {
  try {
    const res = await fetch(`${BASE_URL}/users/isFollowing/${username}`, {
      credentials: "include",
    });
    const data = await res.json();
    return data.data.isFollowing;
  } catch (err) {
    console.error("❌ Follow Status Error:", err);
    return false;
  }
}

async function toggleProfileFollow(username, button) {
  if (!username || !button) return;

  const isCurrentlyFollowing = button.classList.contains("following");
  
  try {
    if (isCurrentlyFollowing) {
      await unfollowProfileUser(username, button);
    } else {
      await followProfileUser(username, button);
    }
  } catch (error) {
    showToast("Failed to update follow status");
  }
}

async function followProfileUser(username, button = null) {
  try {
    if (button) {
      button.innerHTML = "...";
      button.disabled = true;
    }

    const res = await fetch(`${BASE_URL}/users/follow/${username}`, {
      method: "GET",
      credentials: "include",
    });

    const data = await res.json();

    if (data.success) {
      showToast(`Started following ${username}`);
      if (button) updateProfileFollowButton(button, true);
      setTimeout(() => loadProfile(), 500);
    } else {
      showToast(data.message || "Failed to follow user");
    }
  } catch (err) {
    showToast("Failed to follow user");
  } finally {
    if (button) button.disabled = false;
  }
}

async function unfollowProfileUser(username, button = null) {
  try {
    if (button) {
      button.innerHTML = "...";
      button.disabled = true;
    }

    const res = await fetch(`${BASE_URL}/users/unfollow/${username}`, {
      method: "GET",
      credentials: "include",
    });

    const data = await res.json();

    if (data.success) {
      showToast(`Unfollowed ${username}`);
      if (button) updateProfileFollowButton(button, false);
      setTimeout(() => loadProfile(), 500);
    } else {
      showToast(data.message || "Failed to unfollow user");
    }
  } catch (err) {
    showToast("Failed to unfollow user");
  } finally {
    if (button) button.disabled = false;
  }
}

function updateProfileFollowButton(button, isFollowing) {
  if (isFollowing) {
    button.innerHTML = "Following";
    button.classList.remove("bg-blue-500", "text-white", "hover:bg-blue-600");
    button.classList.add("bg-gray-600", "text-gray-300", "border", "border-gray-500", "hover:bg-gray-700", "following");
  } else {
    button.innerHTML = "Follow";
    button.classList.remove("bg-gray-600", "text-gray-300", "border", "border-gray-500", "hover:bg-gray-700", "following");
    button.classList.add("bg-blue-500", "text-white", "hover:bg-blue-600");
  }
}

/* --------------------- TAB MANAGEMENT --------------------- */

function switchTab(tabName) {
  // Update active tab styling
  document.querySelectorAll(".profile-tab").forEach((tab) => {
    const isActive = tab.textContent.toLowerCase().includes(tabName);
    tab.classList.toggle("border-white", isActive);
    tab.classList.toggle("text-white", isActive);
    tab.classList.toggle("text-gray-400", !isActive);
    tab.classList.toggle("border-transparent", !isActive);
  });

  // Load tab content
  const tabHandlers = {
    posts: loadUserPosts,
    followers: loadFollowers,
    following: loadFollowing
  };

  const handler = tabHandlers[tabName];
  if (handler) handler();
}

async function loadFollowers() {
  await loadUserList('followers', `${BASE_URL}/users/getfollowers/${username || currentProfileUser?.username}`);
}

async function loadFollowing() {
  await loadUserList('following', `${BASE_URL}/users/getfollowing/${username || currentProfileUser?.username}`);
}

async function loadUserList(type, url) {
  try {
    const res = await fetch(url, { credentials: "include" });
    const { data: users } = await res.json();

    const content = users.length > 0 
      ? users.map(user => generateUserListItem(user)).join('')
      : `<p class="text-gray-500 text-center py-8">No ${type} yet</p>`;

    const grid = document.getElementById("postGrid");
    grid.innerHTML = `
      <div class="col-span-3">
        <h3 class="text-xl font-semibold mb-4">${type.charAt(0).toUpperCase() + type.slice(1)}</h3>
        <div class="space-y-3">${content}</div>
      </div>
    `;

    document.getElementById("postGridMobile").innerHTML = grid.innerHTML;
    setTimeout(() => initializeFollowButtons(), 100);

  } catch (err) {
    console.error(`❌ ${type} Load Error:`, err);
  }
}

function generateUserListItem(user) {
  return `
    <div class="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-gray-800">
      <div class="flex items-center gap-3 cursor-pointer"
           onclick="redirectToUserProfile('${user.username}')">
        <img src="${user.avatar}" class="w-12 h-12 rounded-full border border-gray-600" />
        <div>
          <p class="font-semibold">${user.username}</p>
          <p class="text-sm text-gray-400">${user.fullName || ""}</p>
        </div>
      </div>
      ${!isOwnProfile ? `
        <button data-follow-user="${user.username}"
                onclick="toggleFollow('${user.username}', this)"
                class="follow-btn px-3 py-1 rounded-lg text-sm font-semibold transition-all bg-blue-500 text-white hover:bg-blue-600">
          Follow
        </button>
      ` : ''}
    </div>
  `;
}

/* --------------------- UTILITIES --------------------- */

function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "fixed top-5 right-5 bg-[#222] text-white px-4 py-2 rounded-xl shadow-lg hidden transition-opacity duration-300 z-50";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.remove("hidden", "opacity-0");
  toast.classList.add("opacity-100");

  setTimeout(() => {
    toast.classList.remove("opacity-100");
    toast.classList.add("opacity-0");
    setTimeout(() => toast.classList.add("hidden"), 300);
  }, 2000);
}

function handleProfileError(error) {
  console.error("❌ Profile Load Error:", error);
  const errorHTML = `
    <div class="text-red-500 text-center py-8">
      <p class="text-lg">Error loading profile</p>
      <p class="text-sm">${error.message}</p>
      <button onclick="window.location.href='feed.html'" 
              class="mt-4 px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600">
        Back to Feed
      </button>
    </div>
  `;
  document.getElementById("profileContainer").innerHTML = errorHTML;
  document.getElementById("profileContainerMobile").innerHTML = errorHTML;
}

function handlePostsError(err) {
  console.error("❌ Post Load Error:", err);
  const errorHTML = `
    <div class="col-span-3 text-center text-red-500 py-8">
      <p>Failed to load posts</p>
    </div>
  `;
  document.getElementById("postGrid").innerHTML = errorHTML;
  document.getElementById("postGridMobile").innerHTML = errorHTML;
}

function openPostModal(postId) {
  showToast(`Opening post ${postId}`);
}

function redirectToUserProfile(username) {
  window.location.href = `profile.html?user=${username}`;
}

/* --------------------- INITIALIZATION --------------------- */

document.addEventListener("DOMContentLoaded", async () => {
  await loadProfile();
  await loadUserPosts();
  
  // Tab listeners
  document.querySelectorAll(".profile-tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      const tabName = e.target.textContent.toLowerCase();
      switchTab(tabName);
    });
  });
});

// Keep these global functions for backward compatibility
window.toggleProfileFollow = toggleProfileFollow;
window.redirectToUserProfile = redirectToUserProfile;
window.switchTab = switchTab;