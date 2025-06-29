package config

import (
	"os"
	"strconv"
)

// Config holds application configuration
type Config struct {
	Environment string
	Port        string
	DBPath      string
	IsProduction bool
	EnableHTTPS  bool
}

// LoadConfig loads configuration from environment variables
func LoadConfig() *Config {
	config := &Config{
		Environment: getEnv("ENVIRONMENT", "development"),
		Port:        getEnv("PORT", "8080"),
		DBPath:      getEnv("DB_PATH", "forum.db"),
	}
	
	// Set production flag
	config.IsProduction = config.Environment == "production" || config.Environment == "prod"
	
	// Enable HTTPS in production or when explicitly set
	config.EnableHTTPS = config.IsProduction || getEnvBool("ENABLE_HTTPS", false)
	
	return config
}

// getEnv gets an environment variable with a fallback value
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// getEnvBool gets a boolean environment variable with a fallback value
func getEnvBool(key string, fallback bool) bool {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.ParseBool(value); err == nil {
			return parsed
		}
	}
	return fallback
}
