package utils

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"time"
)

// GenerateCSRFToken generates a random CSRF token
func GenerateCSRFToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}

// SetCSRFToken sets a CSRF token as a secure cookie
func SetCSRFToken(w http.ResponseWriter) (string, error) {
	token, err := GenerateCSRFToken()
	if err != nil {
		return "", err
	}
	
	// Set CSRF token as a cookie (this one needs to be accessible to JavaScript)
	cookie := http.Cookie{
		Name:     "csrf_token",
		Value:    token,
		Path:     "/",
		Expires:  time.Now().Add(24 * time.Hour),
		MaxAge:   int((24 * time.Hour).Seconds()),
		SameSite: http.SameSiteStrictMode,
	}
	
	// Only set Secure flag in production
	if IsProduction() {
		cookie.Secure = true
	}
	
	http.SetCookie(w, &cookie)
	return token, nil
}

// ValidateCSRFToken validates the CSRF token from request
func ValidateCSRFToken(r *http.Request) bool {
	// Get token from cookie
	cookie, err := r.Cookie("csrf_token")
	if err != nil {
		return false
	}
	
	// Get token from header (sent by JavaScript)
	headerToken := r.Header.Get("X-CSRF-Token")
	if headerToken == "" {
		return false
	}
	
	// Compare tokens
	return cookie.Value == headerToken && cookie.Value != ""
}

// CSRFMiddleware is middleware to protect against CSRF attacks
func CSRFMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Skip CSRF check for GET requests and session-check endpoint
		if r.Method == "GET" || r.URL.Path == "/session-check" {
			next(w, r)
			return
		}
		
		// Validate CSRF token for state-changing requests
		if !ValidateCSRFToken(r) {
			http.Error(w, "CSRF token validation failed", http.StatusForbidden)
			return
		}
		
		next(w, r)
	}
}
