// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package errors

import (
	"github.com/samber/lo"
	"github.com/synnaxlabs/freighter/ferrors"
	"github.com/synnaxlabs/x/binary"
)

const freighterErrorType ferrors.Type = "synnax.api.errors"

// FreighterType implements the ferrors.Error interface.
func (t Typed) FreighterType() ferrors.Type { return freighterErrorType }

var ecd = &binary.JSONEncoderDecoder{}

func encode(err error) string {
	tErr := err.(Typed)
	if !tErr.Occurred() {
		return string(ferrors.Nil)
	}
	return string(lo.Must(ecd.Encode(nil, tErr)))
}

type rawError struct {
	Type Type        `json:"type" msgpack:"type"`
	Err  interface{} `json:"error" msgpack:"error"`
}

func decode(encoded string) error {
	var decoded rawError
	lo.Must0(ecd.Decode(nil, []byte(encoded), &decoded))
	switch decoded.Type {
	case TypeValidation:
		return parseValidationError(decoded)
	default:
		return decodeMessageError(decoded)
	}
}

func init() { ferrors.Register(freighterErrorType, encode, decode) }

func decodeMessageError(raw rawError) error {
	msgMap, ok := raw.Err.(map[string]interface{})
	if !ok {
		panic("[freighter] - invalid error message")
	}
	msg := msgMap["message"].(string)
	return newTypedMessage(raw.Type, msg)
}

func parseValidationError(raw rawError) error {
	rawFields, ok := raw.Err.([]interface{})
	if !ok {
		panic("[freighter] - invalid error message")
	}
	var fields Fields
	for _, rawField := range rawFields {
		fieldMap, ok := rawField.(map[string]interface{})
		if !ok {
			panic("[freighter] - invalid error message")
		}
		fields = append(fields, Field{
			Field:   fieldMap["field"].(string),
			Message: fieldMap["message"].(string),
		})
	}
	return Validation(fields)
}
