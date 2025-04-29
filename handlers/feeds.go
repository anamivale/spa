package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"spa/db"
)


func HandleGetPosts(w http.ResponseWriter, r *http.Request)  {

	posts, err := db.GetPosts()

	if err != nil {
		fmt.Println(err.Error())
		response := map[string]interface{}{
			"type": "error",
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}

	response := map[string]interface{}{
		"type": "success",
		"response": posts,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

	
}