package db

import (
	"database/sql"
	"time"

	"spa/models"
)

// GetPersonalizedUsersList gets a personalized user list for a specific user
// Similar to how Discord shows users differently for each user
func GetPersonalizedUsersList(userID string) ([]models.User, error) {
	// First, get users with whom the current user has had message interactions
	// These will appear at the top of the list, sorted by most recent interaction
	messageParticipantsQuery := `
    SELECT 
        u.user_id,
        u.nickname,
        u.status,
        MAX(m.timestamp) AS last_interaction
    FROM users u
    JOIN messages m ON 
        (m.sender_id = ? AND m.receiver_id = u.user_id) OR
        (m.receiver_id = ? AND m.sender_id = u.user_id)
    WHERE u.user_id != ?
    GROUP BY u.user_id
    ORDER BY last_interaction DESC
    `

	rows, err := Db.Query(messageParticipantsQuery, userID, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var participants []models.User
	var participantIDs []interface{}

	for rows.Next() {
		var u models.User
		var lastInteraction sql.NullString

		if err := rows.Scan(
			&u.Id,
			&u.Nickname,
			&u.Status,
			&lastInteraction,
		); err != nil {
			return nil, err
		}

		if lastInteraction.Valid {
			parsedTime, err := time.Parse("2006-01-02 15:04:05", lastInteraction.String)
			if err == nil {
				u.LastInteraction = parsedTime
			}
		}

		participants = append(participants, u)
		participantIDs = append(participantIDs, u.Id)
	}

	// Now get all other users that the current user hasn't interacted with
	// These will appear below the interaction users, sorted by online status first, then alphabetically
	otherUsersQuery := `
    SELECT 
        user_id,
        nickname,
        status
    FROM users
    WHERE user_id != ?
    `

	args := []interface{}{userID}

	// Add exclusion for users we already have
	if len(participantIDs) > 0 {
		otherUsersQuery += " AND user_id NOT IN ("
		placeholders := ""
		for i := range participantIDs {
			if i > 0 {
				placeholders += ", "
			}
			placeholders += "?"
		}
		otherUsersQuery += placeholders + ")"
		args = append(args, participantIDs...)
	}

	// Sort by online status first (online users first), then alphabetically by nickname
	otherUsersQuery += " ORDER BY CASE WHEN status = 'on' THEN 0 ELSE 1 END, nickname ASC"

	otherRows, err := Db.Query(otherUsersQuery, args...)
	if err != nil {
		return nil, err
	}
	defer otherRows.Close()

	var otherUsers []models.User
	for otherRows.Next() {
		var u models.User
		if err := otherRows.Scan(
			&u.Id,
			&u.Nickname,
			&u.Status,
		); err != nil {
			return nil, err
		}
		otherUsers = append(otherUsers, u)
	}

	// Combine the two lists: participants first (sorted by recent interaction),
	// then other users (sorted by online status, then alphabetically)
	allUsers := append(participants, otherUsers...)
	return allUsers, nil
}
