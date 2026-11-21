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
  // Colour by the installation's own side: a friendly airstrip on a contested island does not make
  // the enemy bunkers next to it friendly.
  const isPlayer = inst.side ? inst.side !== 'enemy' : island?.isFriendlyBase === true || inst.id.includes('friendly');
  if (inst.side === 'allied') {
    // Allied works in green, so they are not taken for the player's own
    return { isPlayer, color: '#76FF03', frameFill: 'rgba(46, 125, 50, 0.55)', frameStroke: '#66BB6A', labelColor: '#B9F6CA' };
  }
  return {
    isPlayer,
    color: isPlayer ? '#4FC3F7' : '#EF5350',
    frameFill: isPlayer ? 'rgba(21, 101, 192, 0.55)' : 'rgba(183, 28, 28, 0.45)',
    frameStroke: isPlayer ? '#42A5F5' : '#FF5252',
    labelColor: isPlayer ? '#90CAF9' : '#EF5350',
  };
}
