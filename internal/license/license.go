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

// VerifyLicense یک مجوز را با کلید عمومی بررسی می‌کند
func VerifyLicense(licenseKey string, signatureHex string, publicKeyBytes []byte) (bool, error) {
	// ۱. Parse کلید عمومی از PEM
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

	// ۲. هش کردن licenseKey با SHA-256
	hash := sha256.Sum256([]byte(licenseKey))

	// ۳. تبدیل امضا از هگز به بایت
	sigBytes, err := hex.DecodeString(signatureHex)
	if err != nil {
		return false, errors.New("invalid signature format")
	}

	// ۴. استخراج r و s از امضا (فرمت ASN.1)
	r := big.Int{}
	s := big.Int{}
	sigLen := len(sigBytes)
	if sigLen < 64 {
		return false, errors.New("signature too short")
	}
	r.SetBytes(sigBytes[:sigLen/2])
	s.SetBytes(sigBytes[sigLen/2:])

	// ۵. بررسی امضا با کلید عمومی
	valid := ecdsa.Verify(ecdsaPub, hash[:], &r, &s)
	if !valid {
		return false, errors.New("invalid signature")
	}

	return true, nil
}
