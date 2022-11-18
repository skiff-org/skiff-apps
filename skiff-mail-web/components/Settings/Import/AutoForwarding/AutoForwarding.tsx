import { LayoutGroup, motion } from 'framer-motion';
import { Typography } from 'nightwatch-ui';
import React, { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { TitleActionSection } from 'skiff-front-utils';
import styled from 'styled-components';

import { MailType, MAIL_FORWARDING_CONFIGS } from './AutoForwarding.constants';

const Container = styled(motion.ul)`
  list-style-type: none;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: var(--bg-field-default);
  border-radius: 12px;
  height: 32px;
  padding: 0 5px;
`;
const Slider = styled(motion.div)`
  background: var(--bg-l3-solid);
  box-shadow: var(--shadow-l1);
  position: absolute;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  top: -4px;
  left: 0;
  right: 0;
  z-index: -1;
`;

const SliderContainer = styled.div`
  width: 175px;
`;

const Item = styled(motion.li)`
  position: relative;
  width: 100%;
  cursor: pointer;
  isolation: isolate;
`;

interface MailAppTabProps {
  value: MailType;
  setValue: (app: MailType) => void;
}
const MailAppTab = (props: MailAppTabProps) => {
  const { value, setValue } = props;
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    // Important: this cancels the initial dropdown on the first load of the component.
    setTimeout(() => {
      setIsLoaded(true);
    });
  });
  return (
    <Container>
      {Object.values(MailType).map((item) => (
        <Item key={item} onClick={() => setValue(item)}>
          <LayoutGroup>
            <Typography align='center' color={item === value ? 'primary' : 'disabled'} level={3} noSelect type='label'>
              {item}
            </Typography>
            {item === value && <Slider layout={isLoaded ? 'position' : 'size'} layoutId='slider' />}
          </LayoutGroup>
        </Item>
      ))}
    </Container>
  );
};

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

export const AutoForwarding: React.FC = () => {
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
            <InstructionItem key={instruction?.toString() || 'instr'}>
              <Number>
                <Typography color='secondary' level={3} type='label'>
                  {index + 1}
                </Typography>
              </Number>
              <Typography color='secondary' type='paragraph' wrap>
                {instruction}
              </Typography>
            </InstructionItem>
          ))}
        </InstructionList>
      </motion.div>
    );
  };

  const mailSlider = (
    <SliderContainer>
      <MailAppTab setValue={setValue} value={value} />
    </SliderContainer>
  );

  return (
    <>
      <TitleActionSection
        actions={[
          {
            content: mailSlider,
            type: 'custom'
          }
        ]}
        subtitle='Have emails sent to your old email address automatically forward to your Skiff address.'
        title='Auto-forwarding'
      />
      {renderInstructions(value)}
    </>
  );
};
