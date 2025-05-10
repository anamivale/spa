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

	// Handle incoming messages
	for {
		var msg models.Message
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("error: %v", err)
			mutex.Lock()
			delete(clients[userIDStr], ws)
			mutex.Unlock()
			break
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
		// var timestampStr string
		if err := rows.Scan(&msg.ID, &msg.SenderID, &msg.ReceiverID, &msg.Content, &msg.Timestamp, &msg.Read); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		// msg.Timestamp, _ = time.Parse("2006-01-02 15:04:05", timestampStr)
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
