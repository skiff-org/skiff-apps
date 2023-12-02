import React from 'react';
import { TitleActionSection, getEmailBasePath } from 'skiff-front-utils';

export const MailtoHandlerSetting: React.FC = () => {
  const mailURL = getEmailBasePath();

  const enableMailtoHandling = () => {
    // redirect to https://app.skiff.com/mail?to=%s
    window.navigator.registerProtocolHandler('mailto', `${mailURL}/?to=%s`);
  };

  return (
    <>
      <TitleActionSection
        actions={[
          {
            onClick: enableMailtoHandling,
            type: 'button',
            label: 'Enable'
          }
        ]}
        subtitle='Open all mailto links in Skiff Mail'
        title='Open mailto links'
      />
    </>
  );
};
