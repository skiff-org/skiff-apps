import { useFlags } from 'launchdarkly-react-client-sdk';
import { Button, Dialog, DialogType, Size, Type } from 'nightwatch-ui';
import React from 'react';
import { DowngradeProgress } from 'skiff-graphql';
import { TierName } from 'skiff-utils';
import { FreeCustomDomainFeatureFlag } from 'skiff-utils';

import { getDowngradeTodoItems } from '../../../utils';
import DowngradeTodoItem from '../../DowngradeTodoItem';

interface DowngradeModalProps {
  open: boolean;
  onClose: () => void;
  tierToDowngradeTo: TierName;
  downgradeProgress: DowngradeProgress;
}

const DowngradeModal: React.FC<DowngradeModalProps> = ({ open, onClose, tierToDowngradeTo, downgradeProgress }) => {
  const flags = useFlags();
  const freeCustomDomainFlag = flags.freeCustomDomain as FreeCustomDomainFeatureFlag;
  const todoItemPropsList = getDowngradeTodoItems(tierToDowngradeTo, { freeCustomDomainFlag }, downgradeProgress);
  return (
    <Dialog
      customContent
      description="There are a few actions you'll have to take before proceeding."
      onClose={onClose}
      open={open}
      title='Are you sure you want to downgrade?'
      type={DialogType.DEFAULT}
    >
      {todoItemPropsList.map(({ key, ...props }) => (
        <DowngradeTodoItem {...props} key={key} />
      ))}
      <Button disabled fullWidth onClick={() => {}} size={Size.LARGE} type={Type.DESTRUCTIVE}>
        Downgrade plan
      </Button>
    </Dialog>
  );
};

export default DowngradeModal;
