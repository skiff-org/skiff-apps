import { getThemedColor, Icon, IconText, ThemeMode, Typography, useOnClickOutside } from 'nightwatch-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import styled, { css } from 'styled-components';

import { PreviewObject } from '../RecentFilePreview.types';

export const VIDEO_UNSUPPORTED_FORMATS = ['video/x-msvideo', 'video/mpeg', 'video/ogg', 'video/3gpp', 'video/3gpp2'];

const StyledVideoPlayControls = styled.div<{ $isEmbeddedInPage?: boolean }>`
  display: flex;
  align-items: center;
  ${(props) =>
    props.$isEmbeddedInPage
      ? css`
          width: 100%;
        `
      : css`
          width: ${isMobile ? 'calc(100vw - 8px);%' : 'calc(90vw - 8px);'};
        `}
  box-sizing: border-box;
  background: ${getThemedColor('var(--bg-l1-solid)', ThemeMode.DARK)};
  padding: 8px 8px 8px 16px;
  gap: 8px;
  border-radius: 0px 0px 8px 8px;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
  outline: none;

  /*Chrome*/
  @media screen and (-webkit-min-device-pixel-ratio: 0) {
    input[type='range'] {
      -webkit-appearance: none;
      background-color: rgba(255, 255, 255, 0.08);
      border-radius: 100px;
      height: 4px;
      cursor: pointer;
      outline: none;
    }

    input[type='range']::-webkit-slider-runnable-track {
      height: 10px;
      -webkit-appearance: none;
      color: white;
    }

    input[type='range']::-webkit-slider-thumb {
      width: 8px;
      -webkit-appearance: none;
      height: 8px;
      cursor: pointer;
      background: white;
      margin-top: 1px;
      border-radius: 100px;
      filter: drop-shadow(0px 0.7500012516975403px 1.5000025033950806px rgba(0, 0, 0, 0.06))
        drop-shadow(0px 0.7500012516975403px 2.2500038146972656px rgba(0, 0, 0, 0.1));
    }
  }
  /** FF*/
  input[type='range']::-moz-range-progress {
    background-color: white;
  }
  input[type='range']::-moz-range-track {
    background-color: rgba(255, 255, 255, 0.08);
  }
  /* IE*/
  input[type='range']::-ms-fill-lower {
    background-color: white;
  }
  input[type='range']::-ms-fill-upper {
    background-color: rgba(255, 255, 255, 0.08);
  }
`;

const StyledVideo = styled.video`
  margin: auto;
  max-height: calc(100% - 50px);
`;

const VolumeSliderContainer = styled.div<{ $isEmbeddedInPage?: boolean }>`
  ${(props) =>
    props.$isEmbeddedInPage
      ? css`
          position: absolute;
          right: -60px;
          bottom: 90px;
          width: 157px;
        `
      : css`
          position: absolute;
          right: -52px;
          bottom: 108px;
        `}
  padding: 6px;
  border-radius: 32px;
  background: ${getThemedColor('var(--bg-l1-solid)', ThemeMode.DARK)};
  box-sizing: border-box;
  box-shadow: var(--shadow-l3);
  transform: rotate(-90deg);
  padding: 12px;
  display: flex;
`;

const CustomSlider = styled.input.attrs({ type: 'range' })<{ $value: number; $max: number }>`
  width: 100%;
  /* Add more styling for the video scrubber */
  appearance: none; /* Override default appearance */

  /* Track styles */
  &::-webkit-slider-runnable-track {
    height: 6px;
    background: transparent;
  }

  &::-moz-range-track {
    height: 6px;
    background: transparent;
  }

  /* Thumb styles */
  &::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
    transition: background 0.15s ease-in-out;
  }

  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border: none;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
  }

  /* Progress background */
  background: linear-gradient(
    90deg,
    white ${(props) => (props.$value / props.$max) * 100}%,
    rgba(255, 255, 255, 0.08) ${(props) => (props.$value / props.$max) * 100}%
  ) !important;
`;

const Relative = styled.div`
  position: relative;
`;

const CurrentTime = styled(Typography)`
  min-width: fit-content;
  font-variant-numeric: tabular-nums;
`;
const VideoPreview = ({ data, isEmbeddedInPage }: PreviewObject & { isEmbeddedInPage?: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const volumeRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [duration, setDuration] = useState<number>(0);
  const [scrubberValue, setScrubberValue] = useState<number>(0);

  useOnClickOutside(volumeRef, () => {
    setShowVolume(false);
  });

  const togglePlayPause = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          void videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    },
    [isPlaying]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        togglePlayPause();
      }
    },
    [togglePlayPause]
  );

  useEffect(() => {
    if (isEmbeddedInPage) return;
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // IMPORTANT: don't add event listeners when embedded in page, otherwise it will interfere with
    // typing inside the document
    if (isEmbeddedInPage) return;
    if (containerRef.current) {
      containerRef.current.addEventListener('keydown', handleKeyDown);
      return () => {
        if (!containerRef.current) return;
        containerRef.current.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, isEmbeddedInPage]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const volumeValue = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = volumeValue;
    }
    setVolume(volumeValue);
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    setScrubberValue(time);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.ontimeupdate = () => {
        if (!videoRef?.current?.currentTime) return;
        setCurrentTime(formatTime(videoRef.current.currentTime));
        setScrubberValue(videoRef.current.currentTime);
      };
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.ontimeupdate = null;
      }
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        setDuration(videoRef.current!.duration);
      };
    }
  }, []);

  return (
    <Container ref={containerRef} role='button' tabIndex={0}>
      <StyledVideo height='auto' onClick={togglePlayPause} ref={videoRef} src={data} width='100%'>
        <track kind='captions' />
      </StyledVideo>
      <StyledVideoPlayControls $isEmbeddedInPage={isEmbeddedInPage} onClick={(e) => e.stopPropagation()}>
        <IconText
          color='primary'
          forceTheme={ThemeMode.DARK}
          onClick={togglePlayPause}
          startIcon={isPlaying ? Icon.Pause : Icon.Play}
        />
        <CustomSlider
          $max={duration}
          $value={scrubberValue}
          max={duration.toString()}
          min='0'
          onChange={handleScrubberChange}
          step='0.1'
          value={scrubberValue.toString()}
        />
        <CurrentTime color='secondary' forceTheme={ThemeMode.DARK}>
          {currentTime}
        </CurrentTime>
        <IconText
          color='secondary'
          forceTheme={ThemeMode.DARK}
          onClick={() => {
            setShowVolume((prev) => !prev);
          }}
          startIcon={volume === 0 ? Icon.SoundSlash : Icon.Sound}
        />
        {showVolume && isEmbeddedInPage && (
          <Relative>
            <VolumeSliderContainer $isEmbeddedInPage ref={volumeRef}>
              <CustomSlider
                $max={1}
                $value={volume}
                max='1'
                min='0'
                onChange={handleVolumeChange}
                step='0.01'
                value={volume}
              />
            </VolumeSliderContainer>
          </Relative>
        )}
        {showVolume && !isEmbeddedInPage && (
          <VolumeSliderContainer ref={volumeRef}>
            <CustomSlider
              $max={1}
              $value={volume}
              max='1'
              min='0'
              onChange={handleVolumeChange}
              step='0.01'
              value={volume}
            />
          </VolumeSliderContainer>
        )}
      </StyledVideoPlayControls>
    </Container>
  );
};

export default VideoPreview;
