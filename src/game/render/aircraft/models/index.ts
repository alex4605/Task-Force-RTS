import { AircraftDrawerTable } from './types';
import { WW2_ALLIED_DRAWERS } from './ww2Allied';
import { WW2_JAPAN_DRAWERS } from './ww2Japan';
import { KOREA_DRAWERS } from './korea';
import { VIETNAM_DRAWERS } from './vietnam';
import { MODERN_DRAWERS } from './modern';

export type { AircraftModelDrawer, AircraftDrawerTable } from './types';

/** Airframe drawer for every aircraft model that has a dedicated silhouette. */
export const AIRCRAFT_MODEL_DRAWERS: AircraftDrawerTable = {
  ...WW2_ALLIED_DRAWERS,
  ...WW2_JAPAN_DRAWERS,
  ...KOREA_DRAWERS,
  ...VIETNAM_DRAWERS,
  ...MODERN_DRAWERS,
};
