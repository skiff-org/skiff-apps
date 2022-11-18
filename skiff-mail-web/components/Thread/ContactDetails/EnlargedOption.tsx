import { Icons, Typography } from 'nightwatch-ui';
import styled from 'styled-components';

import { ThreadBlockOptions } from '../Thread.types';
const EnlargedOptionContainer = styled.div<{ destructive?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border: 1px solid ${(props) => (!props.destructive ? 'var(--border-primary)' : 'var(--border-destructive)')};
  border-radius: 11px;
  gap: 8px;
  height: 50px;
  width: 60px;
`;

export const EnlargedOption = ({
  option,
  destructive,
  hideDrawer
}: {
  option: ThreadBlockOptions;
  destructive?: boolean;
  hideDrawer?: () => void;
}) => {
  return (
    <EnlargedOptionContainer
      destructive={destructive}
      onClick={() => {
        if (hideDrawer) {
          hideDrawer();
        }
        if (option.onClick) {
          option.onClick();
        }
      }}
    >
      {option.icon && <Icons color={destructive ? 'destructive' : 'primary'} icon={option.icon} size='large' />}
      <Typography align='center' color={destructive ? 'destructive' : 'primary'} level={4} noSelect wrap>
        {option.label}
      </Typography>
    </EnlargedOptionContainer>
  );
};
