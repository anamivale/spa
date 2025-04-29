package utils

import (
	"encoding/base64"
	"errors"
	"fmt"
	"os"
	"strings"
)

func SaveImages(encoded string, filename string) error {
	parts := strings.Split(encoded, ",")

	if len(parts) != 2 {
		return errors.New("corrupted image")
	}

	decoded, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		fmt.Println(err)
		return err
	}
	if _, err := os.Stat("web/assets/uploads/"); os.IsNotExist(err) {
		// Create the directory and any necessary parents
		err := os.MkdirAll("web/assets/uploads/", os.ModePerm)
		if err != nil {
			return fmt.Errorf("failed to create directory: %w", err)
		}
	}
	return os.WriteFile("web/assets/uploads/"+filename, decoded, 0o644)
}
