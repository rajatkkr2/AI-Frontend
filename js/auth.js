// ============================================
// Auth Module
// Handles login and signup API calls
// ============================================

/**
 * handleLogin - Sends login request to the backend
 * Called when the login form is submitted
 * @param {Event} e - Form submit event
 */
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const submitBtn = document.getElementById("loginBtn");
  const errorDiv = document.getElementById("loginError");

  // Clear previous errors
  errorDiv.classList.add("hidden");
  errorDiv.textContent = "";

  // Simple client-side validation
  if (!email || !password) {
    errorDiv.textContent = "Please fill in all fields.";
    errorDiv.classList.remove("hidden");
    return;
  }

  // Show loading state on button
  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in...";

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Login failed. Please try again.");
    }

    // Save token and user data to localStorage
    saveAuth(data.data.token, data.data.user);

    // Redirect based on role
    const role = data.data.user.role;
    if (role === "admin") {
      window.location.href = "/admin/dashboard.html";
    } else if (role === "teacher") {
      window.location.href = "/teacher/dashboard.html";
    } else if (role === "student") {
      window.location.href = "/student/dashboard.html";
    }
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.remove("hidden");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Log In";
  }
}

/**
 * handleSignup - Sends signup request to the backend
 * Only students can sign up on their own
 * @param {Event} e - Form submit event
 */
async function handleSignup(e) {
  e.preventDefault();

  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById("signupConfirmPassword").value;
  const submitBtn = document.getElementById("signupBtn");
  const errorDiv = document.getElementById("signupError");

  // Clear previous errors
  errorDiv.classList.add("hidden");
  errorDiv.textContent = "";

  // Client-side validation
  if (!name || !email || !password || !confirmPassword) {
    errorDiv.textContent = "Please fill in all fields.";
    errorDiv.classList.remove("hidden");
    return;
  }

  if (name.length < 2) {
    errorDiv.textContent = "Name must be at least 2 characters.";
    errorDiv.classList.remove("hidden");
    return;
  }

  if (password.length < 6) {
    errorDiv.textContent = "Password must be at least 6 characters.";
    errorDiv.classList.remove("hidden");
    return;
  }

  if (password !== confirmPassword) {
    errorDiv.textContent = "Passwords do not match.";
    errorDiv.classList.remove("hidden");
    return;
  }

  // Show loading state
  submitBtn.disabled = true;
  submitBtn.textContent = "Creating Account...";

  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Signup failed. Please try again.");
    }

    // Save auth and redirect to student dashboard
    saveAuth(data.data.token, data.data.user);
    window.location.href = "/student/dashboard.html";
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.remove("hidden");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Create Account";
  }
}
