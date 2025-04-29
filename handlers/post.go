package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"spa/db"
	"spa/models"
	"spa/utils"
)

func HandleCreatePost(w http.ResponseWriter, r *http.Request) {

	var data models.Post
	err := json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		fmt.Println("faild to read data. Error: ", err.Error())
		response := map[string]interface{}{
			"type": err.Error(),
		}

		w.Header().Set("Content-Type", "application/json")
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
	}
	data.Imgurl = "web/assets/uploads/" + data.Imgurl


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
