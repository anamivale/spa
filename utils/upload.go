package utils

import (
	"encoding/base64"
	"errors"
	"fmt"
	"os"
	"strings"
)


func SaveImages(encoded string, filename string)  error{

	parts := strings.Split(encoded, ",")

	if len(parts) != 2 {
		return errors.New("corrupted image")
	}

	decoded, err := base64.StdEncoding.DecodeString(parts[1])

	if err != nil {
		fmt.Println(err)
		return err
	}
	return os.WriteFile("web/assets/uploads/"+ filename, decoded, 0644)
	
}