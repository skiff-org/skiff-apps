import { Editor, EditorContent, useEditor } from '@tiptap/react';
import { FilledVariant, Icon, IconText } from '@skiff-org/skiff-ui';
import { MutableRefObject, useCallback, useEffect, useMemo, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import { useTheme, useToast } from 'skiff-front-utils';
import { kbToBytes, bytesToHumanReadable, MAX_SIGNATURE_SIZE_KB } from 'skiff-utils';
import styled from 'styled-components';

import { ColorPopup } from '../MailEditor/Color';
import { buildEditorExtensions, EditorExtensionsOptions } from '../MailEditor/Extensions';
import { PopupPluginType, popupTypePluginKey } from '../MailEditor/Extensions/PopupPlugin';
import { LinkCreatePopup, LinkPopup } from '../MailEditor/Link';
import { fromEditorToHtml } from '../MailEditor/mailEditorUtils';
import { Placeholder } from '../MailEditor/Placeholder';
import { ToolBar } from '../MailEditor/ToolBar';

const TextAreaButton = styled.div<{ isEditing: boolean }>`
  margin: ${(props) => (props.isEditing ? '24px 0 0 0' : '0')};
`;

const EditorContainer = styled.div`
  overflow-y: auto;
  padding-top: 16px;
  position: relative;
  background: var(--bg-field-default);
  padding: 8px 12px;
  border-radius: 8px;
  cursor: text;
  color: var(--text-primary);
  ::placeholder {
    color: var(--text-disabled);
  }
`;

const Buttons = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  gap: 12px;
  justify-content: flex-end;
`;

type SettingTextAreaProps = {
  errorMsg?: string;
  innerRef: MutableRefObject<Editor | null>;
  isEditing: boolean;
  placeholder: string;
  setValue: (arg: string) => void;
  onDelete: () => void;
  onFocus: () => void;
  onSave: () => void;
  value?: string;
};

export const SettingTextArea = ({
  innerRef,
  isEditing,
  placeholder,
  setValue,
  onDelete,
  onFocus,
  onSave,
  value
}: SettingTextAreaProps) => {
  const { theme } = useTheme();
  const { enqueueToast } = useToast();
  // Using memo for readability - create on mount once
  const settingEditorExtensions: EditorExtensionsOptions = useMemo(
    () => ({
      disableBlockquoteToggle: true,
      isMobileApp: isMobile,
      theme,
      isMailSettingEditor: true
    }),
    [theme]
  );
  const boundingRef = useRef<HTMLDivElement>(null);
  const editorBoundingRect = boundingRef?.current?.getBoundingClientRect();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    editable: true,
    content: value,
    extensions: buildEditorExtensions(settingEditorExtensions),
    onUpdate: ({ editor: updatedEditor }) => {
      const text = fromEditorToHtml(updatedEditor as Editor);
      setValue(text);
    },
    onFocus: onFocus,
    editorProps: {
      handleDrop: (view, event) => {
        const dragEvent = event as DragEvent;
        const hasFiles = dragEvent.dataTransfer && dragEvent.dataTransfer.files && dragEvent.dataTransfer.files.length;
        if (!hasFiles) {
          return false;
        }

        const images = Array.from(dragEvent.dataTransfer.files).filter((file) => /image/i.test(file.type));

        if (images.length === 0) {
          return false;
        }

        event.preventDefault();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { schema } = view.state;
        const coordinates = view.posAtCoords({ left: dragEvent.clientX, top: dragEvent.clientY });

        images.forEach((image) => {
          const reader = new FileReader();
          if (image.size > kbToBytes(MAX_SIGNATURE_SIZE_KB)) {
            enqueueToast({
              title: 'Image too large',
              body: `Image must be under ${MAX_SIGNATURE_SIZE_KB} kb`
            });
            return;
          }
          reader.onload = (readerEvent) => {
            if (!readerEvent.target || !coordinates) {
              return;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            const node = schema.nodes.image.create({
              src: readerEvent.target.result
            });
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const transaction = view.state.tr.insert(coordinates.pos, node);
            view.dispatch(transaction);
          };
          reader.readAsDataURL(image);
        });
        return true;
      }
    }
  });

  const insertImage = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!editor) {
        return;
      }
      const file = e.target.files?.[0];
      if (!file) {
        console.error('No file selected');
        return;
      }
      if (file.size > kbToBytes(MAX_SIGNATURE_SIZE_KB)) {
        enqueueToast({
          title: 'Image too large',
          body: `Image must be under ${bytesToHumanReadable(kbToBytes(MAX_SIGNATURE_SIZE_KB))}`
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        if (!readerEvent.target) {
          console.error('No file found');
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { schema } = editor.view.state;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const node = schema.nodes.image.create({
          src: readerEvent.target.result
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const transaction = editor.view.state.tr.replaceSelectionWith(node);
        editor.view.dispatch(transaction);
      };
      reader.readAsDataURL(file);
    },
    [editor]
  );

  useEffect(() => {
    if (editor) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      editor.extensionStorage[Placeholder.name].placeholderContent = placeholder;
    }
  }, [editor?.extensionStorage, placeholder]);

  if (editor) {
    innerRef.current = editor;
  }

  const linkCreateOpen = editor
    ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      popupTypePluginKey.getState(editor.view.state)?.open === PopupPluginType.Link
    : undefined;
  const colorPickerOpen = editor
    ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      popupTypePluginKey.getState(editor.view.state)?.open === PopupPluginType.Color
    : undefined;
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <EditorContainer
        onClick={() => {
          editor?.commands.focus();
        }}
        ref={containerRef}
      >
        {editor && (
          <ToolBar editor={editor} editorBoundingRect={editorBoundingRect} preventFloating={editor.isActive('link')} />
        )}
        {linkCreateOpen && editor && <LinkCreatePopup editor={editor} editorContainerRef={containerRef} />}
        {colorPickerOpen && editor && <ColorPopup editor={editor} editorContainerRef={containerRef} />}
        {editor && editor.isActive('link') && <LinkPopup editor={editor} editorContainerRef={containerRef} />}
        {editor && (
          <div ref={boundingRef}>
            <EditorContent editor={editor} />
          </div>
        )}
        <TextAreaButton isEditing={isEditing}>
          {isEditing && (
            <Buttons>
              <IconText iconColor='destructive' key='delete' onClick={onDelete} startIcon={Icon.Trash} />
              <IconText key='image' onClick={() => imageInputRef.current?.click()} startIcon={Icon.Image} />
              <IconText key='save' label='Save' onClick={onSave} variant={FilledVariant.FILLED} />
            </Buttons>
          )}
        </TextAreaButton>
        <input
          multiple={true}
          onChange={(e) => void insertImage(e)}
          ref={imageInputRef}
          style={{ display: 'none' }}
          type='file'
        />
      </EditorContainer>
    </>
  );
};
