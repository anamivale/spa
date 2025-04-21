package db

import (
	"database/sql"
	"errors"
	"fmt"
	"spa/models"
	"spa/utils"
)
// ***** Sign up ****
func createUserTable() {
	query := `
	CREATE TABLE IF NOT EXISTS users(
	ID TEXT NOT NULL,
	nickname TEXT UNIQUE NOT NULL,
	age INTERGER NOT NULL,
	gender TEXT NOT NULL,
	fname TEXT NOT NULL,
	lname TEXT NOT NULL,
	email TEXT PRIMARY KEY  NOT NULL,
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
		return errors.New("problem registering, try again")
	}
	if exists {
		return errors.New("email or nickname already taken")
	}

	query := `
	INSERT INTO users (ID,nickname,age, gender, fname, lname, email, password) VALUES (?,?,?,?,?,?,?,?)
	`

	_, err := Db.Prepare(query)

	if err != nil {
		return err
	}
	password, err := utils.EncryptPassword(resData.Password)
	if err != nil {
		return errors.New("problem registering, try again")
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


//  **** Login ***

