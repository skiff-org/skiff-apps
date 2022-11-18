import Skeleton from '@mui/material/Skeleton';
import { range } from 'lodash';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

import { ITEM_HEIGHT, MOBILE_ITEM_HEIGHT } from '../../constants/mailbox.constants';

const LoadingMailbox = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: ${isMobile ? '104px' : ''};
`;

const MessageStack = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 8px;
  justify-content: space-between;
`;

const MessageSkeletonCell = styled.div`
  display: flex;
  gap: 8px;
  height: ${isMobile ? MOBILE_ITEM_HEIGHT : ITEM_HEIGHT}px;
  min-height: ${isMobile ? MOBILE_ITEM_HEIGHT : ITEM_HEIGHT}px;
  padding: 9px 18px;
  align-items: ${isMobile ? '' : 'center'};
  box-sizing: border-box;
`;

const SearchBoxSkeleton = styled.div`
  padding: 0px 12px 24px 12px;
`;

const LARGE_ROW_HEIGHT = 25;
const SMALL_ROW_HEIGHT = isMobile ? 18 : 12;
const CIRCLE_SIZE = 36;
const CHECKBOX_SIZE = 38;

const rowStyle = { backgroundColor: 'var(--bg-field-default)', borderRadius: 8 };

interface MailboxSkeletonProps {
  renderCheckbox?: boolean;
}

export const MailboxSkeleton: React.FC<MailboxSkeletonProps> = ({ renderCheckbox = true }: MailboxSkeletonProps) => {
  return (
    <LoadingMailbox>
      {isMobile && (
        <SearchBoxSkeleton>
          <Skeleton
            height={CHECKBOX_SIZE}
            style={{ backgroundColor: 'var(--bg-field-default)', borderRadius: 100 }}
            width='100%'
          />
        </SearchBoxSkeleton>
      )}
      {range(5).map((index) => (
        <MessageSkeletonCell key={`skeleton-${index}`}>
          {!isMobile && renderCheckbox && (
            <Skeleton
              height={20}
              style={{
                backgroundColor: 'var(--bg-field-default)',
                borderRadius: '4px',
                alignSelf: 'center',
                minWidth: '20px'
              }}
              variant='rectangular'
              width={20}
            />
          )}
          <Skeleton
            height={CIRCLE_SIZE}
            style={{
              backgroundColor: 'var(--bg-field-default)',
              marginLeft: !isMobile ? '12px' : '',
              borderRadius: !isMobile ? '12px' : '',
              minWidth: `${CIRCLE_SIZE}px`
            }}
            variant='circular'
            width={CIRCLE_SIZE}
          />
          <MessageStack>
            <Skeleton height={LARGE_ROW_HEIGHT} style={{ ...rowStyle, marginTop: !isMobile ? '6px' : '' }} />
            {isMobile && (
              <>
                <Skeleton height={SMALL_ROW_HEIGHT} style={rowStyle} />
                <Skeleton height={SMALL_ROW_HEIGHT} style={rowStyle} />
              </>
            )}
          </MessageStack>
        </MessageSkeletonCell>
      ))}
    </LoadingMailbox>
  );
};
