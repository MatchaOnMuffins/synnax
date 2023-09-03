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
	"github.com/synnaxlabs/x/telem"
)

type ChannelKey = uint32

type ChannelVariant uint8

const (
	Index ChannelVariant = iota + 1
	Indexed
	Fixed
	Event
)

// Channel is a logical collection of telemetry samples across a time-range. The data
// within a channel typically arrives from a single source. This can be a physical sensor,
// metric, event, or other entity that emits regular, consistent, and time-order values.
// A channel can also be used for storing derived data, such as a moving average or
// signal processing result.
type Channel struct {
	// Key is a unique identifier to the channel within the cesium.
	// [REQUIRED]
	Key ChannelKey `json:"key" msgpack:"key"`
	// IsIndex indicates whether the channel's data should be indexed so that its data
	// can be queried by TimeStamp. Index channels must be of type TimeStamp, and must
	// hold unique, time-ordered values.
	IsIndex bool
	// DataType is the type of data stored in the channel.
	// [REQUIRED]
	DataType telem.DataType `json:"data_type" msgpack:"data_type"`
	// Rate sets the rate at which the channels values are written. This is used to
	// determine the timestamp of each sample. Rate based channels are far more efficient
	// than index based channels, and should be used whenever channel's values are
	// regularly spaced.
	Rate telem.Rate `json:"rate" msgpack:"rate"`
	// Index is the key of the channel used to index the channel's values. The Index
	// channel is used for resolving the timestamps of the channel's data. The key
	// of the provided index channel must have IsIndex set to true. If zero, the
	// channel's data will be indexed using its rate. One of Index or Rate must be
	// non-zero.
	Index ChannelKey `json:"index" msgpack:"index"`
}
