package db

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"spa/models"
	"spa/utils"
	"strings"
)

// ***** Sign up ****
func createUserTable() {
	query := `
	CREATE TABLE IF NOT EXISTS users(
		user_id TEXT NOT NULL,
		nickname TEXT UNIQUE NOT NULL,
		age INTERGER NOT NULL,
		gender TEXT NOT NULL,
		fname TEXT NOT NULL,
		lname TEXT NOT NULL,
		email TEXT PRIMARY KEY NOT NULL,
		status TEXT CHECK (status IN ('on', 'off')) DEFAULT 'on',
		password TEXT NOT NULL
	)`

	_, err := Db.Prepare(query)
	if err != nil {
		fmt.Println(1, err.Error())
	}

	_, err = Db.Exec(query)
	if err != nil {
		fmt.Println(21, err.Error())
	}
}

func InsertIntoUsersTable(id string, resData models.Signup) error {
	exists, err1 := CheckIfUserAlredyExist(resData.Nickname, resData.Email)
	if err1 != nil {
		return errors.New("problem registering, try again, check your details")
	}
	if exists {
		return errors.New("email or nickname already taken")
	}

	query := `
	INSERT INTO users (user_id,nickname,age, gender, fname, lname, email, password)
	VALUES (?,?,?,?,?,?,?,?)
	`

	_, err := Db.Prepare(query)
	if err != nil {
		return err
	}

	password, err := utils.EncryptPassword(resData.Password)
	if err != nil {
		return errors.New("problem registering, try again, check your password")
	}

	_, err = Db.Exec(query, id, resData.Nickname, resData.Age, resData.Gender, resData.Fname, resData.Lname, resData.Email, password)
	if err != nil {
		return errors.New("problem registering, try again")
	}
	return nil
}

func CheckIfUserAlredyExist(nickname, email string) (bool, error) {
	var exists bool
	err = Db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE nickname=? Or email=?)", nickname, email).Scan(&exists)
	if err != nil && err != sql.ErrNoRows {
		return false, err
	}
	return exists, nil
}

// **** Login ***
func CheckCredentials(username, password string) (string, bool, error) {
	row := Db.QueryRow("SELECT password, user_id FROM users WHERE nickname = ? OR email = ?", username, username)
	var hashed string
	var id string
	err := row.Scan(&hashed, &id)
	if err == sql.ErrNoRows {
		return "", false, nil
	}
	if err != nil {
		return "", false, err
	}

	ok := utils.CheckPasswordHash(password, hashed)
	if !ok {
		return "", false, err
	}

	_, err = Db.Exec("UPDATE users SET status = ? WHERE user_id = ?", "on", id)
	if err != nil {
		fmt.Println("3", err.Error())
		return "", false, err
	}
	return id, ok, nil
}

// **** Logout ***
func LogoutUser(id string) error {
	// First delete the session
	_, err = Db.Exec("DELETE FROM sessions WHERE user_id = ?", id)
	if err != nil {
		fmt.Println("2", err.Error())
		return err
	}

	// Then update user status
	_, err = Db.Exec("UPDATE users SET status = ? WHERE user_id = ?", "off", id)
	if err != nil {
		fmt.Println("3", err.Error())
		return err
	}
	return nil
}

// GetUser retrieves the user from the database based on the session_id stored in the cookie
func GetUser(r *http.Request) (*models.User, error) {
	// Step 1: Retrieve session_id from the cookie
	cookie, err := r.Cookie("session_id")
	ids := strings.Split(cookie.Value, ":")
	if err != nil {
		// Cookie not found
		fmt.Println("Cookie not found:", err)
		return nil, err
	}
	userID := ids[0]

	// Step 3: Query the users table to get user details using the user_id
	var user models.User
	query := "SELECT nickname, email FROM users WHERE user_id = ?"
	err = Db.QueryRow(query, userID).Scan(&user.Nickname, &user.Email)
	if err != nil {
		if err == sql.ErrNoRows {
			// User not found for the user_id
			fmt.Println("User not found for user_id:", userID)
			return nil, fmt.Errorf("user not found")
		}
		fmt.Println("Error querying users table:", err)
		return nil, err
	}
	user.Id = userID
	// Return the user object
	return &user, nil
}

func GetPostUser(id string) string {
	var name string
	query := "SELECT nickname FROM users WHERE user_id = ?"
	err = Db.QueryRow(query, id).Scan(&name)
	if err != nil {
		fmt.Println("2", err.Error())
		return ""
	}
	return name
}


func GetUserFromId(id string) string {
	var  Nickname string
	query := "SELECT nickname FROM users WHERE user_id = ?"
	err = Db.QueryRow(query, id).Scan(&Nickname)
	if err != nil {
		if err == sql.ErrNoRows {
			// User not found for the user_id
			fmt.Println("User not found for user_id:", id)
			return ""
		}
		fmt.Println("Error querying users table:", err)
		return ""
	}
	// Return the user object
	return Nickname
}