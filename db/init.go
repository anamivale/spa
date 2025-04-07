package db

import (
	"database/sql"
	"fmt"

	_ "github.com/mattn/go-sqlite3"
)

var Db *sql.DB
var err error

func Init() {

	Db, err = sql.Open("sqlite3", "forum.db")
	if err != nil {
		fmt.Println(err.Error())
	}
createUserTable()
}

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
