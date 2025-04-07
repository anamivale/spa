package handlers

import (
	"encoding/json"
	"net/http"
	"spa/db"
	"spa/models"
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
		//error display.
	}
	err = db.InsertIntoUsersTable("1", RegisterData)
	if err != nil {
		//error display
	}

	// Return updated counts and user reaction status
	response := map[string]interface{}{
		"type":      "success",
		
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

}
