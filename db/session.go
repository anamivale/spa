package db

import (
	"errors"
	"fmt"
	"time"
)

func CreateSessionTable() error {
	query := `CREATE TABLE IF NOT EXISTS sessions (
	session_id TEXT PRIMARY KEY,
	user_id TEXT UNIQUE NOT NULL,
	expires_at DATETIME NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
	)`

	_, err := Db.Prepare(query)

	if err != nil {
		fmt.Println("Could not create session table. Error: ", err.Error())
	}
	_, err = Db.Exec(query)

	if err != nil {
		fmt.Println("Could not create session table. Error: ", err.Error())
	}

	return err
}

func InsertSession(sessionID, userID string, expiration time.Time) error {
	_, err = Db.Exec(`DELETE FROM sessions WHERE user_id = ?`, userID)
	if err != nil {
		fmt.Println(err.Error()+"delete")

		return errors.New("failed try again")
	}
	query := `INSERT INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)`
	_, err = Db.Prepare(query)
	if err != nil {
		fmt.Println(err.Error())

		return errors.New("failed try again")
	}
	_, err = Db.Exec(query, sessionID, userID, expiration)
	if err != nil {
		fmt.Println(err.Error())

		return errors.New("failed try again")
	}
	return err

}
