package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"spa/db"
	"spa/models"
	"spa/utils"
	"strings"
	"time"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// Login function
func Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	var creds LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Authenticate the user
	id, ok, err := db.CheckCredentials(creds.Username, creds.Password)
	if err != nil {
		fmt.Println(1, err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if !ok {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}

	// Generate a new session ID
	sessionID := utils.GenerateUUid()
	expiration := time.Now().Add(24 * time.Hour)

	// Add the session to the database (this will invalidate any existing sessions)
	if err := db.InsertSession(sessionID, id, expiration); err != nil {
		fmt.Println(2, err)
		http.Error(w, "Failed to create session", http.StatusInternalServerError)
		return
	}
	sid := id + ":" + sessionID

	// Set a session cookie
	http.SetCookie(w, &http.Cookie{
		Name:    "session_id",
		Value:   sid,
		Expires: expiration,
		Path:    "/",
	})

	json.NewEncoder(w).Encode(map[string]string{
		"message": "Login successful",
	})
}

// Updated Register function

func Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		return
	}

	var RegisterData models.Signup
	err := json.NewDecoder(r.Body).Decode(&RegisterData)
	if err != nil {
		fmt.Println(err.Error())
		response := map[string]interface{}{
			"type": err.Error(),
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	var id = utils.GenerateUUid()
	err = db.InsertIntoUsersTable(id, RegisterData)
	if err != nil {
		fmt.Println(err.Error())
		response := map[string]interface{}{
			"type": err.Error(),
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	// Generate session ID and expiration
	sessionID := utils.GenerateUUid()
	expiration := time.Now().Add(24 * time.Hour)

	// Insert the session
	err = db.InsertSession(sessionID, id, expiration)
	if err != nil {
		fmt.Println(err.Error())
		response := map[string]interface{}{
			"type": err.Error(),
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}
	sid := id + ":" + sessionID

	// Set the session cookie
	http.SetCookie(w, &http.Cookie{
		Name:    "session_id",
		Value:   sid,
		Expires: expiration,
		Path:    "/",
	})

	response := map[string]interface{}{
		"type": "success",
		"user": RegisterData.Nickname,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Updated LogoutHandler

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/logout" {
		return
	}

	cookie, err := r.Cookie("session_id")
	if err == nil && cookie.Value != "" {
		// Delete the session from the database
		ids := strings.Split(cookie.Value, ":")

		err := db.DeleteSession(ids[1])
		if err != nil {
			fmt.Printf("Error deleting session: %v", err)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode("error")
			return
		}

		// Get user ID from header (set by auth middleware if used)

		_, err = db.Db.Exec("UPDATE users SET status = ? WHERE user_id = ?", "off", ids[0])
		if err != nil {
			fmt.Println("Error updating user status:", err)
		}

	}

	// Clear the cookie
	http.SetCookie(w, &http.Cookie{
		Name:    "session_id",
		Value:   "",
		Expires: time.Now().Add(-time.Hour),
		Path:    "/",
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode("success")
}
