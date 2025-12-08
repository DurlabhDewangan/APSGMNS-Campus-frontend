const BASE_URL = 
  window.location.hostname.includes("localhost") ||
  window.location.hostname.includes("127.0.0.1")
    ? "http://localhost:8000/api/v1"
    : "https://campus-coders-backend.onrender.com/api/v1";


export class ProfileSetup {
  constructor() {
    this.form = document.getElementById('onboardForm');
    this.submitBtn = document.getElementById('submitBtn');
    this.messageContainer = document.getElementById('messageContainer');
    this.avatarFile = null; // Store the selected avatar file
    this.init();
  }

  init() {
    this.setupAvatarUpload();
    this.setupBioCounter();
    this.setupFormSubmission();
  }

  setupAvatarUpload() {
    const avatarInput = document.getElementById('avatar');
    const previewImg = document.getElementById('previewImg');

    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        // Basic validation
        if (file.size > 5 * 1024 * 1024) {
          this.showMessage('Image must be less than 5MB', 'error');
          avatarInput.value = ''; // Reset input
          return;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          this.showMessage('Please select a valid image file', 'error');
          avatarInput.value = ''; // Reset input
          return;
        }

        previewImg.src = URL.createObjectURL(file);
        this.avatarFile = file; // Store the file for later upload
        this.showMessage('Avatar selected!', 'success');
      } else {
        // Reset to no file selected
        this.avatarFile = null;
      }
    });
  }

  setupBioCounter() {
    const bio = document.getElementById('bio');
    const counter = document.getElementById('bioCounter');

    bio.addEventListener('input', (e) => {
      const length = e.target.value.length;
      counter.textContent = `${length}/150`;
      
      if (length > 150) {
        counter.classList.add('text-red-400');
      } else {
        counter.classList.remove('text-red-400');
      }
    });

    // Initialize counter
    counter.textContent = `${bio.value.length}/150`;
  }

  setupFormSubmission() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      this.showMessage('', '');

      const formData = {
        gender: document.getElementById('gender').value,
        course: document.getElementById('course').value,
        year: document.getElementById('year').value,
        bio: document.getElementById('bio').value.trim()
      };

      // Basic validation
      if (!formData.gender || !formData.course || !formData.year) {
        this.showMessage('Please fill in all required fields', 'error');
        return;
      }

      if (formData.bio.length > 150) {
        this.showMessage('Bio must be 150 characters or less', 'error');
        return;
      }

      this.setLoading(true);

      try {
        // ALWAYS call setAvatar endpoint (with or without file)
        // This ensures default avatar is set when no file is selected
        console.log('📤 Handling avatar...');
        try {
          const avatarResult = await this.setAvatar(this.avatarFile);
          console.log('✅ Avatar setup result:', avatarResult);
        } catch (error) {
          console.error('❌ Avatar setup failed:', error);
          // Continue with profile setup anyway
          this.showMessage('Avatar setup failed, but continuing with profile...', 'warning');
        }

        // Step 2: Setup profile
        console.log('📤 Setting up profile...');
        const result = await this.setupProfile(formData);
        console.log('✅ Profile setup result:', result);
        
        if (result.success) {
          this.showMessage('Profile setup completed! Redirecting...', 'success');
          
          // Save user info to localStorage if needed
          if (result.data) {
            localStorage.setItem("userId", result.data._id);
            localStorage.setItem("username", result.data.username);
            console.log('💾 User data saved to localStorage');
          }
          
          setTimeout(() => {
            window.location.href = './feed.html';
          }, 2000);
        } else {
          this.showMessage(result.message || 'Profile setup failed', 'error');
        }

      } catch (error) {
        console.error('❌ Profile setup error:', error);
        this.showMessage('Something went wrong. Please try again.', 'error');
      } finally {
        this.setLoading(false);
      }
    });
  }

  // Updated method to handle avatar (with or without file)
  async setAvatar(file) {
    const formData = new FormData();
    
    // If file exists, append it. If not, send empty form data
    // Backend should handle the case when no file is sent
    if (file) {
      formData.append('avatar', file);
      console.log('📤 Uploading selected avatar...');
    } else {
      console.log('📤 Setting default avatar...');
    }

    const response = await fetch(`${BASE_URL}/users/setAvatar`, {
      method: 'POST',
      credentials: 'include', // Important for sending cookies
      body: formData
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Avatar setup failed');
    }

    return data;
  }

  // Method to setup profile
  async setupProfile(profileData) {
    const response = await fetch(`${BASE_URL}/users/profilemanagement`, {
      method: 'POST',
      credentials: 'include', // Important for sending cookies
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(profileData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  setLoading(loading) {
    const buttonText = this.submitBtn.querySelector('.button-text');
    const buttonLoader = this.submitBtn.querySelector('.button-loader');

    if (loading) {
      this.submitBtn.disabled = true;
      buttonText.classList.add('hidden');
      buttonLoader.classList.remove('hidden');
    } else {
      this.submitBtn.disabled = false;
      buttonText.classList.remove('hidden');
      buttonLoader.classList.add('hidden');
    }
  }

  showMessage(message, type) {
    if (!message) {
      this.messageContainer.classList.add('hidden');
      return;
    }

    const typeClasses = {
      error: 'bg-red-900/20 border-red-700 text-red-400',
      success: 'bg-green-900/20 border-green-700 text-green-400',
      warning: 'bg-yellow-900/20 border-yellow-700 text-yellow-400'
    };

    this.messageContainer.textContent = message;
    this.messageContainer.className = `mt-4 p-3 rounded-lg border text-sm ${typeClasses[type] || 'bg-gray-900/20 border-gray-700 text-gray-400'}`;
    this.messageContainer.classList.remove('hidden');
  }
}