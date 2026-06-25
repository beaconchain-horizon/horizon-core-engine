package license

import (
	"crypto/ecdsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/hex"
	"encoding/pem"
	"errors"
	"fmt"
)

// VerifyLicense verifies a license key using an ECDSA public key.
// It expects the license key to be a hex-encoded signature of a known message.
// Returns true if the signature is valid, otherwise false.
func VerifyLicense(licenseKey string, publicKeyBytes []byte) (bool, error) {
	// Decode the license key from hex (assuming it's a signature)
	signature, err := hex.DecodeString(licenseKey)
	if err != nil {
		return false, fmt.Errorf("invalid license key format: %w", err)
	}

	// Parse the public key from PEM format
	block, _ := pem.Decode(publicKeyBytes)
	if block == nil {
		return false, errors.New("failed to parse PEM block containing the public key")
	}

	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return false, fmt.Errorf("failed to parse public key: %w", err)
	}

	ecdsaPub, ok := pub.(*ecdsa.PublicKey)
	if !ok {
		return false, errors.New("public key is not ECDSA")
	}

	// In a real implementation, you would verify the signature here.
	// For this example, we just check that the signature is not empty.
	if len(signature) == 0 {
		return false, errors.New("empty signature")
	}

	// Placeholder: verify that the signature matches a known message hash.
	// Replace this with actual ECDSA verification using ecdsa.VerifyASN1.
	message := []byte("Horizon Core Engine License")
	hash := sha256.Sum256(message)

	// Verify the signature (using ecdsa.VerifyASN1)
	valid := ecdsa.VerifyASN1(ecdsaPub, hash[:], signature)
	if !valid {
		return false, errors.New("signature verification failed")
	}

	return true, nil
}
