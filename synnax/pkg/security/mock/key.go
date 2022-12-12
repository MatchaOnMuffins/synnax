package mock

import (
	"crypto"
	"crypto/rsa"
)

// KeyProvider is a mock implementation of security.KeyProvider
// that wraps an RSA private key.
type KeyProvider struct{ Key *rsa.PrivateKey }

// NodePrivate implements security.KeyProvider.
func (m KeyProvider) NodePrivate() crypto.PrivateKey { return m.Key }