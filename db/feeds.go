package db

import (
	"fmt"

	"spa/models"
	"spa/utils"
)

func GetPosts(cat string, id string) ([]models.PostResponse, error) {

	query := `SELECT post_id, user_id, title, content, categories, created_at, imgurl 
	FROM posts 
	WHERE categories LIKE ?
	ORDER BY created_at DESC`

	if cat == "My Posts" {
		query = "SELECT post_id,user_id,  title, content, categories, created_at, imgurl FROM posts WHERE user_id = ? GROUP BY post_id ORDER BY created_at DESC"

	}

	if cat == "" || cat == "All" {
		query = "SELECT post_id,user_id,  title, content, categories, created_at, imgurl FROM posts GROUP BY post_id ORDER BY created_at DESC"

	}
	var output []models.PostResponse

	rows, err := Db.Query(query, "%"+cat+"%")
	if cat == "My Posts" {
		rows, err = Db.Query(query, id)

	}
	if err != nil {
		return nil, err
	}

	for rows.Next() {
		var post models.PostResponse
		err := rows.Scan(&post.PostID, &post.UserID, &post.Title, &post.Content, &post.Categories, &post.CreatedAt, &post.Imgurl)
		if err != nil {
			return nil, err
		}
		post.Username = GetPostUser(post.UserID)
		post.Comments, err = FetchComments(post.PostID)
		post.CommentCount = len(post.Comments)
		if err != nil {
			return nil, err
		}

		var likes, dislikes int
		countQuery := `
	SELECT 
		COALESCE(SUM(CASE WHEN like_type = 'like' THEN 1 ELSE 0 END), 0) AS likes,
		COALESCE(SUM(CASE WHEN like_type = 'dislike' THEN 1 ELSE 0 END), 0) AS dislikes
	FROM likes
	WHERE (post_id = ? OR (post_id IS NULL AND ? IS NULL)) 
	AND (comment_id = ? OR (comment_id IS NULL AND ? IS NULL))`

		err = Db.QueryRow(countQuery, post.PostID, post.PostID, nil, nil).Scan(&likes, &dislikes)
		if err != nil {
			fmt.Println("err15", err.Error())
			return nil, err

		}
		post.LikeCount = likes
		post.DislikeCount = dislikes
		post.Time = utils.FormatTime(post.CreatedAt)
		output = append(output, post)
	}

	return output, nil
}
