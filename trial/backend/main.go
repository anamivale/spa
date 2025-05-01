package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	_ "github.com/mattn/go-sqlite3"
)

// Global variables
var (
	db        *sql.DB
	clients   = make(map[int]map[*websocket.Conn]bool) // userID -> connections
	broadcast = make(chan Message)                     // Channel for broadcasting messages
	upgrader  = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true // Allow all connections
		},
	}
	mutex = &sync.Mutex{}
)

// User structure
type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Password string `json:"password"`
}

// Message structure
type Message struct {
	ID         int       `json:"id"`
	SenderID   int       `json:"sender_id"`
	ReceiverID int       `json:"receiver_id"`
	Content    string    `json:"content"`
	Timestamp  time.Time `json:"timestamp"`
	Read       bool      `json:"read"`
}

// Response structure
type Response struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func main() {
	// Initialize database
	initDB()
	defer db.Close()

	// Start WebSocket handler
	go handleMessages()

	// Static file server
	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/", fs)

	// API endpoints
	http.HandleFunc("/api/users", handleUsers)
	http.HandleFunc("/api/messages", handleMessage)
	http.HandleFunc("/api/login", handleLogin)
	http.HandleFunc("/api/register", handleRegister)
	http.HandleFunc("/api/unread", handleUnread)
	http.HandleFunc("/api/mark-read", handleMarkRead)

	// WebSocket endpoint
	http.HandleFunc("/ws", handleConnections)

	// Start server
	port := 8080
	fmt.Printf("Server starting on port %d...\n", port)
	if err := http.ListenAndServe(fmt.Sprintf(":%d", port), nil); err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

// Initialize the database
func initDB() {
	var err error

	// Create db directory if it doesn't exist
	if _, err := os.Stat("db"); os.IsNotExist(err) {
		os.Mkdir("db", 0o755)
	}

	dbPath := filepath.Join("db", "chat.db")
	db, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatal(err)
	}

	// Create tables if they don't exist
	createTables := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT UNIQUE NOT NULL,
		password TEXT NOT NULL
	);
	
	CREATE TABLE IF NOT EXISTS messages (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		sender_id INTEGER NOT NULL,
		receiver_id INTEGER NOT NULL,
		content TEXT NOT NULL,
		timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
		read BOOLEAN DEFAULT 0,
		FOREIGN KEY (sender_id) REFERENCES users (id),
		FOREIGN KEY (receiver_id) REFERENCES users (id)
	);
	`
	_, err = db.Exec(createTables)
	if err != nil {
		log.Fatal(err)
	}

	// Add some demo users if none exist
	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		log.Fatal(err)
	}

	if count == 0 {
		_, err = db.Exec("INSERT INTO users (username, password) VALUES ('alice', 'password123')")
		if err != nil {
			log.Fatal(err)
		}
		_, err = db.Exec("INSERT INTO users (username, password) VALUES ('bob', 'password123')")
		if err != nil {
			log.Fatal(err)
		}
	}
}

// Handle WebSocket connections
func handleConnections(w http.ResponseWriter, r *http.Request) {
	// Upgrade HTTP connection to WebSocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
		return
	}
	defer ws.Close()

	// Get user ID from query parameter
	userIDStr := r.URL.Query().Get("user_id")
	if userIDStr == "" {
		log.Println("No user_id provided")
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		log.Println("Invalid user_id:", userIDStr)
		return
	}

	// Register new client
	mutex.Lock()
	if clients[userID] == nil {
		clients[userID] = make(map[*websocket.Conn]bool)
	}
	clients[userID][ws] = true
	mutex.Unlock()

	// Handle incoming messages
	for {
		var msg Message
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("error: %v", err)
			mutex.Lock()
			delete(clients[userID], ws)
			mutex.Unlock()
			break
		}

		// Set sender ID from query parameter
		msg.SenderID = userID
		msg.Timestamp = time.Now()
		msg.Read = false

		// Save message to database
		result, err := db.Exec(
			"INSERT INTO messages (sender_id, receiver_id, content, timestamp, read) VALUES (?, ?, ?, ?, ?)",
			msg.SenderID, msg.ReceiverID, msg.Content, msg.Timestamp.Format("2006-01-02 15:04:05"), msg.Read,
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
func handleMessages() {
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

// Handle login requests
func handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var user User
	err := json.NewDecoder(r.Body).Decode(&user)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var id int
	var storedPassword string
	err = db.QueryRow("SELECT id, password FROM users WHERE username = ?", user.Username).Scan(&id, &storedPassword)
	if err != nil {
		sendResponse(w, "error", "Invalid username or password", nil)
		return
	}

	// In a real app, you'd use proper password hashing
	if storedPassword != user.Password{
		sendResponse(w, "error", "Invalid username or password1", nil)
		return
	}

	user.ID = id
	sendResponse(w, "success", "Login successful", user)
}

// Handle user registration
func handleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	username := r.FormValue("username")
	password := r.FormValue("password")

	if username == "" || password == "" {
		sendResponse(w, "error", "Username and password are required", nil)
		return
	}

	// In a real app, you'd hash the password
	result, err := db.Exec("INSERT INTO users (username, password) VALUES (?, ?)", username, password)
	if err != nil {
		sendResponse(w, "error", "Username already exists", nil)
		return
	}

	id, _ := result.LastInsertId()
	user := User{
		ID:       int(id),
		Username: username,
	}

	sendResponse(w, "success", "Registration successful", user)
}

// Handle users endpoint
func handleUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.Query("SELECT id, username FROM users")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var user User
		if err := rows.Scan(&user.ID, &user.Username); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		users = append(users, user)
	}

	sendResponse(w, "success", "Users retrieved", users)
}

// Handle fetching messages
func handleMessage(w http.ResponseWriter, r *http.Request) {
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

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		sendResponse(w, "error", "Invalid user_id", nil)
		return
	}

	otherUserID, err := strconv.Atoi(otherUserIDStr)
	if err != nil {
		sendResponse(w, "error", "Invalid other_user_id", nil)
		return
	}

	rows, err := db.Query(`
		SELECT id, sender_id, receiver_id, content, timestamp, read
		FROM messages
		WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
		ORDER BY timestamp ASC
	`, userID, otherUserID, otherUserID, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var messages []Message
	for rows.Next() {
		var msg Message
		var timestampStr string
		if err := rows.Scan(&msg.ID, &msg.SenderID, &msg.ReceiverID, &msg.Content, &timestampStr, &msg.Read); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		msg.Timestamp, _ = time.Parse("2006-01-02 15:04:05", timestampStr)
		messages = append(messages, msg)
	}

	sendResponse(w, "success", "Messages retrieved", messages)
}

// Handle unread messages count
func handleUnread(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userIDStr := r.URL.Query().Get("user_id")
	if userIDStr == "" {
		sendResponse(w, "error", "user_id is required", nil)
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		sendResponse(w, "error", "Invalid user_id", nil)
		return
	}

	// Count unread messages by sender
	rows, err := db.Query(`
		SELECT sender_id, COUNT(*) 
		FROM messages 
		WHERE receiver_id = ? AND read = 0 
		GROUP BY sender_id
	`, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	unreadCounts := make(map[string]int)
	totalUnread := 0

	for rows.Next() {
		var senderID int
		var count int
		if err := rows.Scan(&senderID, &count); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		unreadCounts[strconv.Itoa(senderID)] = count
		totalUnread += count
	}

	// Add total to the response
	unreadCounts["total"] = totalUnread

	sendResponse(w, "success", "Unread counts retrieved", unreadCounts)
}

// Handle marking messages as read
func handleMarkRead(w http.ResponseWriter, r *http.Request) {
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

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		sendResponse(w, "error", "Invalid user_id", nil)
		return
	}

	senderID, err := strconv.Atoi(senderIDStr)
	if err != nil {
		sendResponse(w, "error", "Invalid sender_id", nil)
		return
	}

	_, err = db.Exec("UPDATE messages SET read = 1 WHERE receiver_id = ? AND sender_id = ?", userID, senderID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	sendResponse(w, "success", "Messages marked as read", nil)
}

// Helper function to send JSON responses
func sendResponse(w http.ResponseWriter, status, message string, data interface{}) {
	response := Response{
		Status:  status,
		Message: message,
		Data:    data,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
