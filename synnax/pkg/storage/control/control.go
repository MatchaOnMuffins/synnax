package control

import (
	"github.com/synnaxlabs/synnax/pkg/storage/ts"
	"github.com/synnaxlabs/x/mask"
	"github.com/synnaxlabs/x/telem"
	"go/types"
	"sync"
)

type Authority uint8

const (
	Absolute Authority = iota
)

type Channel struct {
	Authority Authority
	Key       ts.ChannelKey
}

type Service struct {
	sync.RWMutex
	gates map[*Gate]types.Nil
}

type Gate struct {
	svc       *Service
	timeRange telem.TimeRange
	channels  map[ts.ChannelKey]Authority
}

func OpenGate(svc *Service, tr telem.TimeRange) *Gate {
	g := &Gate{
		svc:       svc,
		timeRange: tr,
	}
	svc.Lock()
	svc.gates[g] = types.Nil{}
	svc.Unlock()
	return g
}

func (g *Gate) Close() {
	g.svc.Lock()
	delete(g.svc.gates, g)
	g.svc.Unlock()
}

func (g *Gate) Set(channels map[ts.ChannelKey]Authority) {
	g.svc.Lock()
	for key, auth := range channels {
		g.channels[key] = auth
	}
	g.svc.Unlock()
}

func (g *Gate) Delete(key ts.ChannelKey) {
	g.svc.Lock()
	delete(g.channels, key)
	g.svc.Unlock()
}

func (g *Gate) Mask(channels []ts.ChannelKey, mask *mask.Mask) {
	g.svc.RLock()
	defer g.svc.RUnlock()
	for i, key := range channels {
		auth, ok := g.channels[key]
		if !ok {
			mask.Set(uint16(i), true)
		}
		for gate, _ := range g.svc.gates {
			if gate.timeRange.OverlapsWith(g.timeRange) {
				if gate.channels[key] > auth {
					mask.Set(uint16(i), true)
				}
			}
		}
	}
}
