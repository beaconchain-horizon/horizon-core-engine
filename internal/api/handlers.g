package api

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"

	"horizon-core-engine/internal/crypto"
	"horizon-core-engine/internal/db"
	"horizon-core-engine/internal/license"
)

type Validator struct {
	Index   int     `json:"index"`
	Status  string  `json:"status"`
	Balance float64 `json:"balance"`
}

type LicenseResp struct {
	ID        string    `json:"id"`
	Volume    int       `json:"volume"`
	Root      string    `json:"root"`
	Seed      string    `json:"seed"`
	CreatedAt time.Time `json:"created_at"`
	Signature string    `json:"signature"`
}

func InitKeysHandler(w http.ResponseWriter, r *http.Request) {
	if db.PrivateKey != nil {
		http.Error(w, "key already exists", http.StatusConflict)
		return
	}
	privPEM, err := crypto.GenerateKeyPair()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := db.SavePrivateKey(privPEM); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	// reload key (in real code you'd reload from DB)
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "key generated"})
}

func ListValidatorsHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query("SELECT idx, status, balance FROM validators")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	var validators []Validator
	for rows.Next() {
		var v Validator
		rows.Scan(&v.Index, &v.Status, &v.Balance)
		validators = append(validators, v)
	}
	json.NewEncoder(w).Encode(validators)
}

func AddValidatorHandler(w http.ResponseWriter, r *http.Request) {
	var v Validator
	if err := json.NewDecoder(r.Body).Decode(&v); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	_, err := db.DB.Exec("INSERT INTO validators (idx, status, balance) VALUES (?, ?, ?)",
		v.Index, v.Status, v.Balance)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func GenerateLicenseHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Volume int `json:"volume"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if db.PrivateKey == nil {
		http.Error(w, "private key not initialized, call /init-keys first", http.StatusPreconditionFailed)
		return
	}
	pkg := license.NewPrepaidPackage(req.Volume)
	if err := pkg.Generate(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	lic := LicenseResp{
		ID:        "lic_" + strconv.FormatInt(time.Now().Unix(), 10),
		Volume:    req.Volume,
		Root:      pkg.RootHex(),
		Seed:      pkg.SeedHex(),
		CreatedAt: time.Now(),
	}
	dataToSign := []byte(lic.Root + ":" + strconv.Itoa(lic.Volume))
	sig, err := crypto.SignData(dataToSign, db.PrivateKey)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	lic.Signature = sig
	_, err = db.DB.Exec("INSERT INTO licenses (id, volume, root, seed, created_at, signature) VALUES (?, ?, ?, ?, ?, ?)",
		lic.ID, lic.Volume, lic.Root, lic.Seed, lic.CreatedAt, lic.Signature)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(lic)
}

func ListLicensesHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query("SELECT id, volume, root, created_at FROM licenses")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	var licenses []LicenseResp
	for rows.Next() {
		var l LicenseResp
		rows.Scan(&l.ID, &l.Volume, &l.Root, &l.CreatedAt)
		licenses = append(licenses, l)
	}
	json.NewEncoder(w).Encode(licenses)
}

func HealthHandler(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/init-keys", InitKeysHandler).Methods("POST")
	r.HandleFunc("/validators", ListValidatorsHandler).Methods("GET")
	r.HandleFunc("/validators", AddValidatorHandler).Methods("POST")
	r.HandleFunc("/license/generate", GenerateLicenseHandler).Methods("POST")
	r.HandleFunc("/licenses", ListLicensesHandler).Methods("GET")
	r.HandleFunc("/health", HealthHandler).Methods("GET")
}
