package db

import (
	"spa/models"
	"spa/utils"
)

func GetPosts() ([]models.PostResponse, error) {

	query := "SELECT title, content, categories, created_at, imgurl FROM posts"
	var output []models.PostResponse

	rows, err := Db.Query(query)
	if err != nil {
		return nil, err
	}

	for rows.Next() {
		var post models.PostResponse
		err := rows.Scan(&post.Title, &post.Content, &post.Categories, &post.CreatedAt, &post.Imgurl)
		if err != nil {
			return nil, err
		}
		post.Time = utils.FormatTime(post.CreatedAt)
		output = append(output, post)
	}

	return output, nil

}
