package handlers

import (
	"beaconchain-api/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CreatePayment registers a new payment request
func CreatePayment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var payment models.Payment
		if err := c.ShouldBindJSON(&payment); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
			return
		}

		// بررسی وجود مشتری
		var customer models.Customer
		if err := db.First(&customer, payment.CustomerID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Customer not found"})
			return
		}

		// تنظیم وضعیت پیش‌فرض
		if payment.Status == "" {
			payment.Status = "pending"
		}

		// ذخیره‌سازی پرداخت در دیتابیس
		if err := db.Create(&payment).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": "Payment created successfully",
			"payment": payment,
		})
	}
}

// GetPayments returns a list of all payments with customer details
func GetPayments(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var payments []models.Payment
		if err := db.Preload("Customer").Find(&payments).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payments"})
			return
		}
		c.JSON(http.StatusOK, payments)
	}
}

// GetPaymentByID returns a single payment by ID
func GetPaymentByID(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var payment models.Payment
		if err := db.Preload("Customer").First(&payment, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
			return
		}
		c.JSON(http.StatusOK, payment)
	}
}

// UpdatePaymentStatus updates the status of a payment
func UpdatePaymentStatus(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var req struct {
			Status string `json:"status"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
			return
		}

		// اعتبارسنجی وضعیت
		validStatuses := map[string]bool{"pending": true, "paid": true, "failed": true}
		if !validStatuses[req.Status] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status. Allowed: pending, paid, failed"})
			return
		}

		// به‌روزرسانی پرداخت
		result := db.Model(&models.Payment{}).Where("id = ?", id).Update("status", req.Status)
		if result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update payment"})
			return
		}
		if result.RowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Payment status updated successfully"})
	}
}
