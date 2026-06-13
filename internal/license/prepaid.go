hpackage license

import (
	"crypto/rand"
	"encoding/hex"

	"horizon-core-engine/internal/crypto"
)

type PrepaidPackage struct {
	Volume int
	Seed   []byte
	Root   []byte
}

func NewPrepaidPackage(volume int) *PrepaidPackage {
	seed := make([]byte, 32)
	rand.Read(seed)
	return &PrepaidPackage{Volume: volume, Seed: seed}
}

func (p *PrepaidPackage) Generate() error {
	leaves := make([][]byte, p.Volume)
	for i := 0; i < p.Volume; i++ {
		leafData := append(p.Seed, byte(i>>24), byte(i>>16), byte(i>>8), byte(i))
		leaves[i] = crypto.Sha256Hash(leafData)
	}
	level := leaves
	for len(level) > 1 {
		var next [][]byte
		for i := 0; i < len(level); i += 2 {
			if i+1 < len(level) {
				combined := append(level[i], level[i+1]...)
				next = append(next, crypto.Sha256Hash(combined))
			} else {
				next = append(next, level[i])
			}
		}
		level = next
	}
	p.Root = level[0]
	return nil
}

func (p *PrepaidPackage) RootHex() string {
	return hex.EncodeToString(p.Root)
}

func (p *PrepaidPackage) SeedHex() string {
	return hex.EncodeToString(p.Seed)
}
