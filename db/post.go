package db

import (
	"encoding/json"
	"spa/models"
)

func CreatePostTable() error {

	query := `CREATE TABLE IF NOT EXISTS posts (
	post_id TEXT PRIMARY KEY ,
	user_id Text NOT NULL,
	title TEXT NOT NULL,
	content TEXT NOT NULL,
	categories TEXT,
	imgurl TEXT,

	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
)`

	_, err = Db.Exec(query)
	return err
}

func InsertPost(post models.Post) error {

	query := `
	INSERT INTO posts (post_id,user_id, title, categories, content, imgurl)
	VALUES (?, ?, ?,?,?,?)`

	cat, err := json.Marshal(post.Categories)
	if err != nil {
		return err
	}
	_, err = Db.Exec(query, post.PostID, post.UserID, post.Title, string(cat), post.Content, post.Imgurl)
	return err
}
