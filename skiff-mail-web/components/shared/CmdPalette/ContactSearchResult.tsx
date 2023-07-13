import { ThemeMode } from '@skiff-org/skiff-ui';
import { UserAvatar } from 'skiff-front-utils';
import { AddressObject } from 'skiff-graphql';
import styled from 'styled-components';

import { useDisplayPictureDataFromAddress } from '../../../hooks/useDisplayPictureDataFromAddress';

import { Highlight } from './Highlight';

const Container = styled.div`
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ProfilePicture = styled.div`
  padding-left: 8px;
`;

interface Props {
  subject: string;
  query: string;
  contact: AddressObject;
  style?: React.CSSProperties;
  onMouseUp: React.MouseEventHandler<HTMLDivElement>;
}

export const ContactSearchResult = ({ subject, query, contact, style, onMouseUp }: Props) => {
  const displayPictureData = useDisplayPictureDataFromAddress(contact.address);

  return (
    <Container onMouseUp={onMouseUp} style={style} tabIndex={-1}>
      <ProfilePicture>
        <UserAvatar displayPictureData={displayPictureData} forceTheme={ThemeMode.DARK} label={contact.address} />
      </ProfilePicture>
      <div className='searchResultContent' data-test={`search-result-${subject}`}>
        <Highlight customColor='white' query={query} size='small' text={contact.name ?? contact.address} />
        <Highlight query={query} size='small' text={contact.address} />
      </div>
    </Container>
  );
};
