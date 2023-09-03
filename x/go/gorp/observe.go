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
	"github.com/synnaxlabs/x/kv"
	"github.com/synnaxlabs/x/observe"
)

// Observe wraps an observable key-value store and returns an observable that notifies
// its caller whenever a change is made to the provided entry type.
func Observe[K Key, E Entry[K]](kvo BaseObservable) observe.Observable[*TxReader[K, E]] {
	obs := observe.New[*TxReader[K, E]]()
	kvo.OnChange(func(ctx context.Context, reader kv.TxReader) {
		obs.Notify(ctx, WrapTxReader[K, E](reader, kvo))
	})
	return obs
}
