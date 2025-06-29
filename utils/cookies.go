package utils

import (
	"net/http"
	"os"
	"time"
)

// IsProduction checks if the app is running in production
func IsProduction() bool {
	env := os.Getenv("ENVIRONMENT")
	return env == "production" || env == "prod"
}

// SetSecureCookie sets a cookie with proper security flags based on environment
func SetSecureCookie(w http.ResponseWriter, name, value string, expiresIn time.Duration) {
	expiration := time.Now().Add(expiresIn)
	cookie := http.Cookie{
		Name:     name,
		Value:    value,
		Path:     "/",
		Expires:  expiration,
		MaxAge:   int(expiresIn.Seconds()),
		HttpOnly: false,                   // Allow JavaScript access for SPA functionality
		SameSite: http.SameSiteStrictMode, // CSRF protection
	}

	// Only set Secure flag in production (requires HTTPS)
	if IsProduction() {
		cookie.Secure = true
	}

	http.SetCookie(w, &cookie)
}

// SetCookie sets a cookie with the given name and value (legacy function for backward compatibility)
func SetCookie(w http.ResponseWriter, name, value string, expiresIn time.Duration) {
	SetSecureCookie(w, name, value, expiresIn)
}

// GetCookie retrieves a cookie by name
func GetCookie(r *http.Request, name string) (string, error) {
	cookie, err := r.Cookie(name)
	if err != nil {
		return "", err
	}
	return cookie.Value, nil
}

// DeleteSecureCookie removes a cookie by setting its expiration to the past with proper security flags
func DeleteSecureCookie(w http.ResponseWriter, name string) {
	cookie := http.Cookie{
		Name:     name,
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: false, // Match the setting used when creating the cookie
		SameSite: http.SameSiteStrictMode,
	}

	// Only set Secure flag in production
	if IsProduction() {
		cookie.Secure = true
	}

	http.SetCookie(w, &cookie)
}

// DeleteCookie removes a cookie by setting its expiration to the past (legacy function)
func DeleteCookie(w http.ResponseWriter, name string) {
	DeleteSecureCookie(w, name)
}
