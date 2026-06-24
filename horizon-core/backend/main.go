// ============================================================
// HORIZON CORE – Backend API Server
// Handles: products, orders, license generation, validators
// ============================================================

package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"

	"horizon-core/backend/internal/api"
	"horizon-core/backend/internal/db"
)

// ============================================================
// ENTRY POINT
// ============================================================
func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: No .env file found, using system env")
	}

	// Get server port from environment, default to 8080
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize database connection
	if err := db.InitDB(); err != nil {
		log.Fatal("Database initialization failed:", err)
	}
	defer db.Close()

	// Setup router and register all API routes
	r := mux.NewRouter()
	api.RegisterRoutes(r)

	// Start the server
	log.Printf("Horizon Core Engine running on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
