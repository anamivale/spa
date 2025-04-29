package db

import "fmt"



func CommentsTable()  {

	query := `
		CREATE TABLE IF NOT EXISTS comments (
		comment_id TEXT PRIMARY KEY,
		post_id TEXT NOT NULL,
		user_id TEXT NOT NULL,
		content TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
		FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
	)
	`
	_,err := Db.Exec(query)
	if err != nil {
		fmt.Println(err.Error())
	}
	
}





