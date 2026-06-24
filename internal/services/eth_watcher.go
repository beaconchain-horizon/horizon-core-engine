package services

import (
	"beaconchain-api/internal/models"
	"context"
	"crypto/rand"
	"encoding/hex"
	"log"
	"math/big"
	"os"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"gorm.io/gorm"
)

const (
	// آدرس کیف پول فروشگاه (ثابت)
	WALLET_ADDRESS = "0x4E94F10F0a34a0DF229e68d5902644046258D678"
	// فاصله زمانی بین هر رصد (۳۰ ثانیه)
	CHECK_INTERVAL = 30 * time.Second
)

// StartWatcher begins the blockchain monitoring service
func StartWatcher(db *gorm.DB) {
	// دریافت Project ID از متغیر محیطی
	infuraProjectID := os.Getenv("INFURA_PROJECT_ID")
	if infuraProjectID == "" {
		log.Println("⚠️ INFURA_PROJECT_ID not set. Blockchain watcher disabled.")
		return
	}

	// اتصال به شبکه اتریوم از طریق Infura
	client, err := ethclient.Dial("https://mainnet.infura.io/v3/" + infuraProjectID)
	if err != nil {
		log.Println("❌ Failed to connect to Ethereum network:", err)
		return
	}
	defer client.Close()

	log.Println("✅ Blockchain watcher started. Monitoring wallet:", WALLET_ADDRESS)

	// تیکر برای اجرای مداوم
	ticker := time.NewTicker(CHECK_INTERVAL)
	defer ticker.Stop()

	// ذخیره آخرین بلاک بررسی‌شده
	var lastBlock uint64 = 0

	for range ticker.C {
		// دریافت آخرین بلاک
		header, err := client.HeaderByNumber(context.Background(), nil)
		if err != nil {
			log.Println("⚠️ Failed to get latest block:", err)
			continue
		}
		currentBlock := header.Number.Uint64()

		// اگر بلاک جدیدی وجود ندارد، ادامه بده
		if currentBlock <= lastBlock {
			continue
		}

		// بررسی تراکنش‌های جدید از آخرین بلاک تا بلاک فعلی
		for blockNum := lastBlock + 1; blockNum <= currentBlock; blockNum++ {
			block, err := client.BlockByNumber(context.Background(), big.NewInt(int64(blockNum)))
			if err != nil {
				log.Printf("⚠️ Failed to fetch block %d: %v", blockNum, err)
				continue
			}

			// بررسی تراکنش‌های بلاک
			for _, tx := range block.Transactions() {
				// دریافت جزئیات تراکنش
				msg, err := tx.AsMessage(types.LatestSignerForChainID(tx.ChainId()), nil)
				if err != nil {
					continue
				}

				// بررسی اینکه آیا تراکنش به آدرس کیف پول فروشگاه ارسال شده است
				if msg.To() != nil && msg.To().Hex() == WALLET_ADDRESS {
					// مقدار ETH واریزی
					amount := msg.Value()
					// تبدیل به ETH (با ۱۸ رقم اعشار)
					ethAmount := new(big.Float).Quo(
						new(big.Float).SetInt(amount),
						new(big.Float).SetFloat64(1e18),
					)

					// دریافت هش تراکنش
					txHash := tx.Hash().Hex()

					log.Printf("💰 New transaction detected: %s | Amount: %.4f ETH", txHash, ethAmount)

					// به‌روزرسانی وضعیت پرداخت در دیتابیس
					var payment models.Payment
					if err := db.Where("tx_hash = ? AND status = ?", txHash, "pending").First(&payment).Error; err == nil {
						// پرداخت پیدا شد → به‌روزرسانی وضعیت
						payment.Status = "paid"
						db.Save(&payment)
						log.Printf("✅ Payment #%d updated to 'paid'", payment.ID)

						// تولید API Key برای مشتری
						apiKey := generateAPIKey()
						log.Printf("🔑 API Key generated for customer %d: %s", payment.CustomerID, apiKey)

						// ذخیره API Key در دیتابیس (در صورت وجود مدل APIKey)
						// apiKeyModel := models.APIKey{
						// 	CustomerID: payment.CustomerID,
						// 	Key:        apiKey,
						// 	Status:     "active",
						// }
						// db.Create(&apiKeyModel)

					} else {
						// اگر پرداخت در دیتابیس وجود نداشت، یک پرداخت جدید ایجاد کن (اختیاری)
						log.Printf("ℹ️ No pending payment found for tx_hash: %s", txHash)
					}
				}
			}
		}

		// به‌روزرسانی آخرین بلاک بررسی‌شده
		lastBlock = currentBlock
	}
}

// generateAPIKey generates a random API key
func generateAPIKey() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return "horizon_" + hex.EncodeToString(bytes)[:32]
}
