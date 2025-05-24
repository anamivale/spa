package models

import "time"

// Response structure
type Response struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// Message structure
type Message struct {
	Name       string    `json:"name"`
	ID         int       `json:"id"`
	SenderID   string    `json:"sender_id"`
	ReceiverID string    `json:"receiver_id"`
	Content    string    `json:"content"`
	Timestamp  time.Time `json:"timestamp"`
	Read       bool      `json:"read"`
	Type       string    `json:"type,omitempty"` // Message type (regular, online_users, etc.)
	Users      []User    `json:"users,omitempty"`
}
