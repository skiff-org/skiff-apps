/* eslint-disable max-len */
import EventEmitter from 'eventemitter3';
import { useEffect, useState } from 'react';

// Local storage keys
// Note: These should be moved and deleted once useLocalSettings is de-duped
export enum FileSortLocalStorageTypes {
  FILE_TABLE_SORT_MODE = 'fileTableSort:mode',
  FILE_TABLE_SORT_ORDER = 'fileTableSort:order'
}

/**
 * Enum for sorting file table order
 * by either time or name
 */
export enum SortMode {
  Type = 'TYPE',
  Created = 'CREATED',
  Updated = 'UPDATED',
  Name = 'NAME',
  Size = 'SIZE'
}

export interface FileSortOrder {
  // whether to sort files by name or by time
  mode: SortMode;
  // whether sort files in ascending or decending order
  order: boolean;
}

// by default, sort files by ascending created order
const DEFAULT_SORT_ORDER: FileSortOrder = {
  mode: SortMode.Created,
  order: false
};

const FileTableOrderEE = new EventEmitter<keyof FileSortOrder>();

function getFileSortOrderCurrentValue<T extends keyof FileSortOrder>(setting: T): FileSortOrder[T] {
  const storageKey =
    setting === 'mode'
      ? FileSortLocalStorageTypes.FILE_TABLE_SORT_MODE
      : FileSortLocalStorageTypes.FILE_TABLE_SORT_ORDER;
  const storedItem = localStorage.getItem(storageKey);
  try {
    // try to parse/return order boolean
    return JSON.parse(storedItem ?? '');
  } catch {
    // otherwise return the SortMode (or default mode if no item found)
    return (storedItem as FileSortOrder[T]) || DEFAULT_SORT_ORDER[setting];
  }
}

/**
 * Custom hook for accessing and setting the file sort order globally.
 * @param setting one of mode or order (as defined by the FileSortOrder interface)
 * @returns [current value of setting, setting setter]
 */
export default function useFileSortOrder<T extends keyof FileSortOrder>(
  setting: T
): [FileSortOrder[T], (newValue: FileSortOrder[T]) => any] {
  const [currentValue, setCurrentValue] = useState<FileSortOrder[T]>(getFileSortOrderCurrentValue(setting));
  const setter = (newValue: FileSortOrder[T]) => {
    const storageKey =
      setting === 'mode'
        ? FileSortLocalStorageTypes.FILE_TABLE_SORT_MODE
        : FileSortLocalStorageTypes.FILE_TABLE_SORT_ORDER;
    localStorage.setItem(storageKey, `${newValue}`);
    FileTableOrderEE.emit(setting);
  };

  useEffect(() => {
    const listener = () => {
      setCurrentValue(getFileSortOrderCurrentValue(setting));
    };
    FileTableOrderEE.on(setting, listener);
    return () => {
      FileTableOrderEE.off(setting, listener);
    };
  }, []);

  return [currentValue, setter];
}
