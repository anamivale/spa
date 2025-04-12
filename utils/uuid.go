package utils

import "github.com/google/uuid"


func GenerateUUid() string {
	sessionID := uuid.New().String()	
	return sessionID
}