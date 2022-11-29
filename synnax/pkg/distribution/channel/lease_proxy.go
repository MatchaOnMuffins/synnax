package channel

import (
	"context"
	"github.com/synnaxlabs/synnax/pkg/distribution/core"
	"github.com/synnaxlabs/synnax/pkg/distribution/ontology"
	"github.com/synnaxlabs/synnax/pkg/distribution/proxy"
	"github.com/synnaxlabs/synnax/pkg/storage"
	"github.com/synnaxlabs/x/counter"
	"github.com/synnaxlabs/x/gorp"
)

type leaseProxy struct {
	Config
	router  proxy.BatchFactory[Channel]
	counter counter.Uint16Error
}

func newLeaseProxy(cfg Config) (*leaseProxy, error) {
	c, err := openCounter(cfg.HostResolver.HostID(), cfg.ClusterDB)
	if err != nil {
		return nil, err
	}
	p := &leaseProxy{
		Config:  cfg,
		router:  proxy.NewBatchFactory[Channel](cfg.HostResolver.HostID()),
		counter: c,
	}
	p.Transport.CreateServer().BindHandler(p.handle)
	return p, nil
}

func (lp *leaseProxy) handle(ctx context.Context, msg CreateMessage) (CreateMessage, error) {
	txn := lp.ClusterDB.BeginTxn()
	err := lp.create(ctx, txn, &msg.Channels)
	if err != nil {
		return CreateMessage{}, err
	}
	return CreateMessage{Channels: msg.Channels}, txn.Commit()
}

func (lp *leaseProxy) create(ctx context.Context, txn gorp.Txn, _channels *[]Channel) error {
	channels := *_channels
	for i := range channels {
		if channels[i].NodeID == 0 {
			channels[i].NodeID = lp.HostResolver.HostID()
		}
	}
	batch := lp.router.Batch(channels)
	oChannels := make([]Channel, 0, len(channels))
	for nodeID, entries := range batch.Remote {
		remoteChannels, err := lp.createRemote(ctx, nodeID, entries)
		if err != nil {
			return err
		}
		oChannels = append(oChannels, remoteChannels...)
	}
	err := lp.createLocal(txn, &batch.Local)
	if err != nil {
		return err
	}
	oChannels = append(oChannels, batch.Local...)
	*_channels = oChannels
	return nil
}

func (lp *leaseProxy) createLocal(txn gorp.Txn, channels *[]Channel) error {
	if err := lp.assignLocalKeys(channels); err != nil {
		return err
	}
	storageChannels := toStorage(*channels)
	if err := lp.TS.CreateChannel(storageChannels...); err != nil {
		return err
	}
	if err := gorp.NewCreate[Key, Channel]().Entries(channels).Exec(txn); err != nil {
		return err
	}
	return lp.maybeSetResources(txn, *channels)
}

func (lp *leaseProxy) assignLocalKeys(channels *[]Channel) error {
	v := lp.counter.Add(uint16(len(*channels)))
	if lp.counter.Error() != nil {
		return lp.counter.Error()
	}
	for i, ch := range *channels {
		ch.LocalKey = storage.ChannelKey(v - uint16(i))
		(*channels)[i] = ch
	}
	return nil
}

func (lp *leaseProxy) maybeSetResources(
	txn gorp.Txn,
	channels []Channel,
) error {
	if lp.Ontology != nil {
		w := lp.Ontology.NewWriterUsingTxn(txn)
		for _, ch := range channels {
			rtk := OntologyID(ch.Key())
			if err := w.DefineResource(rtk); err != nil {
				return err
			}
			if err := w.DefineRelationship(core.NodeOntologyID(ch.NodeID), ontology.ParentOf, rtk); err != nil {
				return err
			}
		}
	}
	return nil
}

func (lp *leaseProxy) createRemote(ctx context.Context, target core.NodeID, channels []Channel) ([]Channel, error) {
	addr, err := lp.HostResolver.Resolve(target)
	if err != nil {
		return nil, err
	}
	res, err := lp.Transport.CreateClient().Send(ctx, addr, CreateMessage{Channels: channels})
	if err != nil {
		return nil, err
	}
	return res.Channels, nil
}
