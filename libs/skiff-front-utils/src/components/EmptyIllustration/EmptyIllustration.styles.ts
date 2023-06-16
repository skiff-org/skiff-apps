import styled from 'styled-components';
import { isMobile } from 'react-device-detect';

export const EmptyMailbox = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 24px;
  justify-content: center;
  ${isMobile ? 'height: 100%;' : ''}
`;

export const EmptyMessage = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px 12px;
  gap: 12px;

  background: var(--bg-overlay-tertiary);
  border: 1px solid var(--border-tertiary);
  border-radius: 12px;
`;

export const EmptyRows = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

export const MailTypography = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

export const LowOpacityIcons = styled.div`
  opacity: 0.235;
`;

export const AvatarNameSection = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

export const EmptyAvatar = styled.div`
  box-sizing: border-box;

  width: 20px;
  height: 20px;

  background: var(--bg-overlay-secondary);
  border: 1px solid var(--border-tertiary);

  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.02), 0px 1px 2px rgba(0, 0, 0, 0.02);
  border-radius: 6px;
`;

export const EmptyName = styled.div`
  box-sizing: border-box;

  width: 36px;
  height: 8px;

  background: var(--bg-overlay-secondary);
  border: 1px solid var(--border-tertiary);

  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.02), 0px 1px 2px rgba(0, 0, 0, 0.02);
  border-radius: 6px;
`;

export const EmptySubject = styled.div`
  box-sizing: border-box;

  width: 114px;
  height: 8px;

  background: var(--bg-overlay-tertiary);
  border: 1px solid var(--border-tertiary);

  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.02), 0px 1px 2px rgba(0, 0, 0, 0.02);
  border-radius: 6px;
`;

export const EmptyDate = styled.div`
  box-sizing: border-box;

  width: 16px;
  height: 8px;

  background: var(--bg-overlay-tertiary);
  border: 1px solid var(--border-tertiary);

  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.02), 0px 1px 2px rgba(0, 0, 0, 0.02);
  border-radius: 6px;
`;
