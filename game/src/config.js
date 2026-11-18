// Shared tuning and logical coordinates. Fixed-step simulation is independent of display size.
export const FIELD = { width: 1440, height: 900 };
export const SECTOR = { width: 3400, height: 2600 };
export const STEP = 1 / 60;
export const RUN_SECONDS = 210;
export const CHARGE_REQUIRED = 60;
export const GATE_ALIGNMENT_SECONDS = 70;
export const BEST_KEY = 'void-harvest.records.v1';
export const COLORS = { cyan: '#8cf9ed', orange: '#ff975e', red: '#ff526c', gold: '#f8cd86', text: '#edf7f4', muted: '#81959c' };
export const UPGRADES = [
  { id: 'cannon', name: 'Twin fang', type: 'WEAPON SYSTEM', detail: 'Faster fire. At tier II, fire paired plasma bolts.', cost: 16, max: 3 },
  { id: 'mining', name: 'Deep core', type: 'EXTRACTION ARRAY', detail: '+55% mining power and +45 beam range per tier.', cost: 14, max: 3 },
  { id: 'shield', name: 'Ghost shell', type: 'DEFENSE MATRIX', detail: '+25 shield capacity. Restores shield and 20 hull.', cost: 18, max: 3 },
  { id: 'engine', name: 'Slipstream', type: 'PROPULSION', detail: '+15% speed, faster boost recharge and wider salvage pickup.', cost: 14, max: 3 },
];
