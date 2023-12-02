import { AccentColor, accentColorToPrimaryColor } from 'nightwatch-ui';
import { ColorSelector, TitleActionSection, useUserPreference } from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

const ColorSelectContainer = styled.div`
  width: 220px;
`;

export const CalendarDefaultColor = () => {
  const [defaultColor, setDefaultColor] = useUserPreference(StorageTypes.DEFAULT_CALENDAR_COLOR);

  return (
    <>
      <TitleActionSection
        actions={[
          {
            content: (
              <ColorSelectContainer>
                <ColorSelector
                  colorToStyling={accentColorToPrimaryColor}
                  handleChange={function (color) {
                    setDefaultColor(color as AccentColor);
                  }}
                  value={defaultColor}
                />
              </ColorSelectContainer>
            ),
            type: 'custom'
          }
        ]}
        subtitle='The default event color in your calendar'
        title='Default color'
      />
    </>
  );
};
