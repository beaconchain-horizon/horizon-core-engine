package db

import (
	"crypto/ecdsa"
	"crypto/x509"
	"database/sql"
	"encoding/pem"
	"log"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB
var PrivateKey *ecdsa.PrivateKey

const defaultDBPath = "./horizon-core.db"

func InitDB() error {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = defaultDBPath
	}
	var err error
	DB, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		return err
	}

	// create tables
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS validators (
			idx INTEGER PRIMARY KEY,
			status TEXT,
			balance REAL
		);
		CREATE TABLE IF NOT EXISTS licenses (
			id TEXT PRIMARY KEY,
			volume INTEGER,
			root TEXT,
			seed TEXT,
			created_at DATETIME,
			signature TEXT
		);
		CREATE TABLE IF NOT EXISTS keys (
			id INTEGER PRIMARY KEY,
			private_key TEXT
		);
	`)
	if err != nil {
		return err
	}

	// load existing private key
	var privPEM string
	err = DB.QueryRow("SELECT private_key FROM keys LIMIT 1").Scan(&privPEM)
	if err == nil && privPEM != "" {
		block, _ := pem.Decode([]byte(privPEM))
		if block != nil {
			priv, err := x509.ParseECPrivateKey(block.Bytes)
			if err == nil {
				PrivateKey = priv
				log.Println("Private key loaded from DB")
			}
		}
	}
	return nil
}

func Close() {
	if DB != nil {
		DB.Close()
	}
}

func SavePrivateKey(pemData string) error {
	_, err := DB.Exec("INSERT INTO keys (private_key) VALUES (?)", pemData)
	return err
}
