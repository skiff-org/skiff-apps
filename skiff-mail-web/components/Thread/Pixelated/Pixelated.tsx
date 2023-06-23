import range from 'lodash/range';
import { colors, ThemeMode } from '@skiff-org/skiff-ui';
import { useTheme } from 'skiff-front-utils';
import styled from 'styled-components';

const PixelatedContent = styled.div<{ $zIndex: number; $isDarkMode: boolean }>`
  user-select: none;
  display: flex;
  isolation: isolate;
  margin-left: -12px;
  border: 3px solid ${(props) => (props.$isDarkMode ? '#242424' : 'white')};
  box-sizing: border-box;
  border-radius: 14px;
  overflow: hidden;
  z-index: ${(props) => props.$zIndex};
`;

export interface PixelatedProps {
  size: number;
  blocks: number;
  zIndex: number;
}

const Pixelated = (props: PixelatedProps) => {
  const { size, blocks, zIndex } = props;
  const { theme } = useTheme();
  const dimension = size / blocks;
  const truncatedColors = Object.values(colors).slice(0, 64);
  return (
    <PixelatedContent $isDarkMode={theme === ThemeMode.DARK} $zIndex={zIndex}>
      {range(blocks).map((num) => {
        return (
          <div key={num} style={{ display: 'flex', flexDirection: 'column', flex: 0 }}>
            {range(blocks).map((innerNum) => {
              const randomColorIdx = Math.floor(Math.random() * truncatedColors.length) % truncatedColors.length;
              return (
                <div
                  key={innerNum}
                  style={{
                    width: dimension,
                    height: dimension,
                    background: `rgb(${truncatedColors[randomColorIdx]})`
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </PixelatedContent>
  );
};

export default Pixelated;
