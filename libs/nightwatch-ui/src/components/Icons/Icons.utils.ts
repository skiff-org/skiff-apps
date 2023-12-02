import { Icon } from './Icons.types';

export function isValidIcon(value: string): value is Icon {
  return Object.values(Icon).includes(value as Icon);
}
