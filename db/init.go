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
	CreateSessionTable()
	CreatePostTable()
}
