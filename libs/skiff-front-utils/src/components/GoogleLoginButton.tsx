import React from 'react';
import styled from 'styled-components';

import GoogleLoginIcon from '../assets/google_login.svg';

interface Props {
  onClick: () => void | Promise<void>;
  className?: string;
  id?: string;
  style?: React.CSSProperties | undefined;
  dataTest?: string;
}

const StyledSpan = styled.span`
  height: 44px !important;
  background: rgb(49, 97, 201);
  width: 100%;
  box-sizing: border-box;
  padding-top: 3px;
  display: flex;
  border-radius: 14px;
  align-items: center;
  :hover {
    background: rgb(38 82 178);
  }
`;

/** Google login button standard */
export const GoogleLoginButton = ({ className, id, onClick, style, dataTest }: Props) => {
  const defaultStyle = {
    cursor: 'pointer'
  };
  return (
    <StyledSpan
      className={className}
      data-test={dataTest}
      id={id || 'google-login-button'}
      onClick={() => void onClick()}
      style={style || defaultStyle}
    >
      <GoogleLoginIcon style={{ height: '44px' }} />
    </StyledSpan>
  );
};
