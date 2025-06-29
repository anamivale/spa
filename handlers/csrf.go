package handlers

import (
	"encoding/json"
	"net/http"
	"spa/utils"
)

// CSRFTokenHandler provides CSRF tokens to the frontend
func CSRFTokenHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Only GET method is allowed", http.StatusMethodNotAllowed)
		return
	}
	
	token, err := utils.SetCSRFToken(w)
	if err != nil {
		http.Error(w, "Failed to generate CSRF token", http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"csrf_token": token,
	})
}
