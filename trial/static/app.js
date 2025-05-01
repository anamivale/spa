// Global variables
let currentUser = null;
let currentChatUser = null;
let socket = null;
let users = [];
let unreadCounts = {};

// DOM elements
const authContainer = document.getElementById("auth-container");
const chatContainer = document.getElementById("chat-container");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginButton = document.getElementById("login-button");
const registerButton = document.getElementById("register-button");
const loginError = document.getElementById("login-error");
const registerError = document.getElementById("register-error");
const logoutButton = document.getElementById("logout-button");
const usersList = document.getElementById("users");
const messagesContainer = document.getElementById("messages");
const messageInput = document.getElementById("message-input");
const messageText = document.getElementById("message-text");
const sendButton = document.getElementById("send-button");
const chatHeader = document.getElementById("chat-header");
const notificationCount = document.getElementById("notification-count");
const notificationBell = document.querySelector(".notification-bell");

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const savedUser = localStorage.getItem("chatUser");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showChatInterface();
    fetchUsers();
    connectWebSocket();
    fetchUnreadCounts();
  }

  // Set up event listeners
  setupEventListeners();
});

// Set up all event listeners
async function setupEventListeners() {
  // Auth tabs
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".form")
        .forEach((f) => f.classList.remove("active"));
      tab.classList.add("active");
      document
        .getElementById(`${tab.dataset.tab}-form`)
        .classList.add("active");
    });
  });

  // Login form
  loginButton.addEventListener("click", handleLogin);
  document
    .getElementById("login-username")
    .addEventListener("keypress", (e) => {
      if (e.key === "Enter") document.getElementById("login-password").focus();
    });
  document
    .getElementById("login-password")
    .addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleLogin();
    });

  // Register form
  registerButton.addEventListener("click", handleRegister);
  document
    .getElementById("register-username")
    .addEventListener("keypress", (e) => {
      if (e.key === "Enter")
        document.getElementById("register-password").focus();
    });
  document
    .getElementById("register-password")
    .addEventListener("keypress", (e) => {
      if (e.key === "Enter")
        document.getElementById("register-confirm").focus();
    });
  document
    .getElementById("register-confirm")
    .addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleRegister();
    });

  // Chat interface
  logoutButton.addEventListener("click", handleLogout);
  sendButton.addEventListener("click", sendMessage);
  messageText.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Notification bell
  notificationBell.addEventListener("click", () => {
    notificationCount.classList.add("hidden");
    notificationCount.textContent = "0";
  });
}

// Handle login
async function handleLogin() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  if (!username || !password) {
    loginError.textContent = "Please enter both username and password";
    return;
  }

  try {
    let req = {
      username: username,
      password: password,
    };
    const response = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify(req),
    });

    const data = await response.json();

    if (data.status === "success") {
      currentUser = data.data;
      localStorage.setItem("chatUser", JSON.stringify(currentUser));
      showChatInterface();
      fetchUsers();
      connectWebSocket();
      fetchUnreadCounts();
    } else {
      loginError.textContent = data.message;
    }
  } catch (error) {
    loginError.textContent = "An error occurred. Please try again.";
    console.error("Login error:", error);
  }
}

// Handle registration
async function handleRegister() {
  const username = document.getElementById("register-username").value.trim();
  const password = document.getElementById("register-password").value;
  const confirmPassword = document.getElementById("register-confirm").value;

  if (!username || !password) {
    registerError.textContent = "Please enter both username and password";
    return;
  }

  if (password !== confirmPassword) {
    registerError.textContent = "Passwords do not match";
    return;
  }

  try {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch("/api/register", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.status === "success") {
      // Auto login after registration
      currentUser = data.data;
      localStorage.setItem("chatUser", JSON.stringify(currentUser));
      showChatInterface();
      fetchUsers();
      connectWebSocket();
      fetchUnreadCounts();
    } else {
      registerError.textContent = data.message;
    }
  } catch (error) {
    registerError.textContent = "An error occurred. Please try again.";
    console.error("Registration error:", error);
  }
}

// Handle logout
function handleLogout() {
  localStorage.removeItem("chatUser");
  currentUser = null;
  if (socket) {
    socket.close();
  }
  showAuthInterface();
}

// Show chat interface
function showChatInterface() {
  authContainer.classList.add("hidden");
  chatContainer.classList.remove("hidden");
}

// Show auth interface
function showAuthInterface() {
  authContainer.classList.remove("hidden");
  chatContainer.classList.add("hidden");
  // Reset forms
  document.getElementById("login-username").value = "";
  document.getElementById("login-password").value = "";
  document.getElementById("register-username").value = "";
  document.getElementById("register-password").value = "";
  document.getElementById("register-confirm").value = "";
  loginError.textContent = "";
  registerError.textContent = "";
}

