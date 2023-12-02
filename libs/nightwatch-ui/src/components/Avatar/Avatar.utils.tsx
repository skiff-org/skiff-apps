import { Icon } from '../Icons';
import { IconComponent } from '../IconText';

/**
 * Takes a potentially undefined label and icon
 * Returns an object that can be spread into avatar as a prop (prioritizing icon)
 * @param {string | undefined} label
 * @param {Icon | undefined} icon
 */
export const getAvatarIconOrLabel = (label?: string, icon?: Icon | IconComponent) =>
  icon ? { icon } : { label: label ?? '' };

/**
 * Strips emojis from a string by removing all non-ASCII characters
 * @param {string} str - Text with emojis
 * @returns {string} - Text without emojis
 */
export const stripEmojis = (str: string) => str.replace(/[^\x00-\x7F]/g, '');
