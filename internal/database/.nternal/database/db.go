package database

import (
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "log"
    "os"
)

func Connect() *gorm.DB {
    dsn := os.Getenv("DATABASE_URL")
    if dsn == "" {
        dsn = "host=localhost user=beaconchain password=beaconchain123 dbname=beaconchain port=5432 sslmode=disable"
        log.Println("⚠️  استفاده از DSN پیش‌فرض برای دیتابیس")
    }

    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        log.Fatal("❌ خطا در اتصال به دیتابیس:", err)
    }

    log.Println("✅ اتصال به دیتابیس برقرار شد.")
    return db
}
