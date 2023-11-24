import styled, { css } from 'styled-components';

import { ThemeMode } from 'nightwatch-ui';
import { useTheme } from '../../../../theme/AppThemeProvider';
import { PreviewObject } from '../RecentFilePreview.types';

const StyledAudio = styled.audio<{ isDarkMode?: boolean }>`
  border: none;
  outline: none;
  border-radius: 0px;

  ::-webkit-media-controls-enclosure {
    border-radius: 4px !important;
  }
  ::-webkit-media-controls-panel {
    background: var(--bg-l0-solid);
    border: none;
    outline: none;
    border-radius: 0px;
  }

  ${(props) =>
    props.isDarkMode &&
    css`
      ::-webkit-media-controls-mute-button {
        filter: invert(1);
      }

      ::-webkit-media-controls-play-button {
        filter: invert(1);
      }

      // ::-webkit-media-controls-timeline-container

      ::-webkit-media-controls-current-time-display {
        filter: invert(1);
      }

      ::-webkit-media-controls-time-remaining-display {
        filter: invert(1);
      }

      ::-webkit-media-controls-timeline {
        filter: invert(1);
      }

      // ::-webkit-media-controls-volume-slider-container

      ::-webkit-media-controls-volume-slider {
        filter: invert(1);
      }

      ::-webkit-media-controls-seek-back-button {
        filter: invert(1);
      }

      ::-webkit-media-controls-seek-forward-button {
        filter: invert(1);
      }

      ::-webkit-media-controls-fullscreen-button {
        filter: invert(1);
      }

      ::-webkit-media-controls-rewind-button {
        filter: invert(1);
      }

      ::-webkit-media-controls-return-to-realtime-button {
        filter: invert(1);
      }

      ::-webkit-media-controls-toggle-closed-captions-button {
        filter: invert(1);
      }
    `}
`;

const AudioPreview = ({ data, isEmbeddedInPage }: PreviewObject & { isEmbeddedInPage?: boolean }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === ThemeMode.DARK;
  return (
    <StyledAudio
      controls
      isDarkMode={isDarkMode}
      controlsList='nodownload noplaybackrate'
      src={data}
      style={{ width: isEmbeddedInPage ? '100%' : '80%' }}
    />
  );
};
export default AudioPreview;
