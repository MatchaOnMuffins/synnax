// Code generated by "stringer -type=TSEngine"; DO NOT EDIT.

package storage

import "strconv"

func _() {
	// An "invalid array index" compiler error signifies that the constant values have changed.
	// Re-run the stringer command to generate them again.
	var x [1]struct{}
	_ = x[CesiumTS-1]
}

const _TSEngine_name = "CesiumTS"

var _TSEngine_index = [...]uint8{0, 8}

func (i TSEngine) String() string {
	i -= 1
	if i >= TSEngine(len(_TSEngine_index)-1) {
		return "TSEngine(" + strconv.FormatInt(int64(i+1), 10) + ")"
	}
	return _TSEngine_name[_TSEngine_index[i]:_TSEngine_index[i+1]]
}