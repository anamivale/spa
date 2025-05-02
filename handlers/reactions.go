package handlers

import (
	"encoding/json"
	"net/http"

	"spa/db"
	"spa/models"
)

func LikeHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/like" {
		response := map[string]interface{}{
			"message": "error",
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}
	if r.Method != http.MethodPost {

		response := map[string]interface{}{
			"message": "error",
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	// Parse JSON request
	var req models.LikeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response := map[string]interface{}{
			"message": err.Error(),
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	

	if req.LikeType != "like" && req.LikeType != "dislike" {
		response := map[string]interface{}{
			"message": "wrong like type",
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}
	reaction, err := db.Reaction(req)
	if err != nil {
		response := map[string]interface{}{
			"message": err.Error(),
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	// Return updated counts and user reaction status
	response := map[string]interface{}{
		"message":      "Reaction updated",
		"likes":        reaction[0],
		"dislikes":     reaction[1],
		"userReaction": req.LikeType,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
