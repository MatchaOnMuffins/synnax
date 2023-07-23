// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package api

import (
	"context"

	"github.com/synnaxlabs/synnax/pkg/api/errors"
	"github.com/synnaxlabs/synnax/pkg/distribution/ontology"
	"github.com/synnaxlabs/synnax/pkg/distribution/ontology/search"
)

type OntologyService struct {
	validationProvider
	OntologyProvider
}

func NewOntologyService(p Provider) *OntologyService {
	return &OntologyService{
		OntologyProvider:   p.ontology,
		validationProvider: p.Validation,
	}
}

type OntologyRetrieveRequest struct {
	IDs              []ontology.ID `json:"ids" msgpack:"ids" validate:"required"`
	Children         bool          `json:"children" msgpack:"children"`
	Parents          bool          `json:"parents" msgpack:"parents"`
	IncludeSchema    bool          `json:"include_schema" msgpack:"include_schema" default:"true"`
	IncludeFieldData bool          `json:"include_field_data" msgpack:"include_field_data" default:"true"`
	Term             string        `json:"term" msgpack:"term"`
}

type OntologyRetrieveResponse struct {
	Resources []ontology.Resource `json:"resources" msgpack:"resources"`
}

func (o *OntologyService) Retrieve(
	ctx context.Context,
	req OntologyRetrieveRequest,
) (res OntologyRetrieveResponse, err errors.Typed) {
	res.Resources = []ontology.Resource{}
	if req.Term != "" {
		var _err error
		res.Resources, _err = o.Ontology.Search(ctx, search.Request{
			Term: req.Term,
		})
		return res, errors.MaybeQuery(_err)
	}

	if err := o.Validate(req); err.Occurred() {
		return OntologyRetrieveResponse{}, err
	}
	q := o.Ontology.NewRetrieve().
		WhereIDs(req.IDs...).
		IncludeSchema(req.IncludeSchema).
		IncludeFieldData(req.IncludeFieldData)

	if req.Children {
		q = q.TraverseTo(ontology.Children)
	} else if req.Parents {
		q = q.TraverseTo(ontology.Parents)
	}
	q = q.IncludeSchema(req.IncludeSchema).IncludeFieldData(req.IncludeFieldData)

	return res, errors.MaybeQuery(q.Entries(&res.Resources).Exec(ctx, nil))
}
