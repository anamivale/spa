package db

import "spa/models"

func GetPosts() ([]models.PostResponse, error) {

	query := "SELECT title, content, categories, created_at FROM posts"
	var output []models.PostResponse

	 rows,err := Db.Query(query)
	 if err != nil {
		return nil, err
	 }

	 for rows.Next(){
		var post models.PostResponse
		err := rows.Scan(&post.Title, &post.Content, &post.Categories, &post.CreatedAt)
		if err != nil {
			return nil, err
		 }
		 output = append(output, post)
	 }

return output, nil
	
}


