// ============================================
// Configuration File
// Central place for API base URL and helpers
// ============================================

// Change this if your backend runs on a different port or URL
const API_BASE_URL = "http://localhost:5000/api";

/**
 * getToken - Retrieves the JWT token from localStorage
 * @returns {string|null} The stored JWT token, or null if not logged in
 */
function getToken() {
  return localStorage.getItem("token");
}

/**
 * getUser - Retrieves the stored user object from localStorage
 * @returns {object|null} The parsed user object, or null
 */
function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

/**
 * saveAuth - Saves the token and user data to localStorage after login/signup
 * @param {string} token - JWT token
 * @param {object} user - User object from the API
 */
function saveAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

/**
 * logout - Clears all stored auth data and redirects to login page
 */
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/index.html";
}

/**
 * authHeaders - Returns the headers object needed for authenticated API calls
 * Includes both Content-Type and Authorization headers
 * @returns {object} Headers object for fetch
 */
function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

/**
 * redirectIfNotRole - Checks if the logged-in user has the required role
 * If not, redirects to the login page
 * Call this at the top of every dashboard page
 * @param {string} requiredRole - The role needed to view the page
 */
function redirectIfNotRole(requiredRole) {
  const user = getUser();
  const token = getToken();

  if (!token || !user) {
    window.location.href = "/index.html";
    return false;
  }

  if (user.role !== requiredRole) {
    window.location.href = "/index.html";
    return false;
  }

  return true;
}

/**
 * showToast - Displays a temporary notification message
 * @param {string} message - The message to display
 * @param {string} type - "success", "error", or "info"
 */
function showToast(message, type = "info") {
  // Remove any existing toast
  const existing = document.getElementById("toast");
  if (existing) existing.remove();

  // Color mapping
  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  };

  // Create toast element
  const toast = document.createElement("div");
  toast.id = "toast";
  toast.className = `fixed top-4 right-4 ${colors[type] || colors.info} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-300`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * formatDate - Formats a YYYY-MM-DD string into a readable format
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
function formatDate(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
