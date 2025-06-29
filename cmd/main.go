package main

import (
	"fmt"
	"net/http"
	"spa/db"
	"spa/handlers"
)

func main() {

	mime.AddExtensionType(".js", "application/javascript")
	mime.AddExtensionType(".css", "text/css") 
	// Initialize the database
	db.Init()

	// Start the WebSocket message handler in a goroutine
	go handlers.HandleMessages()
	go handlers.StartPersonalizedUsersBroadcaster()
	// Static file server for web assets
	http.Handle("/web/", http.StripPrefix("/web/", http.FileServer(http.Dir("web"))))

	// Route handlers
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "web/index.html")
	})

	// Post related handlers
	http.HandleFunc("/post", handlers.HandleCreatePost)
	http.HandleFunc("/feeds", handlers.HandleGetPosts)
	http.HandleFunc("/comment", handlers.HandleCreateComment)
	http.HandleFunc("/like", handlers.LikeHandler)

	// Authentication handlers
	http.HandleFunc("/register", handlers.Register)
	http.HandleFunc("/login", handlers.Login)
	http.HandleFunc("/logout", handlers.LogoutHandler)

	// Messaging handlers
	http.HandleFunc("/api/messages", handlers.HandleMessage)
	http.HandleFunc("/api/unread", handlers.HandleUnread)
	http.HandleFunc("/api/mark-read", handlers.HandleMarkRead)
	http.HandleFunc("/ws", handlers.HandleConnections)
	http.HandleFunc("/session-check", handlers.SessionCheckHandler)

	// Start the server
	fmt.Println("Server running at http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
