package mock

import (
	. "github.com/onsi/gomega"
	"github.com/synnaxlabs/synnax/pkg/security/cert"
	"github.com/synnaxlabs/x/address"
	xfs "github.com/synnaxlabs/x/io/fs"
	. "github.com/synnaxlabs/x/testutil"
)

// SmallKeySize to run tests faster.
const SmallKeySize = 512

func GenerateCerts(fs xfs.FS) {
	f := MustSucceed(cert.NewFactory(cert.FactoryConfig{
		LoaderConfig: cert.LoaderConfig{FS: fs},
		KeySize:      SmallKeySize,
		Hosts:        []address.Address{"synnaxlabs.com"},
	}))
	Expect(f.CreateCAPair()).To(Succeed())
	Expect(f.CreateNodePair()).To(Succeed())
}
