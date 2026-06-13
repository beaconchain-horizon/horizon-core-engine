package crypto

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/hex"
	"encoding/pem"
	"fmt"
)

func Sha256Hash(data []byte) []byte {
	h := sha256.Sum256(data)
	return h[:]
}

func SignData(data []byte, privKey *ecdsa.PrivateKey) (string, error) {
	if privKey == nil {
		return "", fmt.Errorf("private key is nil")
	}
	r, s, err := ecdsa.Sign(rand.Reader, privKey, Sha256Hash(data))
	if err != nil {
		return "", err
	}
	sig := append(r.Bytes(), s.Bytes()...)
	return hex.EncodeToString(sig), nil
}

func GenerateKeyPair() (privPEM string, err error) {
	priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return "", err
	}
	privBytes, err := x509.MarshalECPrivateKey(priv)
	if err != nil {
		return "", err
	}
	privPEM = string(pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: privBytes}))
	return privPEM, nil
}
