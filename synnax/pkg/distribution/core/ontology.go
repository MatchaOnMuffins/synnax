// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package core

import (
	"context"
	"fmt"
	"strconv"

	"github.com/google/uuid"
	"github.com/samber/lo"
	"github.com/synnaxlabs/alamos"
	"github.com/synnaxlabs/synnax/pkg/distribution/ontology"
	"github.com/synnaxlabs/synnax/pkg/distribution/ontology/schema"
	"github.com/synnaxlabs/x/gorp"
	"github.com/synnaxlabs/x/iter"
	"github.com/synnaxlabs/x/observe"
	"go.uber.org/zap"
)

const (
	nodeOntologyType    ontology.Type = "node"
	clusterOntologyType ontology.Type = "cluster"
)

// NodeOntologyID returns a unique identifier for a Node to use within a resource
// Ontology.
func NodeOntologyID(key NodeKey) ontology.ID {
	return ontology.ID{Type: nodeOntologyType, Key: strconv.Itoa(int(key))}
}

// ClusterOntologyID returns a unique identifier for a Cluster to use with a
// resource Ontology.
func ClusterOntologyID(key uuid.UUID) ontology.ID {
	return ontology.ID{Type: clusterOntologyType, Key: key.String()}
}

var (
	_nodeSchema = &ontology.Schema{
		Type: nodeOntologyType,
		Fields: map[string]schema.Field{
			"id":      {Type: schema.Uint32},
			"address": {Type: schema.String},
			"state":   {Type: schema.Uint32},
		},
	}
	_clusterSchema = &ontology.Schema{
		Type: clusterOntologyType,
		Fields: map[string]schema.Field{
			"key": {Type: schema.String},
		},
	}
)

// NodeOntologyService implements the ontology.Service interface to provide resource access
// to a cluster's nodes.
type NodeOntologyService struct {
	alamos.Instrumentation
	Ontology *ontology.Ontology
	Cluster  Cluster
}

var _ ontology.Service = (*NodeOntologyService)(nil)

// ListenForChanges starts listening for changes to the cluster topology (nodes leaving,
// joining, changing state, etc.) and updates the ontolgoy accordinly.
func (s *NodeOntologyService) ListenForChanges(ctx context.Context) {
	s.update(ctx, s.Cluster.PeekState())
	s.Cluster.OnChange(func(ctx context.Context, state ClusterState) {
		s.update(ctx, state)
	})
}

// OnChange implements ontology.Service.
func (s *NodeOntologyService) OnChange(f func(context.Context, iter.Next[ontology.Resource])) {
	s.Cluster.OnChange(func(ctx context.Context, state ClusterState) {
		f(ctx, newNodeIter(state))
	})
}

// OpenNext implements ontology.Service.
func (s *NodeOntologyService) OpenNext() iter.NextCloser[ontology.Resource] {
	return iter.NopNextCloser[ontology.Resource]{Wrap: newNodeIter(s.Cluster.PeekState())}
}

func newNodeIter(state ClusterState) iter.Next[ontology.Resource] {
	return iter.All(lo.MapToSlice(state.Nodes, func(_ NodeKey, n Node) ontology.Resource {
		return newNodeResource(n)
	}))
}

func (s *NodeOntologyService) update(ctx context.Context, state ClusterState) {
	err := s.Ontology.DB.WithTx(ctx, func(txn gorp.Tx) error {
		w := s.Ontology.OpenWriter(txn)
		clusterID := ClusterOntologyID(s.Cluster.Key())
		if err := w.DefineResource(ctx, clusterID); err != nil {
			return err
		}
		if err := w.DefineRelationship(ctx, ontology.RootID, ontology.ParentOf, clusterID); err != nil {
			return err
		}
		for _, n := range state.Nodes {
			nodeID := NodeOntologyID(n.Key)
			if err := w.DefineResource(ctx, NodeOntologyID(n.Key)); err != nil {
				return err
			}
			if err := w.DefineRelationship(ctx, clusterID, ontology.ParentOf, nodeID); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		s.L.Error("failed to update node ontology", zap.Error(err))
	}
}

// Schema implements ontology.Service.
func (s *NodeOntologyService) Schema() *schema.Schema { return _nodeSchema }

// RetrieveResource implements ontology.Service.
func (s *NodeOntologyService) RetrieveResource(
	_ context.Context,
	key string,
) (schema.Resource, error) {
	id, err := strconv.Atoi(key)
	if err != nil {
		return schema.Resource{}, err
	}
	n, err := s.Cluster.Node(NodeKey(id))
	return newNodeResource(n), err
}

func newNodeResource(n Node) schema.Resource {
	e := schema.NewResource(_nodeSchema, fmt.Sprintf("Node %v", n.Key))
	schema.Set(e, "key", uint32(n.Key))
	schema.Set(e, "address", n.Address.String())
	schema.Set(e, "state", uint32(n.State))
	return e
}

// ClusterOntologyService implements the ontology.Service to provide resource access
// to metadata about a Cluster.
type ClusterOntologyService struct {
	Cluster Cluster
	// Nothing will ever change about the cluster.
	observe.Noop[iter.Next[ontology.Resource]]
}

var _ ontology.Service = (*ClusterOntologyService)(nil)

// Schema implements ontology.Service.
func (s *ClusterOntologyService) Schema() *schema.Schema { return _clusterSchema }

// RetrieveResource implements ontology.Service.
func (s *ClusterOntologyService) RetrieveResource(_ context.Context, _ string) (schema.Resource, error) {
	r := schema.NewResource(_clusterSchema, "Cluster")
	schema.Set(r, "key", s.Cluster.Key())
	return r, nil
}

// OpenNext implements ontology.Service.Relationship
func (s *ClusterOntologyService) OpenNext() iter.NextCloser[schema.Resource] {
	return iter.NopNextCloser[ontology.Resource]{
		Wrap: iter.All[schema.Resource]([]schema.Resource{
			newClusterResource(s.Cluster.Key()),
		}),
	}
}

func newClusterResource(key uuid.UUID) ontology.Resource {
	e := schema.NewResource(_clusterSchema, "Cluster")
	schema.Set(e, "key", key.String())
	return e
}
