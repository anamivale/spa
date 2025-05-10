package models

import "time"

type Comment struct {
	CommentID    string
	PostID       string `json:"post_id"`
	UserID       string
	Content      string `json:"content"`
	Username     string
	CreatedAt    time.Time
	LikeCount    int
	DislikeCount int
}
