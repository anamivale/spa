package utils

import (
	"regexp"

	"golang.org/x/crypto/bcrypt"
)

func EncryptPassword(password string) (string, error) {

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), 15)

	return string(hashed), err

}

func ValidatePassword(password string) bool {
	if len(password) < 6 {
		return false
	}

	var (
		hasUpper   = regexp.MustCompile(`[A-Z]`).MatchString
		hasLower   = regexp.MustCompile(`[a-z]`).MatchString
		hasNumber  = regexp.MustCompile(`[0-9]`).MatchString
		hasSpecial = regexp.MustCompile(`[!\"#$%&'()*+,\-./:;<=>?@[\\\]^_{|}~]`).MatchString
	)

	return hasUpper(password) && hasLower(password) && hasNumber(password) && hasSpecial(password)
}
