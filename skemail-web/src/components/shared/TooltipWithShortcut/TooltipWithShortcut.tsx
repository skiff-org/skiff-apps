import { Size } from 'nightwatch-ui';
import { KeyCodeSequence } from 'skiff-front-utils';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;

  // Default tooltip padding is 4px 8px, but we want it to be 4px 4px 4px 8px when there's a shortcut
  margin-right: -4px;
`;

export interface TooltipWithShortcutProps {
  label: string;
  shortcut: string;
}

const TooltipWithShortcut: React.FC<TooltipWithShortcutProps> = ({ label, shortcut }: TooltipWithShortcutProps) => (
  <Wrapper>
    {label}
    <KeyCodeSequence shortcut={shortcut} size={Size.SMALL} />
  </Wrapper>
);

export default TooltipWithShortcut;
