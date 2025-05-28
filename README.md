# Single Page Application


# Real-Time Forum 

A modern, responsive, real-time web forum built using **Golang**, **JavaScript**, **HTML/CSS**, and **SQLite**, with **WebSocket-powered private messaging** and **SPA architecture**.

This project is a full-featured community discussion platform focused on **communication**, **interactivity**, and **clean architecture**. It also includes Docker support and emphasizes modular, testable code.

---

##  Objectives

This project provides a feature-rich web forum that allows:

-  User **authentication** and session management
-  Real-time **private messaging**
-  Creating and commenting on **posts**
-  **Liking/Disliking** posts and comments
-  **Category tagging** and **post filtering**
-  All data stored using **SQLite**

---

##  Features

###  Authentication

- Secure **user registration**:
  - Email (must be unique)
  - Username
  - Password (hashed for security)
- Login via email or username
- Session managed via **cookies** with expiration
- Optional UUIDs for sessions
- Prevent multiple active sessions per user

###  Private Messaging (Real-Time)

- Online/offline user list
  - Sorted by most recent message or alphabetically
- Load last 10 messages + infinite scroll (with throttling/debounce)
- Messages include timestamp and sender nickname
- WebSocket-based communication for live chat

###  Posts and Comments

- Create posts with **category tags**
- Comment on any post
- Posts and comments are:
  - Viewable by all (including guests)
  - Creatable only by registered users

###  Likes /  Dislikes

- Only registered users can like/dislike
- Total counts visible to everyone

### 🔍 Filters

- Filter posts by:
  - **Category** (subforum style)
  - **Created by you** (requires login)

---

##  Technology Stack

| Component     | Technology         |
|---------------|--------------------|
| Backend       | Go (Golang)        |
| Frontend      | JavaScript         |
| Data Storage  | SQLite             |
| Styling       | CSS                |
| Page Structure| HTML (Single File) |
| Real-time     | WebSockets         |
| Container     | Docker             |

---

##  SPA Design

This forum is a **Single Page Application (SPA)**:
- Only one HTML file used
- Navigation and rendering managed by JavaScript
- No page reloads – fully dynamic interface

---

##  Setup Instructions

```bash
git clone https://github.com/a-j-sheilla/real-time-forum.git
cd real-time-forum
go run cmd/main.go
