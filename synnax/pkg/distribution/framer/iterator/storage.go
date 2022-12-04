package iterator

import (
	"github.com/samber/lo"
	"github.com/synnaxlabs/cesium"
	"github.com/synnaxlabs/synnax/pkg/storage"
	"github.com/synnaxlabs/x/confluence"
	"github.com/synnaxlabs/x/confluence/plumber"
)

func (s *Service) newGateway(cfg Config) (confluence.Segment[Request, Response], error) {
	iter, err := s.TS.NewStreamIterator(cesium.IteratorConfig{
		Bounds:   cfg.Bounds,
		Channels: cfg.Keys.Strings(),
	})
	if err != nil {
		return nil, err
	}
	pipe := plumber.New()
	reqT := &confluence.LinearTransform[Request, cesium.IteratorRequest]{}
	reqT.Transform = newStorageRequestTranslator()
	resT := &confluence.LinearTransform[cesium.IteratorResponse, Response]{}
	resT.Transform = newStorageResponseTranslator(s.HostResolver.HostID())
	plumber.SetSegment[cesium.IteratorRequest, cesium.IteratorResponse](pipe, "storage", iter)
	plumber.SetSegment[Request, cesium.IteratorRequest](pipe, "requests", reqT)
	plumber.SetSegment[cesium.IteratorResponse, Response](pipe, "responses", resT)
	plumber.MustConnect[storage.TSIteratorRequest](pipe, "requests", "storage", 1)
	plumber.MustConnect[storage.TSIteratorResponse](pipe, "storage", "responses", 1)
	seg := &plumber.Segment[Request, Response]{Pipeline: pipe}
	lo.Must0(seg.RouteInletTo("requests"))
	lo.Must0(seg.RouteOutletFrom("responses"))
	return seg, nil
}
