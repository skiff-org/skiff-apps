import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  width: 100%;
  height: 2px;
  background-color: var(--border-secondary);
`;

const Filler = styled.div<{ completed: number }>`
  height: 100%;
  width: ${(props) => `${props.completed}%`};
  background-color: var(--icon-link);
  transition: width 1s ease-in-out;
`;

type ProgressBarProps = {
  completed?: number;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ completed }: ProgressBarProps) => {
  if (completed === undefined) return <></>;
  return (
    <Container>
      <Filler completed={completed} />
    </Container>
  );
};

export default ProgressBar;
