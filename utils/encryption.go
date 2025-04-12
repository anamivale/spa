package utils

import (
	"golang.org/x/crypto/bcrypt"
)

func EncryptPassword(password string) (string, error) {

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), 15)

	return string(hashed), err

}
