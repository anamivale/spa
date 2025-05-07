import { messagesUi } from "./templates.js";

// Global variables
let currentUser = null;
let currentChatUser = null;
let socket = null;
let unreadCounts = {};

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  const sessionId = getSessionIdFromCookies();
  currentUser = {
    "id": sessionId
  }

  showChatInterface();

  setupEventListeners();

  connectWebSocket();
  fetchUnreadCounts();
})

// Set up all event listeners
function setupEventListeners() {
  // Re-fetch DOM elements now that they exist
  const notificationCount = document.getElementById("notification-count");
  const notificationBell = document.querySelector(".bell");
  const messageText = document.getElementById("message-text");
  const sendButton = document.getElementById("send-button");

  // Check if elements exist before adding event listeners
  if (sendButton && messageText) {
    sendButton.addEventListener("click", sendMessage);
    messageText.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Notification bell
  if (notificationBell && notificationCount) {
    notificationBell.addEventListener("click", () => {
      notificationCount.classList.add("hidden");
      notificationCount.textContent = "0";
    });
  }
}

// Show chat interface
function showChatInterface() {
  let feeds = document.getElementById("feeds");
  if (feeds) {
    feeds.innerHTML = messagesUi();
  }
}

// Render users list
export function renderUsers(users) {
  if (!users || !Array.isArray(users)) {
    console.error("No users array provided to renderUsers");
    return;
  }

  let online_users = document.getElementById("online-users");
  if (!online_users) {
    console.error("online-users element not found");
    return;
  }

  // Clear existing users to prevent duplicates
  online_users.innerHTML = '';

  users.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = user.Nickname;
    li.dataset.userId = user.Id;

    // Add unread badge if there are unread messages
    if (unreadCounts[user.Id] && unreadCounts[user.Id] > 0) {
      const badge = document.createElement("span");
      badge.className = "unread-badge";
      badge.textContent = unreadCounts[user.Id];
      li.appendChild(badge);
    }

    li.addEventListener("click", () => {
      // First establish connection and create the UI
      showChatInterface();

      setupEventListeners();

      // Then select the user immediately
      selectUser(user);
      
      // After selecting user, fetch unread counts
      fetchUnreadCounts();
    });

    if (currentChatUser && currentChatUser.Id === user.Id) {
      li.classList.add("active");
    }

    online_users.appendChild(li);
  });
}

// Select a user to chat with
function selectUser(user) {
  currentChatUser = user;

  // Safely get DOM elements
  const userElements = document.querySelectorAll("#online-users li");
  const messageInput = document.getElementById("message-input");
  const messagesContainer = document.getElementById("messages");

  // Check if elements exist before manipulating them
  if (userElements) {
    userElements.forEach((li) => {
      li.classList.remove("active");
      if (li.dataset.userId == user.Id) {
        li.classList.add("active");
      }
    });
  }

  if (messageInput) {
    messageInput.classList.remove("hidden");
  }

  if (messagesContainer) {
    messagesContainer.innerHTML = "";

    // Mark messages as read
    markMessagesAsRead(user.Id);

    // Fetch chat history
    fetchMessages(user.Id);
  } else {
    console.error("Messages container not found");
  }
}

// Connect WebSocket
function connectWebSocket() {
  if (!currentUser || !currentUser.id) {
    console.error("Cannot connect WebSocket: currentUser.id is missing");
    return;
  }

  if (socket && socket.readyState !== WebSocket.CLOSED) {
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
  // If message is for current chat, add it to the UI immediately
  if (
    currentChatUser &&
    ((message.sender_id == currentChatUser.Id &&
      message.receiver_id == currentUser.id) ||
      (message.sender_id == currentUser.id &&
        message.receiver_id == currentChatUser.Id))
  ) {
    // Add message to UI immediately - removed the setTimeout delay
    addMessageToUI(message);

    // If we received a message, mark it as read
    if (
      message.sender_id == currentChatUser.Id &&
      message.receiver_id == currentUser.id
    ) {
      markMessagesAsRead(currentChatUser.Id);
    }
  }
  else if (message.receiver_id == currentUser.id) {
    fetchUnreadCounts();
  }
}

// Send a message
function sendMessage() {
  const messageText = document.getElementById("message-text");
  if (!messageText) {
    console.error("Message text element not found");
    return;
  }

  const content = messageText.value.trim();
  if (!content || !currentChatUser) return;

  const message = {
    receiver_id: currentChatUser.Id,
    content: content,
  };

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
    messageText.value = "";
  } else {
    console.error("WebSocket is not connected");
    // Try to reconnect if socket is closed
    if (socket.readyState === WebSocket.CLOSED) {
      connectWebSocket();
      // Try sending again after reconnection
      setTimeout(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(message));
          messageText.value = "";
        }
      }, 500);
    }
  }
}

// Fetch messages between current user and selected user
async function fetchMessages(otherUserId) {
  if (!currentUser || !currentUser.id) {
    console.error("Cannot fetch messages: currentUser.id is missing");
    return;
  }

  try {
    const response = await fetch(
      `/api/messages?user_id=${currentUser.id}&other_user_id=${otherUserId}`
    );
    const data = await response.json();

    const messagesContainer = document.getElementById("messages");

    if (messagesContainer && data.status === "success") {
      messagesContainer.innerHTML = "";
      data.data?.forEach((message) => {
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
  const messagesContainer = document.getElementById("messages");
  if (!messagesContainer) {
    console.error("Messages container not found");
    return;
  }

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
  const messagesContainer = document.getElementById("messages");
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

// Format time for message timestamps
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Fetch unread message counts
async function fetchUnreadCounts() {
  if (!currentUser || !currentUser.id) {
    console.error("Cannot fetch unread counts: currentUser.id is missing");
    return;
  }

  try {
    const response = await fetch(`/api/unread?user_id=${currentUser.id}`);
    const data = await response.json();

    const notificationCount = document.getElementById("notification-count");

    if (data.status === "success") {
      unreadCounts = data.data || {};
      let totalUnread = unreadCounts.total || 0;

      // Update the notification bell if it exists
      if (notificationCount) {
        if (totalUnread > 0) {
          notificationCount.textContent = totalUnread > 99 ? "99+" : totalUnread;
          notificationCount.classList.remove("hidden");
        } else {
          notificationCount.classList.add("hidden");
        }
      }

      // Update user list badges
      updateUnreadBadges();
    }
  } catch (error) {
    console.error("Error fetching unread counts:", error);
  }
}

// Update unread badges without re-rendering the entire user list
function updateUnreadBadges() {
  const userElements = document.querySelectorAll("#online-users li");

  userElements.forEach((li) => {
    const userId = li.dataset.userId;
    let badge = li.querySelector(".unread-badge");

    if (unreadCounts[userId] && unreadCounts[userId] > 0) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "unread-badge";
        li.appendChild(badge);
      }
      badge.textContent = unreadCounts[userId];
    } else if (badge) {
      li.removeChild(badge);
    }
  });
}

// Mark messages as read
async function markMessagesAsRead(senderId) {
  if (!currentUser || !currentUser.id) {
    console.error("Cannot mark messages as read: currentUser.id is missing");
    return;
  }

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

// Periodically check for unread messages (reduce frequency to lower server load)
setInterval(() => {
  if (currentUser) {
    fetchUnreadCounts();
  }
}, 1000); // Changed from 1000ms to 10000ms (10 seconds)

function getSessionIdFromCookies() {
  const match = document.cookie.match(/session_id="?([a-f0-9\-]+)"?/i);
  return match ? match[1] : null;
}