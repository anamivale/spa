package db

import (
	"database/sql"
	"fmt"

	"spa/models"
	"spa/utils"
)

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

func Reaction(req models.LikeRequest) ([]int, error) {
	id := utils.GenerateUUid()
	PostID := sql.NullString{Valid: req.PostID != "", String: req.PostID}
	CommentID := sql.NullString{Valid: req.CommentID != "", String: req.CommentID}
	var existingLikeType string
	query := `SELECT like_type FROM likes WHERE user_id = ? AND post_id IS ? AND comment_id IS ?`
	err := Db.QueryRow(query, req.UserID, PostID, CommentID).Scan(&existingLikeType)

	if err == sql.ErrNoRows {
		insertQuery := `INSERT INTO likes (like_id,user_id, post_id, comment_id, like_type) VALUES (?,?, ?, ?, ?)`
		_, err = Db.Exec(insertQuery, id, req.UserID, PostID, CommentID, req.LikeType)
		if err != nil {
			fmt.Println("err1", err.Error())

			return nil, err
		}
	} else if err == nil {
		// If the user already reacted
		if existingLikeType == req.LikeType {
			// User clicked the same reaction → Remove it (unlike/undislike)
			deleteQuery := `DELETE FROM likes WHERE user_id = ? AND post_id IS ? AND comment_id IS ?`
			_, err = Db.Exec(deleteQuery, req.UserID, PostID, CommentID)
			if err != nil {
				fmt.Println("err2", err.Error())

				return nil, err
			}
		} else {
			// User clicked opposite reaction → Toggle it (like ↔ dislike)
			updateQuery := `UPDATE likes SET like_type = ? WHERE user_id = ? AND post_id IS ? AND comment_id IS ?`
			_, err = Db.Exec(updateQuery, req.LikeType, req.UserID, PostID, CommentID)
			if err != nil {
				fmt.Println("err13", err.Error())

				return nil, err
			}
		}
	}

	var likes, dislikes int
	countQuery := `
	SELECT 
		COALESCE(SUM(CASE WHEN like_type = 'like' THEN 1 ELSE 0 END), 0) AS likes,
		COALESCE(SUM(CASE WHEN like_type = 'dislike' THEN 1 ELSE 0 END), 0) AS dislikes
	FROM likes
	WHERE (post_id = ? OR (post_id IS NULL AND ? IS NULL)) 
	AND (comment_id = ? OR (comment_id IS NULL AND ? IS NULL))`

	err = Db.QueryRow(countQuery, PostID, PostID, CommentID, CommentID).Scan(&likes, &dislikes)
	if err != nil {
		fmt.Println("err15", err.Error())
		return nil, err

	}

	return []int{likes, dislikes}, err
}
