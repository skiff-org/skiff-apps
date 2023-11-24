import {
  BackgroundBlocker,
  DROPDOWN_CALLER_CLASSNAME,
  getThemedColor,
  InputField,
  Portal,
  Size,
  ThemeMode,
  useOnClickOutside
} from 'nightwatch-ui';
import { FC, useEffect, useRef, useState } from 'react';
import { HexAlphaColorPicker } from 'react-colorful';
import styled from 'styled-components';
import isHexColor from 'validator/lib/isHexColor';

const COLOR_PICKER_WIDTH = 210;
const COLOR_PICKER_HEIGHT = 286;
const OVERFLOW_PADDING = 10;

const SketchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--bg-emphasis);
  border-radius: 4px;
  padding: 6px;
  width: ${COLOR_PICKER_WIDTH}px;
  padding-top: 4px;
  border: 1px solid ${getThemedColor('var(--border-primary)', ThemeMode.DARK)};
  box-shadow: var(--shadow-l2);
`;

const StyledHexAlphaColorPicker = styled(HexAlphaColorPicker)`
  width: ${COLOR_PICKER_WIDTH}px !important;
  .react-colorful__saturation {
    border-radius: 2px !important;
  }
  .react-colorful__hue {
    height: 10px !important;
  }
  .react-colorful__alpha {
    border-radius: 0px !important;
    height: 10px !important;
    box-sizing: border-box !important;
  }

  .react-colorful__pointer {
    height: 12px !important;
    width: 12px !important;
  }

  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StyledHexColorInput = styled(InputField)<{ $error?: boolean }>`
  -webkit-box-flex: 2;
  flex: 2 1 0%;
  * input {
    background: ${getThemedColor('var(--bg-overlay-secondary)', ThemeMode.DARK)} !important;
    border-radius: 2px !important;
    border: 1px solid ${getThemedColor('var(--border-secondary)', ThemeMode.DARK)} !important;
    border-color: ${(props) =>
      props.$error ? getThemedColor('var(--icon-destructive)', ThemeMode.DARK) : ''} !important;
    width: 100% !important;
    color: ${getThemedColor('var(--text-secondary)', ThemeMode.DARK)} !important;
    padding: 2px 4px !important;
    outline: none !important;
    font-size: 11px !important;
    height: 24px !important;
    font-family: 'Skiff Mono', monospace !important;
    font-weight: 300 !important;
    box-sizing: border-box !important;
  }
`;

const StyledRgbColorInput = styled(InputField)<{ $error?: boolean }>`
  flex: 1 1 0%;
  -webkit-box-flex: 1;
  padding-left: 6px;
  * input {
    background: ${getThemedColor('var(--bg-overlay-secondary)', ThemeMode.DARK)} !important;
    border-radius: 2px !important;
    border: 1px solid ${getThemedColor('var(--border-secondary)', ThemeMode.DARK)} !important;
    border-color: ${(props) =>
      props.$error ? getThemedColor('var(--icon-destructive)', ThemeMode.DARK) : ''} !important;
    width: 100% !important;
    color: ${getThemedColor('var(--text-secondary)', ThemeMode.DARK)} !important;
    padding: 2px 4px !important;
    outline: none !important;
    font-size: 11px !important;
    height: 24px !important;
    font-family: 'Skiff Mono', monospace !important;
    font-weight: 300 !important;
    box-sizing: border-box !important;
  }
`;

const PickerSwitch = styled.button`
  height: 16px;
  width: 16px;
  cursor: pointer;
  position: relative;
  outline: none;
  border-radius: 3px;
  border: 0;
  box-shadow: rgba(255, 255, 255, 0.15) 0px 0px 0px 1px inset;
`;

const PickerSwatch = styled.div`
  padding-top: 2px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ColorPreview = styled.div<{ $color: string }>`
  width: 36px;
  height: 36px;
  aspect-ratio: 1;
  border-radius: 8px;
  border: 3px solid #1a1a1a;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  background: ${(props) => props.$color};
