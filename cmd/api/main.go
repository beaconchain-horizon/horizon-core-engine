package main

import (
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/beaconchain-horizon/horizon-core-engine/internal/license"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, using system environment variables")
	}

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

	http.HandleFunc("/", homeHandler)
	http.HandleFunc("/api/v1/validators", validatorsHandler)
	http.HandleFunc("/api/v1/license/generate", generateLicenseHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	host := os.Getenv("HOST")
	if host == "" {
		host = "192.168.1.100" // ← آی‌پی شبکه‌ات اینجاست
	}

	log.Printf("🚀 Server is running on %s:%s", host, port)
	log.Fatal(http.ListenAndServe(host+":"+port, nil))
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Horizon Core Engine API is running",
		"status":  "ok",
	})
}

func validatorsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"validators": []string{},
		"count":      0,
	})
}

func generateLicenseHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "License generation endpoint (implement your logic here)",
	})
}
