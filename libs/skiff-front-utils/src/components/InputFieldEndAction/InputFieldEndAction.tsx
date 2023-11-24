import { Icon, Icons, Size, ThemeMode } from 'nightwatch-ui';
import { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div``;

interface InputFieldEndActionProps {
  icon: Icon;
  onClick: () => void;
  size?: Size;
  tooltip?: string;
  forceTheme?: ThemeMode;
}

const InputFieldEndAction = ({ icon, onClick, size, tooltip, forceTheme }: InputFieldEndActionProps) => {
  const [hover, setHover] = useState(false);

  return (
    <Container onMouseLeave={() => setHover(false)} onMouseOver={() => setHover(true)}>
      <Icons
        color={hover ? 'secondary' : 'disabled'}
        forceTheme={forceTheme}
        icon={icon}
        onClick={onClick}
        size={size}
        tooltip={tooltip}
      />
    </Container>
  );
};

export default InputFieldEndAction;
