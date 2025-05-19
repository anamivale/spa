import { messagesUi } from "./templates.js";

// Global variables
let currentUser = null;
export let currentChatUser = null;
export let socket = null;
export let unreadCounts = {};
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let reconnectTimeout = null;
let isManualClose = false;

// Initialize the application
export function initChat() {
  const sessionId = getSessionIdFromCookies();
  if (!sessionId) return;

  currentUser = { id: sessionId };
  
  connectWebSocket();
  fetchUnreadCounts();
  setupEventListeners();
}

// Set up all event listeners
export function setupEventListeners() {
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
export function showChatInterface() {
  let feeds = document.getElementById("feeds");
  if (feeds) {
    feeds.innerHTML = messagesUi();
  }
}

// Select a user to chat with
export function selectUser(user) {
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

export function connectWebSocket() {
  if (!currentUser || !currentUser.id) {
    console.error("Cannot connect WebSocket: currentUser.id is missing");
    return;
  }

  // Clear any pending reconnection attempt
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  // Close existing connection if any
  if (socket) {
    isManualClose = true; // Mark as intentional close
    socket.close();
    socket = null;
  }

  socket = new WebSocket(`ws://${window.location.host}/ws?user_id=${currentUser.id}`);

  socket.onopen = () => {
    console.log("WebSocket connection established");
    reconnectAttempts = 0; // Reset on successful connection
    
    // Request online users immediately after connection is established
    requestOnlineUsers();
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleNewMessage(message);
  };

  socket.onclose = (event) => {
    console.log("WebSocket connection closed", event.code, event.reason);
    
    // Don't reconnect if we manually closed or user logged out
    if (isManualClose || !currentUser) {
      isManualClose = false;
      return;
    }

    // Exponential backoff for reconnection
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
    reconnectAttempts++;
    
    if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
      console.log(`Attempting reconnect in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
      reconnectTimeout = setTimeout(() => {
        connectWebSocket();
      }, delay);
    } else {
      console.error("Max reconnection attempts reached");
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
    // Errors will also trigger onclose, so we handle reconnection there
  };
}

// Function to request online users list
function requestOnlineUsers() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "get_online_users" }));
  }
}

// Add this cleanup function
export function disconnectWebSocket() {
  currentUser = null;
  isManualClose = true;
  if (socket) {
    socket.close();
    socket = null;
  }
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  reconnectAttempts = 0;
}

// Update online users list with the received data
function updateOnlineUsersList(users) {
    const onlineUsersContainer = document.getElementById("online-users");
    if (!onlineUsersContainer) return;

    onlineUsersContainer.innerHTML = '';

    if (!users || users.length === 0) {
        // Handle no users case
        const li = document.createElement("li");
        li.textContent = "No users online";
        li.className = "no-users";
        onlineUsersContainer.appendChild(li);
        return;
    }

    users.forEach(user => {
        const li = document.createElement("li");
        li.textContent = user.Nickname;
        li.dataset.userId = user.Id;

        // Add status indicator
        const statusDot = document.createElement("span");
        statusDot.className = `status-dot ${user.Status === "on" ? "online" : "offline"}`;
        li.appendChild(statusDot);

        // Add unread badge if needed
        if (unreadCounts[user.Id] && unreadCounts[user.Id] > 0) {
            const badge = document.createElement("span");
            badge.className = "unread-badge";
            badge.textContent = unreadCounts[user.Id];
            li.appendChild(badge);
        }

        li.addEventListener("click", () => {
            showChatInterface();
            setupEventListeners();
            selectUser(user);
            fetchUnreadCounts();
        });

        if (currentChatUser && currentChatUser.Id === user.Id) {
            li.classList.add("active");
        }

        onlineUsersContainer.appendChild(li);
    });
}

// Handle new message or user updates
function handleNewMessage(message) {
    
    // Handle online users update
    if (message.type === "online_users" && message.users) {
        updateOnlineUsersList(message.users);
        return;
    }
    
    // Handle regular chat message
    if (message.content) {
        // If message is for current chat, add it to the UI
        if (currentChatUser &&
            ((message.sender_id == currentChatUser.Id && message.receiver_id == currentUser.id) ||
             (message.sender_id == currentUser.id && message.receiver_id == currentChatUser.Id))
        ) {
            addMessageToUI(message);

            // If we received a message, mark it as read
            if (message.sender_id == currentChatUser.Id && message.receiver_id == currentUser.id) {
                markMessagesAsRead(currentChatUser.Id);
            }
        }
        // Update unread counts if message is for current user but not in current chat
        else if (message.receiver_id == currentUser.id) {
            fetchUnreadCounts();
        }
    }
    
    // Update user list if provided with the message
    if (message.users && message.users.length > 0) {
        updateOnlineUsersList(message.users);
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
    if (!socket || socket.readyState === WebSocket.CLOSED) {
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
export async function fetchMessages(otherUserId) {
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
  return date.toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

// Fetch unread message counts
export async function fetchUnreadCounts() {
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

// Set up a periodic ping to keep the connection alive and update users list
setInterval(() => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    // Send a ping message to request updated user list
    requestOnlineUsers();
  } else if (currentUser && (!socket || socket.readyState === WebSocket.CLOSED)) {
    // Try to reconnect if socket is closed
    connectWebSocket();
  }
}, 30000); // Every 30 seconds

// Periodically check for unread messages
setInterval(() => {
  if (currentUser) {
    fetchUnreadCounts();
  }
}, 10000); // Check every 10 seconds

function getSessionIdFromCookies() {
  const match = document.cookie.match(/session_id="?([a-f0-9\-]+)"?/i);
  return match ? match[1] : null;
}
