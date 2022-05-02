import { debounce } from 'lodash';
import { useCallback, useState } from 'react';
import styled from 'styled-components';
import { Icon, InputField } from '@skiff-org/skiff-ui';

const SearchContainer = styled.div`
  padding-top: 12px;
`;

interface MobileSearchProps {
  setSearchQuery: (query: string) => void;
}
export default function MobileSearch({ setSearchQuery }: MobileSearchProps) {
  const [value, setValue] = useState<string>('');
  const handleChange = useCallback((val: string) => {
    setSearchQuery(val.toLowerCase());
  }, []);

  const debounceFn = useCallback(debounce(handleChange, 500), []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    debounceFn(e.target.value);
  };

  return (
    <SearchContainer>
      <InputField icon={Icon.Search} placeholder='Search emails...' size='medium' onChange={onChange} value={value} />
    </SearchContainer>
  );
}
