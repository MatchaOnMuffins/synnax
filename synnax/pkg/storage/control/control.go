package control

import (
	"github.com/synnaxlabs/x/telem"
	"go/types"
	"sync"
)

type Authority uint8

const (
	Absolute Authority = iota
)

type Service[T comparable] struct {
	sync.RWMutex
	gates map[*Gate[T]]types.Nil
}

type Gate[T comparable] struct {
	svc       *Service[T]
	timeRange telem.TimeRange
	channels  map[T]Authority
}

func OpenGate[T comparable](svc *Service[T], tr telem.TimeRange) *Gate[T] {
	g := &Gate[T]{
		svc:       svc,
		timeRange: tr,
	}
	svc.Lock()
	svc.gates[g] = types.Nil{}
	svc.Unlock()
	return g
}

func (g *Gate[T]) Close() {
	g.svc.Lock()
	delete(g.svc.gates, g)
	g.svc.Unlock()
}

func (g *Gate[T]) Set(e []T, auth []Authority) {
	g.svc.Lock()
	for i, key := range e {
		g.channels[key] = auth[i]
	}
	g.svc.Unlock()
}

func (g *Gate[T]) Delete(key T) {
	g.svc.Lock()
	delete(g.channels, key)
	g.svc.Unlock()
}

func (g *Gate[T]) Check(entities []T) (failed []T) {
	g.svc.RLock()
	defer g.svc.RUnlock()
	for _, key := range entities {
		auth, ok := g.channels[key]
		if !ok {
			failed = append(failed, key)
			continue
		}
		for gate, _ := range g.svc.gates {
			if gate.timeRange.OverlapsWith(g.timeRange) {
				if gate.channels[key] > auth {
					failed = append(failed, key)
					break
				}
			}
		}
	}
	return
}
