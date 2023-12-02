import { Divider } from 'nightwatch-ui';
import React, { useCallback } from 'react';
import { SETTINGS_LABELS, SettingValue, TitleActionSection, useUserPreference } from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';

export const AutoAdvance: React.FC = () => {
  const [isAutoAdvanceOn, setIsAutoAdvanceOn] = useUserPreference(StorageTypes.AUTO_ADVANCE);
  const [advanceToNext, setAdvanceToNext] = useUserPreference(StorageTypes.ADVANCE_TO_NEXT);

  const onAutoAdvanceToggleChange = useCallback(() => {
    setIsAutoAdvanceOn(!isAutoAdvanceOn);
  }, [isAutoAdvanceOn]);

  const onAdvanceToNextSelectChange = useCallback(() => {
    setAdvanceToNext(!advanceToNext);
  }, [advanceToNext]);

  return (
    <>
      <TitleActionSection
        actions={[
          {
            dataTest: SettingValue.AutoAdvance,
            onChange: onAutoAdvanceToggleChange,
            checked: isAutoAdvanceOn,
            type: 'toggle'
          }
        ]}
        subtitle='Automatically advance to the next conversation when you delete or archive a conversation.'
        title={SETTINGS_LABELS[SettingValue.AutoAdvance]}
      />
      {isAutoAdvanceOn && (
        <>
          <Divider color='tertiary' />
          <TitleActionSection
            actions={[
              {
                type: 'select',
                value: String(advanceToNext),
                onChange: onAdvanceToNextSelectChange,
                items: [
                  { value: String(true), label: 'Next email' },
                  { value: String(false), label: 'Previous email' }
                ]
              }
            ]}
            subtitle='Choose the conversation to which you wish to advance.'
            title='Advance to'
          />
        </>
      )}
    </>
  );
};
