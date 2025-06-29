package db

import "log"

func MessageTable() {
	createTables := `
	CREATE TABLE IF NOT EXISTS messages (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		sender_id TEXT NOT NULL,
		receiver_id TEXT NOT NULL,
		content TEXT NOT NULL,
		image_url TEXT,
		image_content TEXT,
		message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image')),
		timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
		read BOOLEAN DEFAULT 0,
		FOREIGN KEY (sender_id) REFERENCES users (user_id),
		FOREIGN KEY (receiver_id) REFERENCES users (user_id)
	);
	`
	_, err = Db.Exec(createTables)
	if err != nil {
		log.Fatal(err)
	}
}
