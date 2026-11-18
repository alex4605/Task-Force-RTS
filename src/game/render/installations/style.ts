import { Installation, Island } from '../../../types/game';

/** Side-dependent palette shared by every installation drawer. */
export interface InstallationStyle {
  isPlayer: boolean;
  color: string;
  frameFill: string;
  frameStroke: string;
  labelColor: string;
}

export function getInstallationStyle(inst: Installation, island?: Island): InstallationStyle {
  const isPlayer = inst.side === 'player' || island?.isFriendlyBase === true || inst.id.includes('friendly');
  return {
    isPlayer,
    color: isPlayer ? '#4FC3F7' : '#EF5350',
    frameFill: isPlayer ? 'rgba(21, 101, 192, 0.55)' : 'rgba(183, 28, 28, 0.45)',
    frameStroke: isPlayer ? '#42A5F5' : '#FF5252',
    labelColor: isPlayer ? '#90CAF9' : '#EF5350',
  };
}
