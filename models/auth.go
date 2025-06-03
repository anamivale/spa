package models

import "time"

type Login struct {
	Username string
	Password string
}

type Signup struct {
	Nickname string `json:"nickname"`
	Age      string `json:"age"`
	Gender   string `json:"gender"`
	Fname    string `json:"fname"`
	Lname    string `json:"lname"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type User struct {
	Nickname        string
	Id              string
	Status          string
	Email           string
	LastInteraction time.Time `json:"LastInteraction,omitempty"`
	Fname           string
	Lname           string
	Gender          string
	Age             string
}
