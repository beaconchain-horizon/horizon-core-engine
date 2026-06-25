package main

import (
	"encoding/hex"
	"log"
	"os"
	"strconv"

	"github.com/beaconchain-horizon/horizon-core-engine/internal/license"
	"github.com/joho/godotenv"
)

func main() {
	// بارگذاری فایل .env
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, using system environment variables")
	}

	// بررسی فعال بودن قفل مجوز
	enforce, _ := strconv.ParseBool(os.Getenv("LICENSE_ENFORCEMENT"))
	if enforce {
		licenseKey := os.Getenv("LICENSE_KEY")
		publicKeyHex := os.Getenv("LICENSE_PUBLIC_KEY")

		if licenseKey == "" || publicKeyHex == "" {
			log.Fatal("LICENSE_KEY and LICENSE_PUBLIC_KEY are required when LICENSE_ENFORCEMENT is true")
		}

		publicKeyBytes, err := hex.DecodeString(publicKeyHex)
		if err != nil {
			log.Fatalf("Invalid PUBLIC_KEY format: %v", err)
		}

		valid, err := license.VerifyLicense(licenseKey, publicKeyBytes)
		if err != nil || !valid {
			log.Fatal("Invalid or unauthorized license key. Commercial use requires a valid license.")
		}

		log.Println("✅ License verification passed. Starting Horizon Core API...")
	} else {
		log.Println("⚠️  License enforcement is disabled. Running in evaluation mode.")
	}

	// =============================================
	// 👇 کدهای قبلی خودت برای اجرای سرور API را اینجا قرار بده
	// مثلاً اگر قبلاً نوشته بودی:
	// router := SetupRouter()
	// router.Run(":8080")
	// =============================================
}
