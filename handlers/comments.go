package handlers

import (
	"encoding/json"
	"net/http"
	"spa/db"
	"spa/models"
	"spa/utils"
)

func HandleCreateComment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	var comment models.Comment
	err := json.NewDecoder(r.Body).Decode(&comment)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	comment.CommentID = utils.GenerateUUid()
	user := db.GetUser(r)
	comment.UserID = user[2]
	comment.Username = user[0]

	err = db.InsertComment(comment)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"message": "success",
	})
}
