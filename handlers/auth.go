package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"spa/db"
	"spa/models"
	"spa/utils"
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

	response := map[string]interface{}{
		"type": "success",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

}
