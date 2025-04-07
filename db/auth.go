package db

import (
	"spa/models"
)

func InsertIntoUsersTable(id string, resData models.Signup) error {
	query := `
	INSERT INTO users (ID,nickname,age, gender, fname, lname, email, password) VALUES (?,?,?,?,?,?,?,?)
	`

	_, err := Db.Prepare(query)

	if err != nil {
		return err
	}

	_, err = Db.Exec(query, id, resData.Nickname, resData.Age, resData.Gender, resData.Fname, resData.Lname, resData.Email, resData.Password)

	if err != nil {

		return err
	}
	return nil
}
