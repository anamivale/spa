package models

import "time"

type PostForm struct {
	Title      string
	Content    string
	Categories string
	Img        string
}

type PostResponse struct {
	PostID       string
	UserID       string
	Title        string
	Content      string
	Username     string
	Categories   string
	CreatedAt    string
	UpdatedAt    time.Time
	Comments     []Comment
	LikeCount    int
	DislikeCount int
	CommentCount int
	Imgurl       string
}

type Post struct {
	PostID     string
	UserID     string
	Title      string   `json:"title"`
	Content    string   `json:"content"`
	ImgContent string   `json:"filecontent"`
	Imgurl     string   `json:"filename"`
	Categories []string `json:"categories"`
}
