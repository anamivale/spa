package db

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"

	"spa/models"
	"spa/utils"
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
	email TEXT PRIMARY KEY  NOT NULL,
	status TEXT CHECK (status IN ('on', 'off')) DEFAULT 'on',
  	password TEXT NOT NULL)`

	_, err := Db.Prepare(query)
	if err != nil {
		fmt.Println(err.Error())
	}

	_, err = Db.Exec(query)
	if err != nil {
		fmt.Println(err.Error())
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
	INSERT INTO users (user_id,nickname,age, gender, fname, lname, email, password) VALUES (?,?,?,?,?,?,?,?)
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
func CheckCredentials(username, password string) (bool, error) {
	row := Db.QueryRow("SELECT password FROM users WHERE username = ?", username)
	var hashed string
	err := row.Scan(hashed)

	if err == sql.ErrNoRows {
		return false, nil
	}

	if err != nil {
		return false, err
	}
	return utils.CheckPasswordHash(password, hashed), nil
}

// **** Logout ***
func DeleteSession(id string) error {
	_, err = Db.Exec(`DELETE FROM sessions WHERE session_id = ?`, id)
	return err
}

// **** getuser ***

func GetUser(r *http.Request) []string {
	cookie, err := r.Cookie("session_id")
	if err != nil {
		// Cookie not found
		fmt.Println("Cookie not found:", err)
	}
	id := cookie.Value
	var name string
	var email string

	query := "SELECT nickname, email FROM users WHERE user_id = ?"

	err = Db.QueryRow(query, id).Scan(&name, &email)
	if err != nil {
		fmt.Println(err.Error())
		return nil
	}
	return []string{name, email}
}
