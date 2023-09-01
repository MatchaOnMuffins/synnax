
package computron_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/synnaxlabs/x/computron"
)

var _ = Describe("Computron", func() {
	It("Should multiple 2 positive numbers", func(){
		output := computron.BeginParse("2*(2 + 3)")
		Expect(output).To(Equal(float64(10.0)))
	})
})
