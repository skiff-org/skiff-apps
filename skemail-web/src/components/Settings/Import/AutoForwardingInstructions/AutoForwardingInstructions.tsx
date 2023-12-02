import { motion } from 'framer-motion';
import { Tabs, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import React, { useState } from 'react';
import { isMobile } from 'react-device-detect';
import { TitleActionSection } from 'skiff-front-utils';
import styled from 'styled-components';

import { MailType, MAIL_FORWARDING_CONFIGS } from './AutoForwardingInstructions.constants';

// Styling to match typography component in the list
const Number = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 16px;
  height: 16px;
  padding: 0;
  aspect-ratio: 1;

  box-sizing: border-box;
  background: var(--bg-field-default);
  opacity: 0.8;
  border-radius: 2px;
`;

const InstructionItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: ${isMobile ? 'baseline' : 'center'};
  padding: 0px;
  gap: 6px;

  width: 100%;
`;

const InstructionList = styled.ol`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0px;
`;

export const AutoForwardingInstructions: React.FC = () => {
  const [value, setValue] = useState(MailType.Gmail);

  const renderInstructions = (mailType: MailType) => {
    const { instructions } = MAIL_FORWARDING_CONFIGS[mailType];
    return (
      <motion.div transition={{ duration: 0.8 }} variants={{ collapsed: { opacity: 0 }, open: { opacity: 1 } }}>
        {/**
         * Gmail and Outlook only support auto-forwarding in their web apps. Add 'Web App' to the
         * instruction titles in the mobile app to make it clear where the instructions apply
         */}
        <InstructionList>
          {instructions.map((instruction, index) => (
            <InstructionItem key={instruction.key}>
              <Number>
                <Typography color='secondary' size={TypographySize.SMALL} weight={TypographyWeight.MEDIUM}>
                  {index + 1}
                </Typography>
              </Number>
              <Typography color='secondary' wrap>
                {instruction.value}
              </Typography>
            </InstructionItem>
          ))}
        </InstructionList>
      </motion.div>
    );
  };

  return (
    <>
      <TitleActionSection
        actions={[
          {
            content: (
              <Tabs
                fullWidth={isMobile}
                tabs={Object.values(MailType).map((type) => ({
                  label: type,
                  active: value === type,
                  onClick: () => setValue(type)
                }))}
              />
            ),
            type: 'custom'
          }
        ]}
        subtitle='Have emails sent to your old email address automatically forward to your Skiff address'
        title='Auto-forwarding'
      />
      {renderInstructions(value)}
    </>
  );
};
