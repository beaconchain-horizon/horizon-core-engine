package license

import (
	"crypto/ecdsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/hex"
	"encoding/pem"
	"errors"
	"math/big"
)

// VerifyLicense verifies a license signature using ECDSA public key
func VerifyLicense(licenseKey string, signatureHex string, publicKeyBytes []byte) (bool, error) {
	// Parse public key from PEM block
	block, _ := pem.Decode(publicKeyBytes)
	if block == nil {
		return false, errors.New("failed to parse PEM block containing the public key")
	}

	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return false, err
	}

	ecdsaPub, ok := pub.(*ecdsa.PublicKey)
	if !ok {
		return false, errors.New("not an ECDSA public key")
	}

	// Hash the license key with SHA-256
	hash := sha256.Sum256([]byte(licenseKey))

	// Decode signature from hex
	sigBytes, err := hex.DecodeString(signatureHex)
	if err != nil {
		return false, errors.New("invalid signature format")
	}

	// Extract r and s from signature (ASN.1 format)
	if len(sigBytes) < 64 {
		return false, errors.New("signature too short")
	}
	r := big.Int{}
	s := big.Int{}
	r.SetBytes(sigBytes[:len(sigBytes)/2])
	s.SetBytes(sigBytes[len(sigBytes)/2:])

	// Verify signature with public key
	valid := ecdsa.Verify(ecdsaPub, hash[:], &r, &s)
	if !valid {
		return false, errors.New("invalid signature")
	}

	return true, nil
}