`;

const InputContainer = styled.div`
  display: flex;
`;

const PreviewSwatch = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
`;

const presetColors: string[] = [
  '#d0021b',
  '#f5a623',
  '#f8e71c',
  '#8b572a',
  '#7ed321',
  '#417505',
  '#bd10e0',
  '#9013fe',
  '#4a90e2',
  '#50e3c2',
  '#b8e986',
  '#000000',
  '#9b9b9b',
  '#ffffff'
];

const defaultRgba = {
  r: '0',
  g: '0',
  b: '0',
  a: '1'
};

const hextoRgba = (hex: string) => {
  let normalizedHex = hex.charAt(0) === '#' ? hex.slice(1) : hex;

  // Check for 3 or 4 character hex and expand it to 6 or 8 characters
  if (normalizedHex.length === 3) {
    normalizedHex = normalizedHex
      .split('')
      .map((char) => char + char)
      .join('');
  } else if (normalizedHex.length === 4) {
    normalizedHex = normalizedHex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  // Ensure the hex string is of valid length
  if (normalizedHex.length !== 6 && normalizedHex.length !== 8) {
    return defaultRgba;
  }

  const r = parseInt(normalizedHex.slice(0, 2), 16);
  const g = parseInt(normalizedHex.slice(2, 4), 16);
  const b = parseInt(normalizedHex.slice(4, 6), 16);

  // If alpha is present, extract it, otherwise default to 255 (opaque)
  const a = ((normalizedHex.length === 8 ? parseInt(normalizedHex.slice(6, 8), 16) : 255) / 255).toFixed(1);

  return {
    r: r.toString(),
    g: g.toString(),
    b: b.toString(),
    a: a.toString()
  };
};

const rgbaToHex = (r: string, g: string, b: string, a: string) => {
  const hexR = parseInt(r || '0')
    .toString(16)
    .padStart(2, '0');
  const hexG = parseInt(g || '0')
    .toString(16)
    .padStart(2, '0');
  const hexB = parseInt(b || '0')
    .toString(16)
    .padStart(2, '0');
  const hexA = Math.round(parseFloat(a || '1') * 255)
    .toString(16)
    .padStart(2, '0');

  if (hexA === 'ff') {
    return `#${hexR}${hexG}${hexB}`;
  }
  return `#${hexR}${hexG}${hexB}${hexA}`;
};

const isValidRgba = (value: string, type: 'r' | 'g' | 'b' | 'a') => {
  const num = Number(value);
  switch (type) {
    case 'r':
    case 'g':
    case 'b':
      return num >= 0 && num <= 255;
    case 'a':
      return num >= 0 && num <= 1;
    default:
      return false;
  }
};

interface ColorPickerProps {
  handleColorChange: (color: string) => void;
  colorContainerRef: React.RefObject<HTMLDivElement>;
  buttonRef: React.RefObject<HTMLDivElement>;
  open: boolean;
  value: string;
  leftOffset?: number;
  topOffset?: number;
}

/**
 * This is the color picker pane that appears when the user clicks on the color button in the toolbar.
 */
const ColorPicker: FC<ColorPickerProps> = ({
  handleColorChange,
  colorContainerRef,
  buttonRef,
  open,
  value,
  leftOffset = 0,
  topOffset = 0
}: ColorPickerProps) => {
  const hexInputRef = useRef<HTMLInputElement>(null);
  const rInputRef = useRef<HTMLInputElement>(null);
  const gInputRef = useRef<HTMLInputElement>(null);
  const bInputRef = useRef<HTMLInputElement>(null);
  const aInputRef = useRef<HTMLInputElement>(null);

  const [hexInputClicked, setHexInputClicked] = useState<boolean>(false);
  const [rInputClicked, setRInputClicked] = useState<boolean>(false);
  const [gInputClicked, setGInputClicked] = useState<boolean>(false);
  const [bInputClicked, setBInputClicked] = useState<boolean>(false);
  const [aInputClicked, setAInputClicked] = useState<boolean>(false);

  const [rErrorState, setRErrorState] = useState(false);
  const [gErrorState, setGErrorState] = useState(false);
  const [bErrorState, setBErrorState] = useState(false);
  const [aErrorState, setAErrorState] = useState(false);

  const color = value || '#000000';
  const rgba = hextoRgba(color);

  const [hexInput, setHexInput] = useState<string>(isHexColor(color) ? color : '');
  const [rgbaInput, setRgbaInput] = useState<{ r: string; g: string; b: string; a: string }>(rgba);

  useEffect(() => {
    setRgbaInput(rgba);
    if (isHexColor(color)) {
      setHexInput(color);
    }
  }, [color]);

  const [hexErrorState, setHexErrorState] = useState(false);

  const handleChangeComplete = (color: string) => {
    handleColorChange(color);
    setHexInput(color);
    setRgbaInput(hextoRgba(color));
  };

  // set InputClicked to false when the user clicks outside of any of the inputs
  useOnClickOutside(hexInputRef, () => setHexInputClicked(false));
  useOnClickOutside(rInputRef, () => setRInputClicked(false));
  useOnClickOutside(gInputRef, () => setGInputClicked(false));
  useOnClickOutside(bInputRef, () => setBInputClicked(false));
  useOnClickOutside(aInputRef, () => setAInputClicked(false));

  const handleHexBlur = () => {
    if (hexInputClicked && hexInputRef.current) {
      hexInputRef.current.focus();
    }
  };

  const handleRBlur = () => {
    if (rInputClicked && rInputRef.current) {
      rInputRef.current.focus();
    }
  };

  const handleGBlur = () => {
    if (gInputClicked && gInputRef.current) {
      gInputRef.current.focus();
    }
  };

  const handleBBlur = () => {
    if (bInputClicked && bInputRef.current) {
      bInputRef.current.focus();
    }
  };

  const handleABlur = () => {
    if (aInputClicked && aInputRef.current) {
      aInputRef.current.focus();
    }
  };

  useEffect(() => {
    if (!hexInput) {
      setHexErrorState(false);
    } else if (!isHexColor(hexInput)) {
      setHexErrorState(true);
    }
  }, [hexInput]);

  // when either color picker is closed clear error state and hexcolor string
  useEffect(() => {
    if (!open) {
      setHexInput('');
      setRgbaInput(defaultRgba);
      setHexErrorState(false);
    }
  }, [open]);

  const ref = buttonRef;
  const left = (ref as React.MutableRefObject<HTMLDivElement>).current?.getBoundingClientRect().left || 0;
  const top = (ref as React.MutableRefObject<HTMLDivElement>).current?.getBoundingClientRect().top || 0;

  let adjustedLeft = left + leftOffset;
  let adjustedTop = top + topOffset;

  if (adjustedLeft + COLOR_PICKER_WIDTH > window.innerWidth) {
    adjustedLeft = window.innerWidth - COLOR_PICKER_WIDTH - OVERFLOW_PADDING;
  }

  if (adjustedTop + COLOR_PICKER_HEIGHT > window.innerHeight) {
    adjustedTop = window.innerHeight - COLOR_PICKER_HEIGHT - OVERFLOW_PADDING;
  }

  const isDefault = defaultRgba === rgba;

  const hexInputValue = hexInput || (isDefault ? '' : color.toUpperCase());

  if (!open) return null;

  const updateRgba = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const rgbaError = rErrorState || gErrorState || bErrorState || aErrorState;
    if (e.key === 'Enter' && !rgbaError) {
      const { r, g, b, a } = rgbaInput;
      const newHexColor = rgbaToHex(r, g, b, a);
      handleChangeComplete(newHexColor);
    }
  };

  return (
    <Portal>
      <BackgroundBlocker />
      <SketchContainer
        className={DROPDOWN_CALLER_CLASSNAME}
        onClick={(e) => e.stopPropagation()}
        ref={colorContainerRef}
        style={{
          zIndex: 99999999999999,
          position: 'absolute',
          left: adjustedLeft,
          top: adjustedTop
        }}
      >
        <StyledHexAlphaColorPicker color={color} onChange={handleChangeComplete} />
        <InputContainer>
          <StyledHexColorInput
            $error={!!hexInputValue && hexErrorState}
            forceTheme={ThemeMode.DARK}
            innerRef={hexInputRef}
            onBlur={handleHexBlur}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              // Prepend # if missing
              let val = e.target.value;
              if (val.length > 0 && val[0] !== '#') {
                val = `#${val}`;
              }
              setHexInput(val);
              setRgbaInput(hextoRgba(val));
            }}
            onClick={() => setHexInputClicked(true)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                if (!hexInput || !isHexColor(hexInput)) return;
                handleChangeComplete(hexInput);
              }
            }}
            placeholder='Color'
            size={Size.SMALL}
            value={hexInput.toUpperCase()}
          />
          <StyledRgbColorInput
            $error={rErrorState}
            forceTheme={ThemeMode.DARK}
            innerRef={rInputRef}
            onBlur={handleRBlur}
            onChange={(e) => {
              const newR = e.target.value;
              setRgbaInput((prev) => ({ ...prev, r: newR }));
              setRErrorState(!isValidRgba(newR, 'r'));
            }}
            onClick={() => setRInputClicked(true)}
            onKeyPress={updateRgba}
            placeholder='R'
            size={Size.SMALL}
            value={rgbaInput.r}
          />
          <StyledRgbColorInput
            $error={gErrorState}
            forceTheme={ThemeMode.DARK}
            innerRef={gInputRef}
            onBlur={handleGBlur}
            onChange={(e) => {
              const newG = e.target.value;
              setRgbaInput((prev) => ({ ...prev, g: newG }));
              setGErrorState(!isValidRgba(newG, 'g'));
            }}
            onClick={() => setGInputClicked(true)}
            onKeyPress={updateRgba}
            placeholder='G'
            size={Size.SMALL}
            value={rgbaInput.g}
          />
          <StyledRgbColorInput
            $error={bErrorState}
            forceTheme={ThemeMode.DARK}
            innerRef={bInputRef}
            onBlur={handleBBlur}
            onChange={(e) => {
              const newB = e.target.value;
              setRgbaInput((prev) => ({ ...prev, b: newB }));
              setBErrorState(!isValidRgba(newB, 'b'));
            }}
            onClick={() => setBInputClicked(true)}
            onKeyPress={updateRgba}
            placeholder='B'
            size={Size.SMALL}
            value={rgbaInput.b}
          />
          <StyledRgbColorInput
            $error={aErrorState}
            forceTheme={ThemeMode.DARK}
            innerRef={aInputRef}
            onBlur={handleABlur}
            onChange={(e) => {
              const newA = e.target.value;
              setRgbaInput((prev) => ({ ...prev, a: newA }));
              setAErrorState(!isValidRgba(newA, 'a'));
            }}
            onClick={() => setAInputClicked(true)}
            onKeyPress={updateRgba}
            placeholder='A'
            size={Size.SMALL}
            value={rgbaInput.a}
          />
        </InputContainer>
        <PreviewSwatch>
          <ColorPreview $color={color} />
          <PickerSwatch>
            {presetColors.map((presetColor) => (
              <PickerSwitch
                key={presetColor}
                onClick={() => handleChangeComplete(presetColor)}
                style={{ background: presetColor }}
              />
            ))}
          </PickerSwatch>
        </PreviewSwatch>
      </SketchContainer>
    </Portal>
  );
};

export default ColorPicker;
