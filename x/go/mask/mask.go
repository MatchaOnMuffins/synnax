package mask

type Mask struct {
	v [65535 / 64]uint64
}

func (m *Mask) Set(i uint16, value bool) {
	if value {
		m.v[i/64] |= 1 << (i % 64)
	} else {
		m.v[i/64] &= ^(1 << (i % 64))
	}
}
