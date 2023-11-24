import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { ThemeMode } from 'nightwatch-ui';
import { Dispatch, SetStateAction } from 'react';
import { DisplayPictureData } from 'skiff-graphql';

import { NewEmailAliasInputProps } from '../../NewEmailAliasInput';

export interface AliasProfileModalProps extends Partial<Omit<NewEmailAliasInputProps, 'newAlias' | 'addAlias'>> {
  /** Email alias being edited/created */
  alias: string;
  client: ApolloClient<NormalizedCacheObject>;
  /** Opened/closed state of the current modal */
  isOpen: boolean;
  /** Changes the opened/closed state of the current modal */
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  /**
   * Called on creating a new alias
   * Undefined indicates that the user is editing the profile of an existing alias
   */
  addAlias?: () => Promise<boolean>;
  /** All existing email aliases, useful for checking for short alias on adding new alias */
  allEmailAliases?: string[];
}

export interface DisplayNameSectionProps {
  /** Display name input field value */
  displayedDisplayName: string;
  setNewDisplayName: Dispatch<SetStateAction<string | undefined>>;
  selectedAddress?: string;
  forceTheme?: ThemeMode;
}

export interface DisplayPictureSectionProps {
  alias: string;
  /** Display name input field value */
  displayedDisplayName: string;
  displayedDisplayPictureData: DisplayPictureData;
  setNewDisplayPictureData: Dispatch<SetStateAction<DisplayPictureData | undefined>>;
  forceTheme?: ThemeMode;
}

export interface EmailAliasSectionProps extends Partial<Omit<NewEmailAliasInputProps, 'newAlias' | 'addAlias'>> {
  /** Email alias being edited/created */
  alias: string;
  /** Create alias confirm dialog opened/closed state */
  isAddAliasConfirmOpen: boolean;
  /** Changes the create alias confirm dialog opened/closed state */
  setIsAddAliasConfirmOpen: Dispatch<SetStateAction<boolean>>;
  /** Updates alias profile info */
  updateAliasInfo: () => Promise<void>;
  /**
   * Creates the new alias
   * Undefined indicates that the user is editing an alias profile
   * rather than creating a new alias
   */
  addAlias?: () => Promise<boolean>;
}
