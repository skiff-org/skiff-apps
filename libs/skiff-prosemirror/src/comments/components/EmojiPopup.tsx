import { ThemeMode } from 'nightwatch-ui';
import React from 'react';
import { Suspense, FC } from 'react';

const Picker = React.lazy(() => import('emoji-mart').then((module) => ({ default: module.Picker })));

export interface EmojiPopupProps {
  open?: boolean;
  onSelect: (emoji: any) => void;
  style?: object;
  theme?: ThemeMode;
}

export const EmojiPopup: FC<EmojiPopupProps> = ({ open = true, onSelect, style = {}, theme = ThemeMode.LIGHT }) => {
  if (!open) return null;
  return (
    <Suspense fallback={<></>}>
      <Picker
        autoFocus
        enableFrequentEmojiSort
        set='apple'
        emojiSize={24}
        perLine={8}
        onSelect={onSelect}
        onClick={(_, e) => {
          e.stopPropagation();
        }}
        style={style}
        theme={theme}
        emojiTooltip={true}
        showSkinTones={false}
        showPreview={false}
      />
    </Suspense>
  );
};
