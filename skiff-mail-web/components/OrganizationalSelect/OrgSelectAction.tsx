import { Icon, Icons, Typography } from '@skiff-org/skiff-ui';
import React, { useState } from 'react';
import styled from 'styled-components';

const ActionItem = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

interface OrgSelectActionProps {
  id?: string;
  icon?: Icon;
  label: string;
  dataTest?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const OrgSelectAction: React.FC<OrgSelectActionProps> = ({ id, icon, label, dataTest, onClick }) => {
  const [onHover, setOnHover] = useState(false);

  return (
    <ActionItem
      data-test={dataTest}
      id={id}
      onClick={onClick}
      onMouseLeave={() => setOnHover(false)}
      onMouseOver={() => {
        if (!!onClick) setOnHover(true);
      }}
      style={{ cursor: !!onClick ? 'pointer' : 'default' }}
    >
      {icon && <Icons color={onHover ? 'secondary' : 'tertiary'} icon={icon} size='small' />}
      <Typography color={onHover ? 'secondary' : 'tertiary'} level={3} type='paragraph'>
        {label}
      </Typography>
    </ActionItem>
  );
};

export default OrgSelectAction;
