package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"spa/db"
	"spa/models"

	"github.com/gorilla/websocket"
)

// Global variables
var (
	clients   = make(map[string]map[*websocket.Conn]bool) // userID -> connections
	broadcast = make(chan models.Message)                 // Channel for broadcasting messages
	upgrader  = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true // Allow all connections
		},
	}
	mutex = &sync.Mutex{}
)

// Send personalized online user list to a specific user
func sendPersonalizedUsersList(userID string) {
	mutex.Lock()
	defer mutex.Unlock()

	// Get connections for this user
	connections, ok := clients[userID]
	if !ok || len(connections) == 0 {
		// User has no active connections
		return
	}

	// Get personalized users list for this user
	users, err := db.GetPersonalizedUsersList(userID)
	if err != nil {
		log.Printf("Error getting personalized users list for user %s: %v", userID, err)
		return
	}

	// Create message with user list
	msg := models.Message{
		Type:  "online_users",
		Users: users,
	}

	// Send to all connections for this user
	for conn := range connections {
		if err := conn.WriteJSON(msg); err != nil {
			log.Printf("Error sending users list to user %s: %v", userID, err)
			conn.Close()
			delete(connections, conn)
		}
	}
}

// Broadcast personalized user lists to all connected users
func broadcastAllUsersLists() {
	mutex.Lock()
	userIDs := make([]string, 0, len(clients))
	for userID := range clients {
		userIDs = append(userIDs, userID)
	}
	mutex.Unlock()

	// Send personalized list to each user
	for _, userID := range userIDs {
		sendPersonalizedUsersList(userID)
	}
}

func HandleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
		return
	}
	defer ws.Close()

	userIDStr := r.URL.Query().Get("user_id")
	if userIDStr == "" {
		log.Println("No user_id provided")
		return
	}

	// Register new client
	mutex.Lock()
	if clients[userIDStr] == nil {
		clients[userIDStr] = make(map[*websocket.Conn]bool)
	}
	clients[userIDStr][ws] = true
	mutex.Unlock()

	// Send personalized users list to the newly connected user
	go sendPersonalizedUsersList(userIDStr)
	
	// Also broadcast to everyone since someone new is online
	go broadcastAllUsersLists()

	// Set up cleanup when connection closes
	defer func() {
		mutex.Lock()
		delete(clients[userIDStr], ws)
		if len(clients[userIDStr]) == 0 {
			delete(clients, userIDStr)
			
			// Update user status to offline in the database
			_, err := db.Db.Exec("UPDATE users SET status = ? WHERE user_id = ?", "off", userIDStr)
			if err != nil {
				log.Printf("Error updating user status to offline: %v", err)
			}
		}
		mutex.Unlock()
		
		// Broadcast to everyone that a user went offline
		go broadcastAllUsersLists()
	}()

	// Handle incoming messages
	for {
		var msg models.Message
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("error: %v", err)
			break
		}

		// Handle request for online users
		if msg.Type == "get_online_users" {
			go sendPersonalizedUsersList(userIDStr)
			continue
		}

		// Set sender ID from query parameter
		msg.SenderID = userIDStr
		msg.Timestamp = time.Now()
		msg.Read = false

		// Save message to database
		result, err := db.Db.Exec(
			"INSERT INTO messages (sender_id, receiver_id, content, timestamp, read) VALUES (?, ?, ?, ?, ?)",
			msg.SenderID, msg.ReceiverID, msg.Content, time.Now(), msg.Read,
		)
		if err != nil {
			log.Println("Error saving message:", err)
			continue
		}

		// Get the ID of the inserted message
		msgID, err := result.LastInsertId()
		if err != nil {
			log.Println("Error getting message ID:", err)
		} else {
			msg.ID = int(msgID)
		}

		// Broadcast message
		broadcast <- msg
		
		// After sending a message, update user lists as interaction patterns have changed
		go broadcastAllUsersLists()
	}
}

// Periodically broadcast user lists to all clients
func StartPersonalizedUsersBroadcaster() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			broadcastAllUsersLists()
		}
	}
}

// Broadcast messages to clients
func HandleMessages() {
	for {
		msg := <-broadcast

		// Send to receiver
		mutex.Lock()
		for client := range clients[msg.ReceiverID] {
			err := client.WriteJSON(msg)
			if err != nil {
				log.Printf("error: %v", err)
				client.Close()
				delete(clients[msg.ReceiverID], client)
			}
		}

		// Also send to sender to confirm message was sent
		for client := range clients[msg.SenderID] {
			err := client.WriteJSON(msg)
			if err != nil {
				log.Printf("error: %v", err)
				client.Close()
				delete(clients[msg.SenderID], client)
			}
		}
		mutex.Unlock()
	}
}

// Handle fetching messages
func HandleMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userIDStr := r.URL.Query().Get("user_id")
	otherUserIDStr := r.URL.Query().Get("other_user_id")

	if userIDStr == "" || otherUserIDStr == "" {
		sendResponse(w, "error", "user_id and other_user_id are required", nil)
		return
	}

	rows, err := db.Db.Query(`
		SELECT id, sender_id, receiver_id, content, timestamp, read
		FROM messages
		WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
		ORDER BY timestamp ASC
	`, userIDStr, otherUserIDStr, otherUserIDStr, userIDStr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var messages []models.Message
	for rows.Next() {
		var msg models.Message
		if err := rows.Scan(&msg.ID, &msg.SenderID, &msg.ReceiverID, &msg.Content, &msg.Timestamp, &msg.Read); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		messages = append(messages, msg)
	}

	sendResponse(w, "success", "Messages retrieved", messages)
}

// Handle unread messages count
func HandleUnread(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userIDStr := r.URL.Query().Get("user_id")
	if userIDStr == "" {
		sendResponse(w, "error", "user_id is required", nil)
		return
	}

	// Count unread messages by sender
	rows, err := db.Db.Query(`
		SELECT sender_id, COUNT(*) 
		FROM messages 
		WHERE receiver_id = ? AND read = 0 
		GROUP BY sender_id
	`, userIDStr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	unreadCounts := make(map[string]int)
	totalUnread := 0

	for rows.Next() {
		var senderID string
		var count int
		if err := rows.Scan(&senderID, &count); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		unreadCounts[senderID] = count
		totalUnread += count
	}
	// Add total to the response
	unreadCounts["total"] = totalUnread

	sendResponse(w, "success", "Unread counts retrieved", unreadCounts)
}

// Handle marking messages as read
func HandleMarkRead(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userIDStr := r.FormValue("user_id")
	senderIDStr := r.FormValue("sender_id")

	if userIDStr == "" || senderIDStr == "" {
		sendResponse(w, "error", "user_id and sender_id are required", nil)
		return
	}

	_, err := db.Db.Exec("UPDATE messages SET read = 1 WHERE receiver_id = ? AND sender_id = ?", userIDStr, senderIDStr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	sendResponse(w, "success", "Messages marked as read", nil)
}

// Helper function to send JSON responses
func sendResponse(w http.ResponseWriter, status, message string, data interface{}) {
	response := models.Response{
		Status:  status,
		Message: message,
		Data:    data,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
