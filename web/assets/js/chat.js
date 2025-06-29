import { messagesUi } from "./templates.js";
let username

// Global variables
let currentUser = null;
export let currentChatUser = null;
export let socket = null;
export let unreadCounts = {};
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let reconnectTimeout = null;
let isManualClose = false;
let typingTimer;
let isTyping = false;
let typingUsers = new Set(); // Track who is typing
const TYPING_TIMEOUT = 3000; // 3 seconds

// Pagination variables
let currentPage = 1;
const messagesPerPage = 10;
let isLoadingMessages = false;
let hasMoreMessages = true;
let lastProcessedMessageIds = new Set(); // Track processed messages to avoid duplicates
let lastLoadTime = 0; // Timestamp of last message batch load
const LOAD_THROTTLE_DELAY = 300; // 30 seconds throttle delay for pagination

// Initialize the application
export function initChat() {
  const cookieValue = getSessionIdFromCookies();
  if (!cookieValue) return;

  const ids = cookieValue.split(":")
  const sessionId = ids[0]
  if (!sessionId) return;

  currentUser = {
    id: sessionId,
  };
  console.log(currentUser.name);

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
    messageText.addEventListener("input", handleTyping);
    messageText.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }


  // Set up scroll listener for pagination
  setupScrollListener();
}

// Show chat interface
export function showChatInterface(user) {
  // Reset pagination state
  currentPage = 1;
  hasMoreMessages = true;
  lastProcessedMessageIds.clear(); // Clear tracked message IDs when switching chats
  lastLoadTime = 0; // Reset the load timestamp

  let feeds = document.getElementById("feeds");
  if (feeds) {
    feeds.innerHTML = messagesUi();
    // Add chat header
    const header = document.createElement('h2');
    header.id = 'chat-header';
    header.textContent = user ? `Chat with ${user.Nickname}` : 'Chat';
    feeds.insertBefore(header, feeds.firstChild);
  }
  // Hide create post button
  const createPostBtn = document.getElementById("createpost");
  if (createPostBtn) createPostBtn.style.display = 'none';
}

