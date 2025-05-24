package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"spa/db"
)

func HandleGetPosts(w http.ResponseWriter, r *http.Request) {
	user, err := db.GetUser(r)

	if err != nil {
		response := map[string]interface{}{
			"type": "error",
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}
	cat := r.URL.Query().Get("cat")

	posts, err := db.GetPosts(cat, user.Id)

	if err != nil {
		fmt.Println(err.Error())
		response := map[string]interface{}{
			"type": "error",
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
	users, err := db.GetPersonalizedUsersList(user.Id)
	if err != nil {
		fmt.Println("Could not load users: ", err.Error())
	}

	response := map[string]interface{}{
		"type":     "success",
		"response": posts,
		"user":     user,
		"users":    users,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
