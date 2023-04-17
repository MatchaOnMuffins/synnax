package alamos_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/synnaxlabs/alamos"
)

var _ = Describe("Alamos", func() {
	Describe("Child", func() {
		Context("No instrumentation", func() {
			It("Should correctly create a child from the given instrumentation", func() {
				i := alamos.New("test")
				c := i.Child("child")
				Expect(c.IsZero()).To(BeFalse())
				Expect(c.Meta.Path).To(Equal("test.child"))
				c2 := c.Child("child2")
				Expect(c2.IsZero()).To(BeFalse())
				Expect(c2.Meta.Path).To(Equal("test.child.child2"))
			})
		})
		Context("No-op", func() {
			It("Should not panic when calling a method on a nil instrumentation", func() {
				var i alamos.Instrumentation
				Expect(func() { i.Child("child") }).ToNot(Panic())
			})
		})
	})
})