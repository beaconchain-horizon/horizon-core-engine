package license

import (
	"crypto/ecdsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/pem"
	"errors"
)

// VerifyLicense یک مجوز را با کلید عمومی بررسی می‌کند
func VerifyLicense(licenseKey string, publicKeyBytes []byte) (bool, error) {
	// Parse public key
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

	// در اینجا باید امضای مجوز را بررسی کنی.
	// فعلاً یک نمونه ساده برگردان:
	// (برای استفاده واقعی، باید امضای دیجیتال را با کلید عمومی تطابق دهی)

	return true, nil
}
