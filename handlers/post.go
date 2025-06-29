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

func HandleCreatePost(w http.ResponseWriter, r *http.Request) {

	var data models.Post
	err := json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		fmt.Println("failed to read data. Error: ", err.Error())
		response := map[string]interface{}{
			"type": err.Error(),
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	// Validate that at least one field (title, content, or image) is provided
	hasTitle := strings.TrimSpace(data.Title) != ""
	hasContent := strings.TrimSpace(data.Content) != ""
	hasImage := data.Imgurl != "" || data.ImgContent != ""

	if !hasTitle && !hasContent && !hasImage {
		response := map[string]interface{}{
			"type":    "error",
			"message": "Please provide at least one of the following: title, content, or image",
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	data.PostID = utils.GenerateUUid()

	if data.Imgurl != "" {
		err = utils.SaveImages(data.ImgContent, data.Imgurl)
		if err != nil {
			response := map[string]interface{}{
				"type": err.Error(),
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(response)
			return
		}
		data.Imgurl = "web/assets/uploads/" + data.Imgurl

	}
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
	data.UserID = user.Id

	err = db.InsertPost(data)
	if err != nil {
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
