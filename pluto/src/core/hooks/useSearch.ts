// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import {
  UnknownRecord,
  ArrayTransform,
  KeyedRecord,
  Key,
  TermSearcher,
} from "@synnaxlabs/x";
import Fuse from "fuse.js";

import { proxyMemo } from "@/core/memo";

/** Props for the {@link createFilterTransform} hook. */
export interface UseSearchTransformProps<K extends Key, E extends KeyedRecord<K, E>> {
  term: string;
  searcher?: TermSearcher<string, K, E> | ((data: E[]) => TermSearcher<string, K, E>);
}

const defaultOpts: Fuse.IFuseOptions<UnknownRecord<UnknownRecord>> = {
  threshold: 0.3,
};

export const fuseSearcher =
  (opts?: Fuse.IFuseOptions<UnknownRecord>) =>
  <K extends Key, E extends KeyedRecord<K, E>>(
    data: E[]
  ): TermSearcher<string, K, E> => {
    const fuse = new Fuse(data, {
      keys: Object.keys(data[0]),
      ...defaultOpts,
      ...opts,
    });
    return {
      search: (term: string) => fuse.search(term).map(({ item }) => item),
      retrieve: (keys: K[]) => data.filter((item) => keys.includes(item.key)),
    };
  };

const defaultSearcher = fuseSearcher();

/**
 * @returns a transform that can be used to filter an array of objects in memory
 * based on a search query.
 *
 * Can be used in conjunction with `useTransform` to add search functionality
 * alongside other transforms.
 *
 * Uses fuse.js under the hood.
 *
 * @param query - The query to search for.
 * @param opts - The options to pass to the Fuse.js search. See the Fuse.js
 * documentation for more information on these options.
 */
export const createFilterTransform = <K extends Key, E extends KeyedRecord<K, E>>({
  term,
  searcher = defaultSearcher<K, E>,
}: UseSearchTransformProps<K, E>): ArrayTransform<E> =>
  proxyMemo((data) => {
    if (typeof searcher === "function") {
      if (term.length === 0 || data?.length === 0) return data;
      return searcher(data).search(term);
    }
    return searcher.search(term);
  });
