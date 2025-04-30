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

func Login(w http.ResponseWriter, r *http.Request) {

	if r.Method != http.MethodPost {
		return
	}

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
		Name:     "session_id",
		Value:    id,
		Expires:  expiration,
		Path:     "/",
	})

	response := map[string]interface{}{
		"type": "success",
		"user" : RegisterData.Nickname,
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
		}
	}

	http.SetCookie(w, &http.Cookie{Name: "session_id", Value: "", Expires: time.Now().Add(-time.Hour), Path: "/", HttpOnly: true})
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode("sucsess")
}

