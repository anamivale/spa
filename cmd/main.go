package main

import (
	"fmt"
	"net/http"
	"spa/db"
	"spa/handlers"
)

func main() {
	db.Init()
	http.Handle("/web/", http.StripPrefix("/web/", http.FileServer(http.Dir("web"))))
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) { http.ServeFile(w, r, "web/index.html") })
	http.HandleFunc("/post", handlers.HandleCreatePost)
	http.HandleFunc("/feeds", handlers.HandleGetPosts)
	http.HandleFunc("/logout", handlers.LogoutHandler)
	http.HandleFunc("login", handlers.Login)

	http.HandleFunc("/register", handlers.Register)
	fmt.Println("http://localhost:8080")

	http.ListenAndServe(":8080", nil)
}
