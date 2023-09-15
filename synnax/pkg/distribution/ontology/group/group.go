// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package group

import (
	"github.com/google/uuid"
	"github.com/synnaxlabs/synnax/pkg/distribution/ontology"
	"github.com/synnaxlabs/x/gorp"
)

// Group is a simple grouping of resources within the cluster's ontology.
type Group struct {
	// Key is the unique identifier for the group. Will be generated on creation if not
	// set.
	Key uuid.UUID
	// Name is the name for the group.
	Name string
}

var _ gorp.Entry[uuid.UUID] = Group{}

// GorpKey implements gorp.Entry.
func (c Group) GorpKey() uuid.UUID { return c.Key }

// SetOptions implements gorp.Entry.
func (c Group) SetOptions() []interface{} { return nil }

func (c Group) OntologyID() ontology.ID { return OntologyID(c.Key) }
