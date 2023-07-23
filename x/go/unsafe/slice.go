// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package unsafe

import "unsafe"

func ConvertSlice[A, B any](in []A) []B {
	if len(in) == 0 {
		return nil
	}
	return unsafe.Slice((*B)(unsafe.Pointer(&in[0])), len(in))
}
