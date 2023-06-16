import { AnimatePresence, motion } from 'framer-motion';
import {
  Button,
  DropdownItem,
  FilledVariant,
  Icon,
  Icons,
  InputField,
  Select,
  Size,
  Toggle,
  Type,
  Typography
} from 'nightwatch-ui';
import React from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

import TitleSection from './TitleSection';

interface SettingButton {
  type: 'button';
  onClick: (e: React.MouseEvent) => void | Promise<void>;
  label: string;
  icon?: Icon;
  dataTest?: string;
  disabled?: boolean;
  destructive?: boolean;
  animate?: boolean;
  ref?: React.Ref<HTMLDivElement>;
  loading?: boolean;
}

interface SettingToggle {
  type: 'toggle';
  onChange: () => void;
  checked: boolean;
  dataTest?: string;
  loading?: boolean;
  error?: boolean;
}

interface SettingInput {
  type: 'input';
  dataTest?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  innerRef?: React.Ref<HTMLInputElement>;
  value: string;
  disabled?: boolean;
  errorMsg?: string;
  placeholder?: string;
}

interface SettingSelect {
  type: 'select';
  items: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  customWidth?: number;
  dataTest?: string;
  value?: string;
  variant?: FilledVariant;
}

interface SettingCustom {
  type: 'custom';
  content: JSX.Element;
}

export type SettingAction = SettingToggle | SettingButton | SettingInput | SettingSelect | SettingCustom;

type TitleSectionProps = {
  title?: string;
  subtitle?: string;
  actions?: Array<SettingAction>;
  destructive?: boolean;
  animate?: boolean;
  column?: boolean;
};

const TitleActionBlock = styled.div<{ vertical?: boolean }>`
  display: flex;
  flex-direction: ${(props) => (props.vertical ? 'column' : 'row')};
  justify-content: space-between;
  align-items: ${(props) => (props.vertical ? 'start' : 'center')};
  padding: 0px;
  gap: 12px;
  width: 100%;
`;

const Actions = styled(motion.div)<{ vertical?: boolean }>`
  display: flex;
  flex-direction: ${(props) => (props.vertical ? 'column' : 'row')};
  align-items: center;
  gap: 12px;
  width: ${(props) => (props.vertical ? '100%' : '')};
`;

const DropdownContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: var(--bg-l1-solid);
  border-radius: 12px;
  width: 100%;
  box-sizing: border-box;
`;

const Item = styled.div<{ $isLast: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding: 16px;
  justify-content: space-between;
  border-bottom: ${({ $isLast }) => ($isLast ? 'none' : '1px solid var(--border-tertiary)')};
`;

const Absolute = styled.div`
  position: absolute;
  top: 26px;
  right: 26px;
`;

const InputFieldContainer = styled.div`
  width: ${isMobile ? '100%' : '256px'};
`;

/**
 * Component that renders a name, description, and actions of the setting
 */
export default function TitleActionSection(props: TitleSectionProps) {
  const { title, subtitle, animate, actions, destructive, column } = props;
  const vertical = column || isMobile;
  return (
    <TitleActionBlock vertical={vertical}>
      <TitleSection destructive={destructive} subtitle={subtitle} title={title} />
      <Actions
        layout={animate ? 'position' : false}
        transition={{
          width: { ease: [0.16, 1, 0.3, 1] },
          layout: { duration: 0.25 }
        }}
        vertical={vertical}
      >
        {actions?.map((action) => {
          return (
            <AnimatePresence key={`layout-div-${title ?? ''}-${subtitle ?? ''}`}>
              <motion.div layout={animate ? 'position' : false} style={isMobile ? { width: '100%' } : undefined}>
                {action.type === 'button' && (
                  <>
                    {isMobile && !!action?.icon && (
                      <Absolute onClick={action.onClick}>
                        <Icons
                          color='secondary'
                          dataTest={action.dataTest}
                          disabled={action.disabled}
                          icon={action?.icon}
                          size={Size.X_MEDIUM}
                        />
                      </Absolute>
                    )}
                    {(!isMobile || !action?.icon) && (
                      <motion.div
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        transition={{ ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                      >
                        <Button
                          dataTest={action.dataTest}
                          disabled={action.disabled}
                          fullWidth={isMobile}
                          loading={action.loading}
                          onClick={action.onClick}
                          ref={action.ref}
                          type={action.destructive ? Type.DESTRUCTIVE : Type.SECONDARY}
                        >
                          {action.label}
                        </Button>
                      </motion.div>
                    )}
                  </>
                )}
                {action.type === 'input' && (
                  <InputFieldContainer>
                    <InputField
                      dataTest={action.dataTest}
                      disabled={action.disabled}
                      errorMsg={action.errorMsg}
                      innerRef={action.innerRef}
                      onBlur={action.onBlur}
                      onChange={action.onChange}
                      onFocus={action.onFocus}
                      onKeyDown={action.onKeyDown}
                      placeholder={action.placeholder}
                      value={action.value}
                    />
                  </InputFieldContainer>
                )}
                {action.type === 'select' && (
                  <>
                    {isMobile && (
                      <DropdownContainer>
                        {action.items.map((item, index) => {
                          return (
                            <Item
                              $isLast={index === action.items.length - 1}
                              key={item.value}
                              onClick={() => action.onChange(item.value)}
                            >
                              <Typography>{item.label}</Typography>
                              {item.value === action.value && (
                                <Icons color='link' icon={Icon.Check} size={Size.X_MEDIUM} />
                              )}
                            </Item>
                          );
                        })}
                      </DropdownContainer>
                    )}
                    {!isMobile && (
                      <Select
                        maxHeight={400} // cap dropdown height
                        onChange={action.onChange}
                        size={Size.SMALL}
                        value={action.value}
                        variant={action?.variant || FilledVariant.FILLED}
                        width={action.customWidth}
                      >
                        {action.items.map((item) => {
                          return <DropdownItem key={item.value} label={item.label} value={item.value} />;
                        })}
                      </Select>
                    )}
                  </>
                )}
                {action.type === 'toggle' && !action.loading && !action.error && (
                  <Toggle checked={action.checked} dataTest={action.dataTest} onChange={action.onChange} />
                )}
                {action.type === 'custom' && action.content}
              </motion.div>
            </AnimatePresence>
          );
        })}
      </Actions>
    </TitleActionBlock>
  );
}
