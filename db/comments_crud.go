package db

import (
	"spa/models"
)

func InsertComment(comment models.Comment) error {
	query := `
		INSERT INTO comments (comment_id, post_id, user_id, content)
		VALUES (?, ?, ?, ?)
	`
	_, err := Db.Exec(query, comment.CommentID, comment.PostID, comment.UserID, comment.Content)
	return err
}

func FetchComments(postID string) ([]models.Comment, error) {
	query := `
		SELECT c.comment_id, c.post_id, c.user_id, c.content, u.username, c.created_at
		FROM comments c
		JOIN users u ON c.user_id = u.user_id
		WHERE c.post_id = ?
		ORDER BY c.created_at ASC
	`
	rows, err := Db.Query(query, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []models.Comment
	for rows.Next() {
		var c models.Comment
		err := rows.Scan(&c.CommentID, &c.PostID, &c.UserID, &c.Content, &c.Username, &c.CreatedAt)
		if err != nil {
			return nil, err
		}
		comments = append(comments, c)
	}
	return comments, nil
}
