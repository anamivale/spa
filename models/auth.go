package models

type Login struct {
	username string
	password string
}

type Signup struct {
	Nickname string `json:"name"`
	Age      string `json:"age"`
	Gender   string `json:"gender"`
	Fname    string `json:"fname"`
	Lname    string `json:"lname"`
	Email    string `json:"email"`
	Password string `json:"password"`
}
