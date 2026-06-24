package main

import (
	"beaconchain-api/internal/database"
	"beaconchain-api/internal/handlers"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env file or system environment
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️ .env file not found, using system environment variables")
	}

	// Connect to the database
	db := database.Connect()

	// Set up the Gin router
	r := gin.Default()

	// Enable CORS (allow requests from different domains)
	r.Use(cors.Default())

	// API route group
	api := r.Group("/api/v1")
	{
		api.GET("/health", handlers.HealthCheck())
		api.GET("/products", handlers.GetProducts(db))
		api.GET("/prices", handlers.GetPrices())
		api.POST("/license/generate", handlers.GenerateLicense(db))
		api.POST("/customers", handlers.CreateCustomer(db))
		api.GET("/customers", handlers.GetCustomers(db))
		api.POST("/payments", handlers.CreatePayment(db))
		api.GET("/payments", handlers.GetPayments(db))
	}

	// Get the port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Horizon backend is running on port %s", port)
	r.Run(":" + port)
}
