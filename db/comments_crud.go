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
	commentQuery := `
			SELECT c.comment_id, c.post_id, c.content, u.nickname, u.user_id, c.created_at,
				(SELECT COUNT(*) FROM likes WHERE comment_id = c.comment_id AND like_type = 'like') AS like_count,
				(SELECT COUNT(*) FROM likes WHERE comment_id = c.comment_id AND like_type = 'dislike') AS dislike_count
			FROM comments c
			JOIN users u ON c.user_id = u.user_id
			WHERE c.post_id = ?
			ORDER BY c.created_at ASC`
	rows, err := Db.Query(commentQuery, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []models.Comment
	for rows.Next() {
		var c models.Comment
		err := rows.Scan(&c.CommentID, &c.PostID, &c.Content, &c.Username, &c.UserID, &c.CreatedAt,&c.LikeCount, &c.DislikeCount)
		if err != nil {
			return nil, err
		}
		comments = append(comments, c)
	}
	return comments, nil
}