// Select a user to chat with
export function selectUser(user) {
  currentChatUser = user;
  username = user.Nickname
  // Reset pagination state
  currentPage = 1;
  hasMoreMessages = true;
  lastProcessedMessageIds.clear(); // Clear tracked message IDs when switching chats
  lastLoadTime = 0; // Reset the load timestamp

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

    // Add initial loading indicator
    const loadingIndicator = document.createElement("div");
    loadingIndicator.className = "loading-indicator";
    loadingIndicator.id = "messages-loading";
    loadingIndicator.innerHTML = "Loading messages<span class='loading-dots'></span>";
    messagesContainer.appendChild(loadingIndicator);

    // Mark messages as read
    markMessagesAsRead(user.Id);

    // Fetch chat history (first page) without auto-scrolling
    fetchMessages(user.Id, 1, false, false);
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

const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
socket = new WebSocket(`${wsProtocol}://${window.location.host}/ws?user_id=${currentUser.id}`);

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
      showChatInterface(user);
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
    return
  }
  if (message.type === "typing_start") {
    if (currentChatUser && message.sender_id === currentChatUser.Id) {
      showTypingIndicator(username);
    }
    return;
  }
  if (message.type === "typing_stop") {
    if (currentChatUser && message.sender_id === currentChatUser.Id) {
      hideTypingIndicator(username);
    }
    return;
  }
  // Handle regular chat message
  if (message.content) {
    // Check if we've already processed this message (by ID)
    if (message.ID && lastProcessedMessageIds.has(message.ID)) {
      return; // Skip duplicate messages
    }

    // If message is for current chat, add it to the UI
    if (currentChatUser &&
      ((message.sender_id == currentChatUser.Id && message.receiver_id == currentUser.id) ||
        (message.sender_id == currentUser.id && message.receiver_id == currentChatUser.Id))
    ) {
      // Add message ID to processed set
      if (message.ID) {
        lastProcessedMessageIds.add(message.ID);
      }

      // Add the new message to the UI in real-time
      addNewMessageToUI(message);

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

// Function specifically for handling real-time messages
function addNewMessageToUI(message) {
  const messagesContainer = document.getElementById("messages");
  if (!messagesContainer) {
    console.error("Messages container not found");
    return;
  }

  // Check if the message element already exists to prevent duplicates
  if (message.ID && document.querySelector(`.message[data-id="${message.ID}"]`)) {
    return; // Skip if this message is already displayed
  }

  // Create and add the message element without date separator
  const messageElement = createMessageElement(message);
  messagesContainer.appendChild(messageElement);

  // Only scroll to bottom if we're already near the bottom
  const isNearBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 100;
  if (isNearBottom) {
    scrollToBottom();
  } else {
    // If not near bottom, show a "new message" indicator
    const newMessageIndicator = document.getElementById("new-message-indicator") || createNewMessageIndicator();
    newMessageIndicator.classList.remove("hidden");
  }
}

// Create a "new message" indicator
function createNewMessageIndicator() {
  const messagesContainer = document.getElementById("messages");
  if (!messagesContainer) return null;

  // Remove any existing indicator first
  const existingIndicator = document.getElementById("new-message-indicator");
  if (existingIndicator) {
    existingIndicator.remove();
  }

  const indicator = document.createElement("div");
  indicator.id = "new-message-indicator";
  indicator.className = "new-message-indicator hidden";
  indicator.innerHTML = "New messages ↓";
  indicator.addEventListener("click", () => {
    scrollToBottom();
    indicator.classList.add("hidden");
  });

  // Add indicator as the last child of the messages container's parent
  messagesContainer.parentNode.appendChild(indicator);

  return indicator;
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
    isTyping = false;
    clearTimeout(typingTimer);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'typing_stop',
        receiver_id: currentChatUser.Id
      }));
    }
    // Scroll to bottom only when sending a message
    scrollToBottom();
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
          scrollToBottom();
        }
      }, 500);
    }
  }
}

