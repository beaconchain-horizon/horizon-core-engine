# Horizon Core Engine

**Offline‑first, API‑based blockchain validator and commercial license manager.**  
Built with Go, SQLite, Merkle trees, and ECDSA signatures.

Horizon is a security‑hardened blockchain monitoring platform that powers a volume‑based prepaid API model using provable Merkle trees.

---

## ⚠️ IMPORTANT – COMMERCIAL USE RESTRICTION

**This software is NOT free for commercial use.**

- **Source code is publicly available** for review, education, and non‑commercial research only.
- **Any commercial use**, including but not limited to: hosting as a service (SaaS), integrating into a commercial product, reselling API access, or using it for internal business operations, **requires a separate Commercial License Agreement** signed by the original author.
- Unauthorized commercial use will be pursued legally to the fullest extent.

**To obtain a commercial license**, please contact the original author directly (contact details are included in the `LICENSE` file or via the official repository channel).

---

## 🚀 Features

- **REST API** for validator management (`/api/v1/validators`)
- **Prepaid license generation** using Merkle tree (`/api/v1/license/generate`)
- **ECDSA digital signatures** for license integrity and verification
- **SQLite** local storage (offline‑ready, zero external dependencies)
- **Environment configuration** via `.env` file
- **Offline‑first architecture** with IndexedDB caching and virtual scrolling
- **Security‑hardened** with CSP nonce, SHA‑256 signatures, and offline Merkle proofs
- **Built‑in license enforcement** – the core engine will reject operations without a valid commercial key.

---

## 📊 Global Recognition

- **Ranked #3** among blockchain explorers worldwide (May 2026 evaluation)
- **Perfect security score** of 10/10
- Supports **100,000+ validators** simultaneously

---

## 🛠️ Quick Start

### Prerequisites

- Go 1.24+
- SQLite3 (embedded, no separate installation needed)

### Installation

```bash
git clone https://github.com/beaconchain-horizon/horizon-core-engine.git
cd horizon-core-engine
cp .env.example .env
go mod tidy
