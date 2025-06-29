import { Feeds } from "./feeds.js";
import { authTemplate } from "./templates.js";

// CSRF token management
let csrfToken = null;

// Get CSRF token from server
async function getCSRFToken() {
  try {
    const response = await fetch("/csrf-token", {
      method: "GET",
      credentials: "include"
    });
    const data = await response.json();
    csrfToken = data.csrf_token;
    return csrfToken;
  } catch (error) {
    console.error("Failed to get CSRF token:", error);
    return null;
  }
}

// Get CSRF token from cookie
function getCSRFTokenFromCookie() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// Ensure we have a CSRF token before making requests
async function ensureCSRFToken() {
  if (!csrfToken) {
    csrfToken = getCSRFTokenFromCookie() || await getCSRFToken();
  }
  return csrfToken;
}

// Show error message to user
function showError(message) {
  const errorElement = document.getElementById("errors");
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.color = "#ff4444";
    errorElement.style.marginTop = "10px";
  }
}

// Add session monitoring functionality
let sessionCheckInterval = null;

// Function to check session status
function checkSessionStatus() {
  fetch("/session-check", {
    method: "GET",
    credentials: "include" // Important for cookies
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "invalid" || data.status === "unauthenticated") {
        // Session is invalid or expired, show login page
        stopSessionMonitoring();
        loadAuthView("Your session has expired or was logged in elsewhere");
      }
    })
    .catch(err => {
      console.error("Session check error:", err);
    });
}

// Start session monitoring
export function startSessionMonitoring() {
  // Clear any existing interval
  stopSessionMonitoring();

  // Check immediately, then set interval (every 30 seconds)
  checkSessionStatus();
  sessionCheckInterval = setInterval(checkSessionStatus, 30000);
}

// Stop session monitoring
export function stopSessionMonitoring() {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
    sessionCheckInterval = null;
  }
}

export async function Signup() {
  const nickname = document.getElementById("nickname").value.trim();
  const age = document.getElementById("age").value.trim();
  const genderValue = document.querySelector('input[name="gender"]:checked')?.value;
  const fname = document.getElementById("fname").value.trim();
  const lname = document.getElementById("lname").value.trim();
  const email = document.getElementById("email").value.trim();
  const pswd = document.getElementById("pswd").value;
  const cpswd = document.getElementById("cpswd").value;
  const emailInput = document.getElementById("email");

  // Clear previous errors
  const errorElement = document.getElementById("errors");
  if (errorElement) errorElement.textContent = "";

  // Validation
  if (!nickname || !age || !genderValue || !fname || !lname || !email || !pswd || !cpswd) {
    showError("Please fill in all fields");
    return;
  }

  // Fix the age validation logic
  const ageNum = Number(age);
  if (isNaN(ageNum) || ageNum < 16 || ageNum > 100) {
    showError("Age must be between 16 and 100");
    return;
  }

  if (!emailInput.checkValidity()) {
    showError("Please enter a valid email address");
    return;
  }

  if (pswd !== cpswd) {
    showError("Passwords do not match");
    return;
  }

  if (pswd.length < 6) {
    showError("Password must be at least 6 characters long");
    return;
  }

  const reqBody = {
    nickname,
    age,
    gender: genderValue,
    fname,
    lname,
    email,
    password: pswd,
  };

  try {
    // Ensure we have a CSRF token
    const token = await ensureCSRFToken();
    if (!token) {
      showError("Security token unavailable. Please refresh the page.");
      return;
    }

    const response = await fetch("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": token
      },
      body: JSON.stringify(reqBody),
      credentials: "include"
    });

    const data = await response.json();

    if (response.ok && data.type === "success") {
      // Start session monitoring after successful registration
      startSessionMonitoring();
      Feeds();
    } else {
      showError(data.type || "Registration failed. Please try again.");
    }
  } catch (error) {
    console.error("Registration error:", error);
    showError("An error occurred. Please try again.");
  }
}

