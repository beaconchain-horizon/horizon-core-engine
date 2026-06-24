package handlers

import (
	"beaconchain-api/internal/models"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// LicenseRequest represents the input for generating a license
type LicenseRequest struct {
	UserID uint `json:"user_id"`
	Volume int  `json:"volume"`
}

// GenerateLicense creates a new Merkle-based license
func GenerateLicense(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req LicenseRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
			return
		}

		// ۱. تولید یک Merkle Root تصادفی (شبیه‌سازی)
		randomBytes := make([]byte, 32)
		rand.Read(randomBytes)
		hash := sha256.Sum256(randomBytes)
		merkleRoot := hex.EncodeToString(hash[:])

		// ۲. تولید امضای دیجیتال (شبیه‌سازی - در نسخه واقعی از ECDSA استفاده می‌شود)
		signature := "0x" + hex.EncodeToString(randomBytes[:16])

		// ۳. تولید Proof (شبیه‌سازی)
		proof := "0x" + hex.EncodeToString(randomBytes[16:])

		// ۴. ذخیره‌سازی لایسنس در دیتابیس
		license := models.License{
			UserID:     req.UserID,
			Volume:     req.Volume,
			MerkleRoot: merkleRoot,
			Signature:  signature,
			Proof:      proof,
			Status:     "active",
			ExpiresAt:  time.Now().AddDate(1, 0, 0), // یک سال اعتبار
		}

		if err := db.Create(&license).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save license"})
			return
		}

		// ۵. برگشت نتیجه به کاربر
		c.JSON(http.StatusCreated, gin.H{
			"merkle_root": license.MerkleRoot,
			"signature":   license.Signature,
			"proof":       license.Proof,
			"created_at":  license.CreatedAt,
			"status":      license.Status,
		})
	}
}
