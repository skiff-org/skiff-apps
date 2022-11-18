import { UserAvatar } from 'skiff-front-utils';
import { AddressObject } from 'skiff-graphql';
import styled from 'styled-components';

import { useDisplayPictureDataFromAddress } from '../../../hooks/useDisplayPictureDataFromAddress';

import { Highlight } from './Highlight';
import { renderRowBackground } from './SearchResult';

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
  active: boolean;
  hover: boolean;
  rowHeight: number;
  style?: React.CSSProperties;

  onMouseUp: React.MouseEventHandler<HTMLDivElement>;
  setHover: (hover: boolean) => void;
}

export const ContactSearchResult = ({
  subject,
  query,
  contact,
  active,
  hover,
  style,
  rowHeight,
  onMouseUp,
  setHover
}: Props) => {
  const displayPictureData = useDisplayPictureDataFromAddress(contact.address);

  return (
    <Container
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseUp={onMouseUp}
      style={style}
      tabIndex={-1}
    >
      {renderRowBackground(active, hover, rowHeight)}
      <ProfilePicture>
        <UserAvatar displayPictureData={displayPictureData} label={contact.address} themeMode='dark' />
      </ProfilePicture>
      <div className='searchResultContent' data-test={`search-result-${subject}`}>
        <Highlight query={query} size='small' text={contact.name ?? contact.address} />
        <Highlight query={query} size='small' text={contact.address} />
      </div>
    </Container>
  );
};
