// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package gorp

import (
	"context"
	"github.com/cockroachdb/errors"
	"github.com/synnaxlabs/x/query"
)

// Update is a query that updates Entries in the DB.
type Update[K Key, E Entry[K]] struct{ retrieve Retrieve[K, E] }

// NewUpdate opens a new Update query.
func NewUpdate[K Key, E Entry[K]]() Update[K, E] {
	return Update[K, E]{retrieve: NewRetrieve[K, E]()}
}

func (u Update[K, E]) Where(filter func(*E) bool) Update[K, E] {
	u.retrieve = u.retrieve.Where(filter)
	return u
}

func (u Update[K, E]) WhereKeys(keys ...K) Update[K, E] {
	u.retrieve = u.retrieve.WhereKeys(keys...)
	return u
}

func (u Update[K, E]) Change(f func(E) E) Update[K, E] {
	addChange[K, E](u.retrieve.Params, f)
	return u
}

func (u Update[K, E]) Exec(ctx context.Context, tx Tx) error {
	var entries []E
	if err := u.retrieve.Entries(&entries).Exec(ctx, tx); err != nil {
		return err
	}
	c := getChanges[K, E](u.retrieve.Params)
	if len(c) == 0 {
		return errors.Wrap(query.InvalidParameters, "[gorp] - update query must specify at least one change function")
	}
	for i, e := range entries {
		entries[i] = c.exec(e)
	}
	return WrapWriter[K, E](tx).Set(ctx, entries...)
}

const updateChangeKey = "updateChange"

type changes[K Key, E Entry[K]] []func(E) E

func (c changes[K, E]) exec(entry E) E {
	for _, change := range c {
		entry = change(entry)
	}
	return entry
}

func addChange[K Key, E Entry[K]](q query.Parameters, change func(E) E) {
	var c changes[K, E]
	rc, ok := q.Get(updateChangeKey)
	if !ok {
		c = make(changes[K, E], 0, 1)
	} else {
		c = rc.(changes[K, E])
	}
	c = append(c, change)
	q.Set(updateChangeKey, c)
}

func getChanges[K Key, E Entry[K]](q query.Parameters) (c changes[K, E]) {
	rc, ok := q.Get(updateChangeKey)
	if !ok {
		return c
	}
	return rc.(changes[K, E])
}