// Fetch messages between current user and selected user with pagination
export async function fetchMessages(otherUserId, page = 1, append = false, autoScroll = false) {
  if (!currentUser || !currentUser.id) {
    console.error("Cannot fetch messages: currentUser.id is missing");
    return;
  }

  // Don't fetch if we're already loading or there are no more messages
  if (isLoadingMessages || (page > 1 && !hasMoreMessages)) {
    return;
  }

  // Check throttle timing for pagination (except for first page)
  const now = Date.now();
  if (page > 1 && now - lastLoadTime < LOAD_THROTTLE_DELAY) {
    console.log(`Throttling message load. Wait another ${Math.ceil((LOAD_THROTTLE_DELAY - (now - lastLoadTime)) / 1000)}s.`);
    return;
  }

  const messagesContainer = document.getElementById("messages");
  if (!messagesContainer) return;

  // Add loading indicator if loading more (not first page)
  if (append) {
    const loadingIndicator = document.createElement("div");
    loadingIndicator.className = "loading-indicator";
    loadingIndicator.id = "messages-loading";
    loadingIndicator.innerHTML = "Loading messages<span class='loading-dots'></span>";
    messagesContainer.prepend(loadingIndicator);
  }

  isLoadingMessages = true;

  try {
    const response = await fetch(
      `/api/messages?user_id=${currentUser.id}&other_user_id=${otherUserId}&page=${page}&limit=${messagesPerPage}`
    );
    const data = await response.json();

    // Remove loading indicator if it exists
    const loadingIndicator = document.getElementById("messages-loading");
    if (loadingIndicator) {
      loadingIndicator.remove();
    }

    if (messagesContainer && data.status === "success") {
      // If this is the first page, clear the container
      if (!append) {
        messagesContainer.innerHTML = "";
        lastProcessedMessageIds.clear(); // Clear tracked message IDs when loading first page
      }

      // Check if we've reached the end of messages
      if (!data.data || data.data.length < messagesPerPage) {
        hasMoreMessages = false;
      }

      // Create a document fragment to batch DOM operations
      const fragment = document.createDocumentFragment();

      // Add messages to the fragment
      if (data.data && data.data.length > 0) {
        // Sort messages by timestamp to ensure proper order
        const sortedMessages = [...data.data].sort((a, b) => {
          return new Date(a.timestamp) - new Date(b.timestamp);
        });

        sortedMessages.forEach((message) => {
          // Track this message ID to avoid duplicates
          if (message.ID) {
            lastProcessedMessageIds.add(message.ID);
          }

          if (append) {
            // When appending older messages (scrolling up)
            const messageElement = createMessageElement(message);
            fragment.prepend(messageElement);
          } else {
            // When loading newer messages (initial load)
            const messageElement = createMessageElement(message);
            fragment.appendChild(messageElement);
          }
        });
      }

      // Get the current scroll position before adding new content
      const scrollPos = messagesContainer.scrollHeight - messagesContainer.scrollTop;

      // Add the fragment to the DOM
      if (append) {
        // When loading older messages, insert at the beginning
        messagesContainer.prepend(fragment);

        // Maintain scroll position after appending older content
        messagesContainer.scrollTop = messagesContainer.scrollHeight - scrollPos;
      } else {
        messagesContainer.appendChild(fragment);

        // Auto-scroll to bottom ONLY for the first page (page 1)
        if (page === 1) {
          scrollToBottom();
        }
        // For subsequent pages loaded without append (shouldn't normally happen), 
        // respect the autoScroll parameter
        else if (autoScroll) {
          scrollToBottom();
        }
      }

      // Update scroll class for shadow effect
      updateScrollClass();

      // Update current page and last load time
      currentPage = page;
      lastLoadTime = Date.now();
    }
  } catch (error) {
    console.error("Error fetching messages:", error);
    // Remove loading indicator in case of error
    const loadingIndicator = document.getElementById("messages-loading");
    if (loadingIndicator) {
      loadingIndicator.remove();
    }
  } finally {
    isLoadingMessages = false;
  }
}

// Add this function to create message elements
function createMessageElement(message) {

  const messageDiv = document.createElement("div");
  messageDiv.className =
    message.sender_id == currentUser.id
      ? "message message-sent"
      : "message message-received";

  // Store message ID as data attribute to help prevent duplicates
  if (message.ID) {
    messageDiv.dataset.id = message.ID;
  }
  const header = document.createElement("div");
  header.style.color = "black"
  header.style.fontSize = "20px"
  header.style.fontWeight = 900
  header.className = "message-header";
  header.textContent = message.name;

  const content = document.createElement("div");
  content.className = "message-content";
  content.textContent = message.content;

  const time = document.createElement("div");
  time.className = "message-time";
  time.textContent = formatTime(new Date(message.timestamp));

  messageDiv.appendChild(header);
  messageDiv.appendChild(content);
  messageDiv.appendChild(time);

  return messageDiv;
}

// Update the scroll class for CSS effects
function updateScrollClass() {
  const messagesContainer = document.getElementById("messages");
  if (!messagesContainer) return;

  if (messagesContainer.scrollHeight > messagesContainer.clientHeight) {
    messagesContainer.classList.add("scrollable");
    if (messagesContainer.scrollTop > 10) {
      messagesContainer.classList.add("scrolled");
    } else {
      messagesContainer.classList.remove("scrolled");
    }
  } else {
    messagesContainer.classList.remove("scrollable", "scrolled");
  }
}

