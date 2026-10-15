import { IsoContainerType } from '../types/depot';

export type ContainerTypeGroup = '40HC' | '40GP' | '20ST' | '45HC' | 'REEFER' | 'SPECIAL';

export const DEFAULT_ENABLED_CONTAINER_TYPES: ContainerTypeGroup[] = ['40HC', '40GP', '20ST'];

export const CONTAINER_TYPE_OPTIONS: Array<{ group: ContainerTypeGroup; label: string; shortLabel: string }> = [
  { group: '40HC', label: "40' High Cube (40HC)", shortLabel: '40HC' },
  { group: '40GP', label: "40' General Purpose (40GP)", shortLabel: '40GP' },
  { group: '20ST', label: "20' Standard / General Purpose (20ST / 20GP)", shortLabel: '20s' },
  { group: '45HC', label: "45' High Cube (45HC)", shortLabel: '45HC' },
  { group: 'REEFER', label: 'Reefer (20RF / 40RF)', shortLabel: 'Reefer' },
  { group: 'SPECIAL', label: 'Special Equipment (Open Top / Flat Rack / Tank)', shortLabel: 'Special' }
];

export function getContainerTypeGroup(type: IsoContainerType): ContainerTypeGroup {
  if (type === '40HC') return '40HC';
  if (type === '40GP') return '40GP';
  if (type === '45HC') return '45HC';
  if (type === '20GP' || type === '20ST') return '20ST';
  if (type === '20RF' || type === '40RF') return 'REEFER';
  return 'SPECIAL';
}
