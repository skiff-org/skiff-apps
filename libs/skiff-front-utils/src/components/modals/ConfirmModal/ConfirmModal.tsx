import { ButtonGroupItem, Dialog, DialogType, ThemeMode, Type } from 'nightwatch-ui';
import React from 'react';

export interface ConfirmModalProps {
  open: boolean;
  confirmName: string;
  title: string;
  // closes the confirm model and is used as the default callback for the "Cancel" button if onCancel is not provided
  onClose: (event?: React.MouseEvent, reason?: 'backdropClick' | 'escapeKeyDown') => void;
  // confirm callback
  onConfirm: (e: React.MouseEvent<Element, MouseEvent>) => void | Promise<void>;
  description?: string;
  // Whether to the confirm button should be destructive type
  destructive?: boolean;
  dataTest?: string;
  secondaryName?: string;
  onSecondary?: () => void | Promise<void>;
  disableOffClick?: boolean;
  forceTheme?: ThemeMode;
  loading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  onClose,
  onConfirm,
  open,
  confirmName,
  description,
  title,
  destructive,
  dataTest,
  secondaryName,
  onSecondary,
  disableOffClick,
  forceTheme,
  loading
}) => {
  if (!open) return null;

  return (
    <Dialog
      dataTest={dataTest}
      description={description}
      disableOffClick={disableOffClick}
      forceTheme={forceTheme}
      onClose={onClose}
      open={open}
      title={title}
      type={DialogType.CONFIRM}
    >
      <ButtonGroupItem
        dataTest={`confirm-${confirmName}`}
        label={confirmName}
        loading={loading}
        onClick={onConfirm}
        type={destructive ? Type.DESTRUCTIVE : undefined}
      />
      {secondaryName && onSecondary && (
        <ButtonGroupItem dataTest='dialog-secondary' label={secondaryName} onClick={onSecondary} />
      )}
      {!secondaryName && <ButtonGroupItem dataTest='dialog-cancel' label='Cancel' onClick={onClose} />}
    </Dialog>
  );
};

export default ConfirmModal;
