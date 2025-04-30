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
	CreatedAt    time.Time
	Time         string
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
type LikeRequest struct {
	UserID    string `json:"user_id"`
	PostID    string `json:"post_id,omitempty"`
	CommentID string `json:"comment_id,omitempty"`
	LikeType  string `json:"like_type"`
}
