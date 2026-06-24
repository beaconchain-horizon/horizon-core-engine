package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetPrices returns live cryptocurrency prices
func GetPrices() gin.HandlerFunc {
	return func(c *gin.Context) {
		// تلاش برای دریافت از API واقعی CoinGecko
		resp, err := http.Get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd")
		if err != nil {
			// در صورت خطا، داده‌های شبیه‌سازی‌شده برگردان
			c.JSON(http.StatusOK, gin.H{
				"bitcoin":  gin.H{"usd": 64000},
				"ethereum": gin.H{"usd": 3480},
				"note":     "⚠️ Using mock data (CoinGecko API unavailable)",
			})
			return
		}
		defer resp.Body.Close()

		// خواندن و پردازش پاسخ
		var data map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse prices"})
			return
		}

		// ارسال قیمت‌ها به کاربر
		c.JSON(http.StatusOK, data)
	}
}
