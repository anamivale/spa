package utils

import (
	"net/http"
	"time"
)

// SetCookie sets a cookie with the given name and value
func SetCookie(w http.ResponseWriter, name, value string, expiresIn time.Duration) {
	expiration := time.Now().Add(expiresIn)
	cookie := http.Cookie{
		Name:     name,
		Value:    value,
		Path:     "/",
		Expires:  expiration,
		MaxAge:   int(expiresIn.Seconds()),
		SameSite: http.SameSiteLaxMode,
		// Set Secure to true in production with HTTPS
		// Secure: true,
	}
	http.SetCookie(w, &cookie)
}

// GetCookie retrieves a cookie by name
func GetCookie(r *http.Request, name string) (string, error) {
	cookie, err := r.Cookie(name)
	if err != nil {
		return "", err
	}
	return cookie.Value, nil
}

// DeleteCookie removes a cookie by setting its expiration to the past
func DeleteCookie(w http.ResponseWriter, name string) {
	cookie := http.Cookie{
		Name:     name,
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, &cookie)
}
