package models

import "gorm.io/gorm"

// Product represents a product in the store
type Product struct {
	gorm.Model
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Volume      int     `json:"volume"` // number of requests (e.g. 100, 1000, 10000)
}

// Customer represents a customer/user
type Customer struct {
	gorm.Model
	Email    string `json:"email" gorm:"unique"`
	FullName string `json:"full_name"`
	Phone    string `json:"phone"`
	Wallet   string `json:"wallet"` // wallet address
}

// Payment represents a payment transaction
type Payment struct {
	gorm.Model
	CustomerID uint    `json:"customer_id"`
	Amount     float64 `json:"amount"`
	Currency   string  `json:"currency"` // ETH, USD, USDC
	Status     string  `json:"status"`   // pending, paid, failed
	TxHash     string  `json:"tx_hash"`  // transaction hash on the blockchain
}
