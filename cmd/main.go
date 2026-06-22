package main

import (
    "beaconchain-api/internal/database"
    "beaconchain-api/internal/handlers"
    "beaconchain-api/internal/models"
    "github.com/gin-contrib/cors"
    "github.com/gin-gonic/gin"
    "github.com/joho/godotenv"
    "log"
    "os"
)

func main() {
    // بارگذاری محیط
    godotenv.Load()

    // اتصال به دیتابیس
    db := database.Connect()
    db.AutoMigrate(&models.Product{}, &models.License{}, &models.User{})

    // روتر
    r := gin.Default()
    r.Use(cors.Default())

    // API Routes
    api := r.Group("/api/v1")
    {
        // محصولات
        api.GET("/products", handlers.GetProducts(db))
        api.GET("/products/:id", handlers.GetProduct(db))

        // لایسنس‌ها
        api.POST("/licenses", handlers.CreateLicense(db))
        api.GET("/licenses/:id", handlers.GetLicense(db))

        // اعتبارسنج‌ها (اتصال به Beaconcha.in)
        api.GET("/validators", handlers.GetValidators())
        api.GET("/validators/:index", handlers.GetValidator())

        // قیمت‌ها (اتصال به CoinGecko)
        api.GET("/prices", handlers.GetPrices())
    }

    // اجرا
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    r.Run(":" + port)
}
