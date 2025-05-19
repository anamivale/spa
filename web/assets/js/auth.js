import { Feeds } from "./feeds.js";
import { authTemplate, feeds } from "./templates.js";

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

export function Signup() {
  const nickname = document.getElementById("nickname").value;
  const age = document.getElementById("age").value;
  const genderValue = document.querySelector(
    'input[name="gender"]:checked'
  )?.value;
  const fname = document.getElementById("fname").value;
  const lname = document.getElementById("lname").value;
  const email = document.getElementById("email").value;
  const pswd = document.getElementById("pswd").value;
  const cpswd = document.getElementById("cpswd").value;
  const err = document.getElementById("errors");
  const emailInput = document.getElementById("email");

  if (
    nickname == "" ||
    age == "" ||
    genderValue == "" ||
    fname == "" ||
    lname == "" ||
    email == "" ||
    pswd == "" ||
    cpswd == ""
  ) {
    document.getElementById("app").innerHTML = authTemplate();
    loadAuthView("fill all the fields");
    return;
  }

  if (Number(age) < 16 && Number(age) > 2009) {
    loadAuthView("age must be between 16 and 2009");
    return;
  }

  if (!emailInput.checkValidity()) {
    console.log("Please enter an email address");
    loadAuthView("Please enter a valid email address");
    return;
  }

  if (pswd !== cpswd) {
    console.log("passwords do not match");
    loadAuthView("passwords do not match");
    return;
  }

  let ReqBody = {
    nickname: nickname,
    age: age,
    gender: genderValue,
    fname: fname,
    lname: lname,
    email: email,
    password: pswd,
  };

  try {
    fetch("http://localhost:8080/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ReqBody),
      credentials: "include" // Important for cookies
    })
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        console.log(data);
        if (data.type === "success") {
          // Start session monitoring after successful registration
          startSessionMonitoring();
          Feeds();
        } else {
          loadAuthView(data.type);
        }
      });
  } catch (error) {
    console.log(error.message);
    loadAuthView("An error occurred. Please try again.");
  }
}

export  function Login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    credentials: "include" // Important for cookies
  })
    .then((res) => {
      const result =  res.json()
      if (!res.ok) throw new Error("Login failed");
      return result;
    })
    .then((data) => {
      console.log("Login successful:", data);
      // Start session monitoring after successful login
      startSessionMonitoring();
      Feeds();
    })
    .catch((err) => {
    
      alert(err.message)
    });
}

// Updated the logout function to clean up session monitoring
export function Logout() {
  fetch("/logout", {
    method: "POST",
    credentials: "include" // Important for cookies
  })
    .then((res) => res.json())
    .then((data) => {
      // Stop monitoring when logged out
      stopSessionMonitoring();
      loadAuthView();
    })
    .catch((err) => {
      console.error("Logout error:", err);
      loadAuthView("Error during logout");
    });
}

export function loadAuthView(error) {
  // Stop session monitoring when showing login view
  stopSessionMonitoring();

  document.getElementById("app").innerHTML = authTemplate();

  if (error) {
    document.getElementById("errors").textContent = error;
  }

  document.getElementById("signup")
    .addEventListener("click", () => Signup());
  document.getElementById("login")
    .addEventListener("click", () => Login());
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
