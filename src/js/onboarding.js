/* ---------------------------------------------------------
   ONBOARDING SYSTEM
--------------------------------------------------------- */

const BASE_URL = "https://campus-coders-backend.onrender.com/api/v1";


/* --------------------- SET AVATAR --------------------- */

export async function setAvatar(file) {
  try {
    if (!file) {
      // Use default avatar if no file provided
      return { success: true, message: "Default avatar set" };
    }

    const formData = new FormData();
    formData.append("avatar", file);

    const res = await fetch(`${BASE_URL}/users/setAvatar`, {
      method: "POST",
      credentials: "include",
      body: formData
    });

    return await res.json();
  } catch (error) {
    console.error("❌ Avatar Upload Error:", error);
    return { success: false, message: "Avatar upload failed" };
  }
}

/* --------------------- SETUP PROFILE --------------------- */

export async function setupProfile(profileData) {
  try {
    const res = await fetch(`${BASE_URL}/users/profilemanagement`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData)
    });

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("❌ Profile Setup Error:", error);
    return { success: false, message: "Profile setup failed" };
  }
}

/* --------------------- VALIDATE PROFILE DATA --------------------- */

export function validateProfileData(profileData) {
  const { gender, course, year, bio } = profileData;
  const errors = [];

  if (!gender) {
    errors.push("Gender is required");
  }

  if (!course) {
    errors.push("Course is required");
  }

  if (!year) {
    errors.push("Year is required");
  }

  if (bio && bio.length > 150) {
    errors.push("Bio must be less than 150 characters");
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/* --------------------- IMAGE PREVIEW --------------------- */

export function setupImagePreview(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);

  if (!input || !preview) return;

  input.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        preview.src = e.target.result;
        preview.classList.remove('hidden');
      };
      
      reader.readAsDataURL(file);
    }
  });
}

/* --------------------- LOADING STATE --------------------- */

export function setLoadingState(buttonId, isLoading) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  if (isLoading) {
    button.disabled = true;
    button.innerHTML = `
      <div class="flex items-center justify-center gap-2">
        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span>Saving...</span>
      </div>
    `;
  } else {
    button.disabled = false;
    button.textContent = "Finish Setup";
  }
}

/* --------------------- CHECK PROFILE COMPLETION --------------------- */

export async function checkProfileCompletion() {
  try {
    const res = await fetch(`${BASE_URL}/users/getMyProfile`, {
      credentials: "include"
    });
    
    const data = await res.json();
    
    if (data.success && data.data.profileCompleted) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("❌ Profile check error:", error);
    return false;
  }
}

/* --------------------- REDIRECT BASED ON PROFILE STATUS --------------------- */

export async function redirectBasedOnProfileStatus() {
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
    console.error("❌ Profile status check error:", error);
    window.location.href = "login.html";
  }
}