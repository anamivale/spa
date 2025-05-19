package db

import (
	"database/sql"
	"fmt"
	"time"
)

// CreateSessionTable creates the sessions table if it doesn't exist
func CreateSessionTable() {
	query := `
	CREATE TABLE IF NOT EXISTS sessions (
		session_id TEXT PRIMARY KEY NOT NULL,
		user_id TEXT NOT NULL,
		created_at TIMESTAMP NOT NULL,
		expires_at TIMESTAMP NOT NULL,
		FOREIGN KEY (user_id) REFERENCES users(user_id)
	)`

	_, err := Db.Prepare(query)
	if err != nil {
		fmt.Println(err.Error())
	}

	_, err = Db.Exec(query)
	if err != nil {
		fmt.Println(err.Error())
	}
}

// InsertSession adds a new session and invalidates any existing sessions for the same user
func InsertSession(sessionID string, userID string, expiresAt time.Time) error {
	// Begin a transaction to ensure atomicity
	tx, err := Db.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// First delete any existing sessions for this user
	_, err = tx.Exec("DELETE FROM sessions WHERE user_id = ?", userID)
	if err != nil {
		return err
	}

	// Then insert the new session
	_, err = tx.Exec(
		"INSERT INTO sessions (session_id, user_id,created_at, expires_at) VALUES (?, ?,?, ?)",
		sessionID,
		userID,
		time.Now(),
		expiresAt,
	)
	if err != nil {
		return err
	}

	// Commit the transaction
	return tx.Commit()
}

// ValidateSession checks if a session is valid and not expired
func ValidateSession(sessionID string) (string, bool, error) {
	var userID string
	var expiresAt time.Time
	err := Db.QueryRow(
		"SELECT user_id, expires_at FROM sessions WHERE session_id = ?",
		sessionID,
	).Scan(&userID, &expiresAt)

	if err == sql.ErrNoRows {
		return "", false, nil
	}
	if err != nil {
		return "", false, err
	}

	// Check if session has expired
	if time.Now().After(expiresAt) {
		// Delete expired session
		_, err = Db.Exec("DELETE FROM sessions WHERE session_id = ?", sessionID)
		if err != nil {
			fmt.Println("Error deleting expired session:", err)
		}
		return "", false, nil
	}

	return userID, true, nil
}

// DeleteExpiredSessions removes all expired sessions from the database
func DeleteExpiredSessions() error {
	_, err := Db.Exec("DELETE FROM sessions WHERE expires_at < ?", time.Now())
	return err
}

// DeleteSession removes a specific session
func DeleteSession(sessionID string) error {
	_, err := Db.Exec("DELETE FROM sessions WHERE session_id = ?", sessionID)
	return err
}

// GetActiveSessionForUser retrieves the active session for a specific user
func GetActiveSessionForUser(userID string) (string, error) {
	var sessionID string
	err := Db.QueryRow(
		"SELECT session_id FROM sessions WHERE user_id = ? AND expires_at > ?",
		userID,
		time.Now(),
	).Scan(&sessionID)

	if err == sql.ErrNoRows {
		return "", nil // No active session, not an error
	}
	if err != nil {
		return "", err
	}

	return sessionID, nil
}