// Fetch users
async function fetchUsers() {
  try {
    const response = await fetch("/api/users");
    const data = await response.json();

    if (data.status === "success") {
      users = data.data.filter((user) => user.id !== currentUser.id);
      renderUsers();
    }
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

// Render users list
function renderUsers() {
  usersList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = user.username;
    li.dataset.userId = user.id;

    // Add unread badge if there are unread messages
    if (unreadCounts[user.id] && unreadCounts[user.id] > 0) {
      const badge = document.createElement("span");
      badge.className = "unread-badge";
      badge.textContent = unreadCounts[user.id];
      li.appendChild(badge);
    }

    li.addEventListener("click", () => {
      selectUser(user);
    });

    if (currentChatUser && currentChatUser.id === user.id) {
      li.classList.add("active");
    }

    usersList.appendChild(li);
  });
}

// Select a user to chat with
function selectUser(user) {
  currentChatUser = user;

  // Update UI
  document.querySelectorAll("#users li").forEach((li) => {
    li.classList.remove("active");
    if (li.dataset.userId == user.id) {
      li.classList.add("active");
    }
  });

  chatHeader.innerHTML = `<h2>Chat with ${user.username}</h2>`;
  messageInput.classList.remove("hidden");
  messagesContainer.innerHTML = "";

  // Mark messages as read
  markMessagesAsRead(user.id);

  // Fetch chat history
  fetchMessages(user.id);
}

// Connect WebSocket
function connectWebSocket() {
  if (socket) {
    socket.close();
  }

  socket = new WebSocket(
    `ws://${window.location.host}/ws?user_id=${currentUser.id}`
  );

  socket.onopen = () => {
    console.log("WebSocket connection established");
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleNewMessage(message);
  };

  socket.onclose = () => {
    console.log("WebSocket connection closed");
    // Attempt to reconnect after a delay
    setTimeout(() => {
      if (currentUser) {
        connectWebSocket();
      }
    }, 3000);
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
}

// Handle new message
function handleNewMessage(message) {
  // If message is for current chat, add it to the UI
  if (
    currentChatUser &&
    ((message.sender_id == currentChatUser.id &&
      message.receiver_id == currentUser.id) ||
      (message.sender_id == currentUser.id &&
        message.receiver_id == currentChatUser.id))
  ) {
    addMessageToUI(message);

    // If we received a message, mark it as read
    if (
      message.sender_id == currentChatUser.id &&
      message.receiver_id == currentUser.id
    ) {
      markMessagesAsRead(currentChatUser.id);
    }
  }
  // If it's a new message from someone else, update unread counts
  else if (message.receiver_id == currentUser.id) {
    fetchUnreadCounts();
  }
}

// Send a message
function sendMessage() {
  const content = messageText.value.trim();
  if (!content || !currentChatUser) return;

  const message = {
    receiver_id: currentChatUser.id,
    content: content,
  };

  socket.send(JSON.stringify(message));
  messageText.value = "";
}

// Fetch messages between current user and selected user
async function fetchMessages(otherUserId) {
  try {
    const response = await fetch(
      `/api/messages?user_id=${currentUser.id}&other_user_id=${otherUserId}`
    );
    const data = await response.json();

    if (data.status === "success") {
      messagesContainer.innerHTML = "";
      data.data.forEach((message) => {
        addMessageToUI(message);
      });
      scrollToBottom();
    }
  } catch (error) {
    console.error("Error fetching messages:", error);
  }
}

// Add a message to the UI
function addMessageToUI(message) {
  const messageDiv = document.createElement("div");
  messageDiv.className =
    message.sender_id == currentUser.id
      ? "message message-sent"
      : "message message-received";

  const content = document.createElement("div");
  content.className = "message-content";
  content.textContent = message.content;

  const time = document.createElement("div");
  time.className = "message-time";
  time.textContent = formatTime(new Date(message.timestamp));

  messageDiv.appendChild(content);
  messageDiv.appendChild(time);
  messagesContainer.appendChild(messageDiv);

  scrollToBottom();
}

// Scroll to bottom of messages container
function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Format time for message timestamps
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Fetch unread message counts
async function fetchUnreadCounts() {
  try {
    const response = await fetch(`/api/unread?user_id=${currentUser.id}`);
    const data = await response.json();

    if (data.status === "success") {
      unreadCounts = {};
      let totalUnread = 0;

      // Process unread counts
      for (const [senderId, count] of Object.entries(data.data)) {
        if (senderId !== "total") {
          unreadCounts[senderId] = count;
          totalUnread += count;
        }
      }

      // Update the notification bell
      if (totalUnread > 0) {
        notificationCount.textContent = totalUnread > 99 ? "99+" : totalUnread;
        notificationCount.classList.remove("hidden");
      } else {
        notificationCount.classList.add("hidden");
      }

      // Update user list with unread badges
      renderUsers();
    }
  } catch (error) {
    console.error("Error fetching unread counts:", error);
  }
}

// Mark messages as read
async function markMessagesAsRead(senderId) {
  try {
    const formData = new FormData();
    formData.append("user_id", currentUser.id);
    formData.append("sender_id", senderId);

    await fetch("/api/mark-read", {
      method: "POST",
      body: formData,
    });

    // Update unread counts
    fetchUnreadCounts();
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
}

// Periodically check for unread messages
setInterval(() => {
  if (currentUser) {
    fetchUnreadCounts();
  }
}, 10000); // Check every 10 seconds
