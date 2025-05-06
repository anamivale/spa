package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"spa/db"
	"spa/models"
	"spa/utils"
	"time"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

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

	id, ok, err := db.CheckCredentials(creds.Username, creds.Password)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	if !ok {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}

	// Set a session cookie
	http.SetCookie(w, &http.Cookie{
		Name:    "session_id",
		Value:   id,
		Expires: time.Now().Add(24 * time.Hour),
		Path:    "/",
	})

	json.NewEncoder(w).Encode(map[string]string{
		"message": "Login successful",
	})

}

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

	sessionID := utils.GenerateUUid()
	expiration := time.Now().Add(24 * time.Hour)
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
	http.SetCookie(w, &http.Cookie{
		Name:    "session_id",
		Value:   id,
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

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/logout" {
		return
	}

	cookie, err := r.Cookie("session_id")
	if err == nil && cookie.Value != "" {
		err := db.DeleteSession(cookie.Value)
		if err != nil {
			fmt.Printf("Error deleting session: %v", err)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode("error")
		}
	}

	http.SetCookie(w, &http.Cookie{Name: "session_id", Value: "", Expires: time.Now().Add(-time.Hour), Path: "/", HttpOnly: true})
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode("sucsess")
}
