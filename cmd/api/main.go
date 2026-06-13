package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"

	"horizon-core-engine/internal/api"
	"horizon-core-engine/internal/db"
)

func main() {
	godotenv.Load()

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}

	if err := db.InitDB(); err != nil {
		log.Fatal("DB init failed:", err)
	}
	defer db.Close()

	r := mux.NewRouter()
	api.RegisterRoutes(r)

	log.Printf("Horizon Core Engine running on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
