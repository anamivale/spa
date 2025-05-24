package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"spa/db"
	"time"
)

// SessionCheckHandler handles session status checks from the client
func SessionCheckHandler(w http.ResponseWriter, r *http.Request) {

	cookie, err := r.Cookie("session_id")
	if err != nil || cookie.Value == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{
			"status": "unauthenticated",
		})
		return
	}

	// Validate the session
	_, valid, err := db.ValidateSession(cookie.Value)
	if err != nil {

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"status": "error",
		})
		return
	}

	if !valid {
		// If session is invalid, clear the cookie
		http.SetCookie(w, &http.Cookie{
			Name:     "session_id",
			Value:    "",
			Expires:  time.Now().Add(-time.Hour),
			Path:     "/",
		})

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{
			"status": "invalid",
		})
		return
	}

	// Session is valid
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "authenticated",
	})
}

// This can be used internally in your handler functions
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Check for session cookie
		cookie, err := r.Cookie("session_id")
		if err != nil || cookie.Value == "" {
			http.Redirect(w, r, "/", http.StatusSeeOther)
			return
		}

		// Validate session
		userID, valid, err := db.ValidateSession(cookie.Value)
		if err != nil || !valid {
			// Clear invalid cookie
			http.SetCookie(w, &http.Cookie{
				Name:     "session_id",
				Value:    "",
				Expires:  time.Now().Add(-time.Hour),
				Path:     "/",
			})
			http.Redirect(w, r, "/", http.StatusSeeOther)
			return
		}

		// Store user ID in a request header for the handler to use
		r.Header.Set("X-User-ID", userID)

		// Call the next handler
		next(w, r)
	}
}

// WrapAuthRequired is a function you can use to protect specific routes
func WrapAuthRequired(handler http.HandlerFunc) http.HandlerFunc {
	return AuthMiddleware(handler)
}

// CleanExpiredSessions periodically removes expired sessions
func CleanExpiredSessions() {
	for {
		time.Sleep(1 * time.Hour)
		err := db.DeleteExpiredSessions()
		if err != nil {
			fmt.Printf("Error cleaning expired sessions: %v\n", err)
		}
	}
}
