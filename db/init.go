package db

import (
	"database/sql"
	"fmt"

	_ "github.com/mattn/go-sqlite3"
)

var Db *sql.DB
var err error

func Init() {
	Db, err = sql.Open("sqlite3", "file:forum.db?_busy_timeout=5000&_journal_mode=WAL&cache=shared")
	if err != nil {
		fmt.Println(err.Error())
	}

	createUserTable()
	CreateSessionTable()
	CreatePostTable()
	CommentsTable()
	ReactionTable()
	MessageTable()
}
