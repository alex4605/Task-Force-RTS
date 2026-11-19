import { Aircraft, AircraftModel } from '../../../../types/game';
import { RenderContext } from '../../context';

/** Draws one aircraft model's airframe in local space (origin = aircraft centre, nose along +x). */
export type AircraftModelDrawer = (rc: RenderContext, plane: Aircraft, color: string) => void;

export type AircraftDrawerTable = Partial<Record<AircraftModel, AircraftModelDrawer>>;
