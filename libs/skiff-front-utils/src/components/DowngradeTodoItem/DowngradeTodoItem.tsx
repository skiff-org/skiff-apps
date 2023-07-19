import { Icon, Icons, Typography } from '@skiff-org/skiff-ui';
import React from 'react';
import styled from 'styled-components';

const Checkbox = styled.div<{ checked: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;

  box-sizing: border-box;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  margin-top: 2px;

  background: ${(props) => (props.checked ? 'var(--bg-emphasis)' : 'var(--accent-red-secondary)')};
  ${(props) => (props.checked ? '' : 'border: 1px solid var(--border-destructive);')};
`;

const TodoItemContainer = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin: 6px 0;
`;

export interface DowngradeTodoItemProps {
  checked: boolean;
  title: string;
  description: string;
}

// A fake checkbox signifying a missing task a user needs to do
// before downgrading
const DowngradeTodoItem: React.FC<DowngradeTodoItemProps> = ({ checked, title, description }) => {
  return (
    <TodoItemContainer>
      <Checkbox checked={checked}>{checked && <Icons color='white' icon={Icon.Check} />}</Checkbox>
      <div>
        <Typography mono uppercase wrap>
          {title}
        </Typography>
        <Typography mono uppercase color='secondary' wrap>
          {description}
        </Typography>
      </div>
    </TodoItemContainer>
  );
};

export default DowngradeTodoItem;
