import React from 'react';

import { PreviewObject } from '../RecentFilePreview.types';
import styled from 'styled-components';

const StyledAudio = styled.audio`
  border: none;
  outline: none;
  border-radius: 0px;
  ::-webkit-media-controls-panel {
    background: #3f3f3f;
    border: none;
    outline: none;
    border-radius: 0px;
  }

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
`;

const AudioPreview = ({ data }: PreviewObject) => (
  <StyledAudio controls controlsList='nodownload noplaybackrate' src={data} style={{ width: '100%' }} />
);
export default AudioPreview;
