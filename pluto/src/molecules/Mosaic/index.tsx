import {
  insertMosaicTab,
  moveMosaicTab,
  removeMosaicTab,
  resizeMosaicLeaf,
  selectMosaicTab,
} from "./mosaicTree";

import { Mosaic as CoreMosaic } from "./Mosaic";
import { useMosaic } from "./useMosaic";
export * from "./types";

type CoreMosaicType = typeof CoreMosaic;

export interface MosaicType extends CoreMosaicType {
  use: typeof useMosaic;
  insertTab: typeof insertMosaicTab;
  removeTab: typeof removeMosaicTab;
  selectTab: typeof selectMosaicTab;
  moveTab: typeof moveMosaicTab;
  resizeLeaf: typeof resizeMosaicLeaf;
}

export const Mosaic = CoreMosaic as MosaicType;

Mosaic.use = useMosaic;
Mosaic.insertTab = insertMosaicTab;
Mosaic.removeTab = removeMosaicTab;
Mosaic.selectTab = selectMosaicTab;
Mosaic.moveTab = moveMosaicTab;
Mosaic.resizeLeaf = resizeMosaicLeaf;