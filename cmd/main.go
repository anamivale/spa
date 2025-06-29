package main

import (
	"fmt"
	"net/http"
	"mime"
	"spa/config"
	"spa/db"
	"spa/handlers"
	"spa/utils"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

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

	// Post related handlers (with CSRF protection for state-changing operations)
	http.HandleFunc("/post", utils.CSRFMiddleware(handlers.HandleCreatePost))
	http.HandleFunc("/feeds", handlers.HandleGetPosts) // GET request, no CSRF needed
	http.HandleFunc("/comment", utils.CSRFMiddleware(handlers.HandleCreateComment))
	http.HandleFunc("/like", utils.CSRFMiddleware(handlers.LikeHandler))

	// CSRF token endpoint
	http.HandleFunc("/csrf-token", handlers.CSRFTokenHandler)

	// Authentication handlers (with CSRF protection)
	http.HandleFunc("/register", utils.CSRFMiddleware(handlers.Register))
	http.HandleFunc("/login", utils.CSRFMiddleware(handlers.Login))
	http.HandleFunc("/logout", utils.CSRFMiddleware(handlers.LogoutHandler))

	// Messaging handlers
	http.HandleFunc("/api/messages", handlers.HandleMessage)
	http.HandleFunc("/api/unread", handlers.HandleUnread)
	http.HandleFunc("/api/mark-read", handlers.HandleMarkRead)
	http.HandleFunc("/ws", handlers.HandleConnections)
	http.HandleFunc("/session-check", handlers.SessionCheckHandler)

	// Start the server
	serverAddr := ":" + cfg.Port
	if cfg.IsProduction {
		fmt.Printf("Server running in PRODUCTION mode on port %s\n", cfg.Port)
		if cfg.EnableHTTPS {
			fmt.Println("HTTPS enabled - ensure SSL certificates are configured")
		}
	} else {
		fmt.Printf("Server running in DEVELOPMENT mode at http://localhost:%s\n", cfg.Port)
	}

	http.ListenAndServe(serverAddr, nil)
}