export async function Login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Clear any previous error messages
  const errorElement = document.getElementById("errors");
  if (errorElement) errorElement.textContent = "";

  // Validate input
  if (!username.trim() || !password.trim()) {
    showError("Please enter both username and password");
    return;
  }

  try {
    // Ensure we have a CSRF token
    const token = await ensureCSRFToken();
    if (!token) {
      showError("Security token unavailable. Please refresh the page.");
      return;
    }

    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": token
      },
      body: JSON.stringify({ username, password }),
      credentials: "include"
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Login failed");
    }

    const data = await response.json();
    console.log("Login successful:", data);

    // Start session monitoring after successful login
    startSessionMonitoring();
    Feeds();
  } catch (err) {
    console.error("Login error:", err);
    showError(err.message || "Login failed. Please try again.");
  }
}

// Updated the logout function to clean up session monitoring
export async function Logout() {
  try {
    // Ensure we have a CSRF token
    const token = await ensureCSRFToken();
    if (!token) {
      console.warn("No CSRF token available for logout");
      // Still proceed with logout even without token
    }

    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["X-CSRF-Token"] = token;
    }

    const response = await fetch("/logout", {
      method: "POST",
      headers,
      credentials: "include"
    });

    // Stop monitoring when logged out (regardless of response)
    stopSessionMonitoring();
    loadAuthView();
  } catch (err) {
    console.error("Logout error:", err);
    // Still show login view even if logout failed
    stopSessionMonitoring();
    loadAuthView("Error during logout");
  }
}

export async function loadAuthView(error) {
  // Stop session monitoring when showing login view
  stopSessionMonitoring();

  document.getElementById("app").innerHTML = authTemplate();

  if (error) {
    showError(error);
  }

  // Get CSRF token when loading auth view
  await getCSRFToken();

  // Add event listeners
  document.getElementById("signup")
    .addEventListener("click", () => Signup());
  document.getElementById("login")
    .addEventListener("click", () => Login());

  // Add real-time validation
  setupFormValidation();
}

// Setup real-time form validation
function setupFormValidation() {
  const signupForm = document.getElementById("signup-form");
  const loginForm = document.getElementById("login-form");

  // Password confirmation validation
  const password = document.getElementById("pswd");
  const confirmPassword = document.getElementById("cpswd");

  if (password && confirmPassword) {
    confirmPassword.addEventListener("input", () => {
      if (confirmPassword.value && password.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity("Passwords do not match");
      } else {
        confirmPassword.setCustomValidity("");
      }
    });

    password.addEventListener("input", () => {
      if (confirmPassword.value && password.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity("Passwords do not match");
      } else {
        confirmPassword.setCustomValidity("");
      }
    });
  }

  // Add input validation styling
  const inputs = document.querySelectorAll("input");
  inputs.forEach(input => {
    input.addEventListener("blur", validateInput);
    input.addEventListener("input", clearValidationOnInput);
  });
}

// Validate individual input
function validateInput(event) {
  const input = event.target;
  const isValid = input.checkValidity();

  if (!isValid) {
    input.classList.add("invalid");
    input.classList.remove("valid");
  } else {
    input.classList.add("valid");
    input.classList.remove("invalid");
  }
}

// Clear validation styling when user starts typing
function clearValidationOnInput(event) {
  const input = event.target;
  input.classList.remove("invalid", "valid");
}

// Add an initialization function to check session on page load
export function initAuth() {
  // Check if we're already logged in
  fetch("/session-check", { credentials: "include" })
    .then(res => res.json())
    .then(data => {
      if (data.status === "authenticated") {
        // Start session monitoring and load feeds
        startSessionMonitoring();
        Feeds();
      } else {
        // Show login page
        loadAuthView();
      }
    })
    .catch(err => {
      console.error("Initial session check failed:", err);
      loadAuthView("Error checking session status");
    });
}

window.addEventListener("DOMContentLoaded", initAuth);