// Set up scroll listener for loading more messages
function setupScrollListener() {
  const messagesContainer = document.getElementById("messages");
  if (!messagesContainer) return;

  // Add throttling for scroll events
  let lastScrollCheckTime = 0;
  const scrollThrottleDelay = 2; // 200ms throttling for scroll checks

  messagesContainer.addEventListener("scroll", function () {
    const now = Date.now();

    // Only process scroll events after throttle delay
    if (now - lastScrollCheckTime >= scrollThrottleDelay) {
      lastScrollCheckTime = now;

      // Update scroll class for shadow effect
      updateScrollClass();

      // Hide "new message" indicator if we're near the bottom
      const isNearBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 100;
      const indicator = document.getElementById("new-message-indicator");
      if (isNearBottom && indicator) {
        indicator.classList.add("hidden");
      }

      // If we're near the top (50px), load more messages if allowed by the 30s throttle
      if (messagesContainer.scrollTop < 50 && !isLoadingMessages && hasMoreMessages && currentChatUser) {
        // This will check internally if it can load based on the 30s throttle
        fetchMessages(currentChatUser.Id, currentPage + 1, true, false);
      }
    }
  });
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

// Add CSS for the new message indicator
function addNewMessageIndicatorStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .new-message-indicator {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #4CAF50;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      cursor: pointer;
      opacity: 0.9;
      transition: all 0.3s ease;
      z-index: 5;
    }
    
    .new-message-indicator:hover {
      opacity: 1;
      box-shadow: 0 3px 8px rgba(0,0,0,0.3);
    }
    
    .new-message-indicator.hidden {
      display: none;
    }
  `;
  document.head.appendChild(styleElement);
}

// Add styles when the document is loaded
document.addEventListener('DOMContentLoaded', addNewMessageIndicatorStyles);

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





export function clearChatState() {
  // Reset chat user
  currentChatUser = null;

  // Remove active class from all users
  const userElements = document.querySelectorAll("#online-users li");
  userElements.forEach((li) => {
    li.classList.remove("active");
  });

  // Reset pagination variables
  currentPage = 1;
  hasMoreMessages = true;
  lastProcessedMessageIds.clear();
  lastLoadTime = 0;

  // Hide message input if it exists
  const messageInput = document.getElementById("message-input");
  if (messageInput) {
    messageInput.classList.add("hidden");
  }

  // Clear messages container
  const messagesContainer = document.getElementById("messages");
  if (messagesContainer) {
    messagesContainer.innerHTML = "";
  }



  console.log("Chat state cleared");
}


function showTypingIndicator(userName) {
  if (!currentChatUser) return;

  const messagesContainer = document.getElementById("messages");
  if (!messagesContainer) return;

  // Add user to typing set
  typingUsers.add(userName);

  // Remove existing typing indicator
  hideTypingIndicator(userName);

  // Create new typing indicator
  const typingDiv = document.createElement('div');
  typingDiv.className = 'typing-indicator';
  typingDiv.id = 'typing-indicator';
  typingDiv.innerHTML = `
        <div class="typing-text"> ${userName} typing...</div>
        <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;

  messagesContainer.appendChild(typingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}


function hideTypingIndicator(userName = null) {
  if (userName) {
    typingUsers.delete(userName);
  } else {
    typingUsers.clear();
  }

  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator && typingUsers.size === 0) {
    typingIndicator.remove();
  }
}


function handleTyping() {
  if (!currentChatUser) return;

  const messageText = document.getElementById("message-text");
  if (!messageText) return;

  const isCurrentlyTyping = messageText.value.trim().length > 0;

  if (isCurrentlyTyping && !isTyping) {
    // User started typing
    isTyping = true;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'typing_start',
        receiver_id: currentChatUser.Id
      }));
    }
  }

  // Clear existing timer
  clearTimeout(typingTimer);

  // Set new timer to stop typing indicator
  typingTimer = setTimeout(() => {
    if (isTyping) {
      isTyping = false;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'typing_stop',
          receiver_id: currentChatUser.Id
        }));
      }
    }
  }, TYPING_TIMEOUT);
}
