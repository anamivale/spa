package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"spa/db"
	"spa/models"
	"spa/utils"
	"strings"
)

func HandleCreateComment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	var comment models.Comment
	err := json.NewDecoder(r.Body).Decode(&comment)
	if err != nil {
		fmt.Println(err.Error())
		response := map[string]interface{}{
			"type": err.Error(),
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}
	if strings.TrimSpace(comment.Content) == ""{
		response := map[string]interface{}{
			"type": "empty body",
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	comment.CommentID = utils.GenerateUUid()
	user, err := db.GetUser(r)
	if err != nil {
		fmt.Println(err.Error())
		response := map[string]interface{}{
			"type": err.Error(),
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}
	comment.UserID = user.Id
	comment.Username = user.Nickname

	err = db.InsertComment(comment)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"message": "success",
	})
}
