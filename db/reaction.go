package db

import "fmt"

func ReactionTable() {

	query := `
		CREATE TABLE IF NOT EXISTS likes (
		like_id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		post_id TEXT,
		comment_id TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		like_type TEXT NOT NULL CHECK (like_type IN ('like', 'dislike')),
		FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
		FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
		FOREIGN KEY (comment_id) REFERENCES comments(comment_id) ON DELETE CASCADE,
		CONSTRAINT check_post_or_comment CHECK (
			(post_id IS NOT NULL AND comment_id IS NULL) OR 
			(post_id IS NULL AND comment_id IS NOT NULL)
		)
	)
	`

	_, err := Db.Exec(query)
	if err != nil {
		fmt.Println(err.Error())
	}
}
