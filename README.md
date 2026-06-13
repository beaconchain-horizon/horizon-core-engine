Beaconchain
# Horizon Core Engine

Offline‑first, API‑based blockchain validator and license manager.  
Built with Go, SQLite, Merkle trees, and ECDSA signatures.

## Features

- REST API for validator management (`/validators`)
- Prepaid license generation using Merkle tree (`/license/generate`)
- ECDSA digital signatures for license integrity
- SQLite local storage (offline‑ready)
- Environment configuration via `.env`

## Quick Start

```bash
git clone https://github.com/Beaconchain-us/horizon-core-engine
cd horizon-core-engine
cp .env.example .env
go run cmd/api/main.go
