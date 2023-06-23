import {
  IconText,
  Icon,
  IconButton,
  Dropdown,
  DropdownItem,
  InputField,
  Size,
  ThemeMode,
  Type
} from '@skiff-org/skiff-ui';
import { Node } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import React, { LegacyRef } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';

import { CodeBlockSettings } from '../codeblock';
import { handlesFactory } from '../drag-and-drop/HandlesPlugin';
import { customStateKey } from '../skiffEditorCustomStatePlugin';
import uuid from '../ui/uuid';

const InputFieldContainer = styled.div<{ $numOfAvailableLangs: number }>`
  min-width: 138px;
  ${(props) => props.$numOfAvailableLangs > 0 && 'margin-bottom: 8px;'}
`;

interface LangDropdownProps {
  settings: CodeBlockSettings;
  node: Node;
  view: EditorView;
  getPos: (() => number) | boolean;
  readOnly?: boolean;
}

interface LangDropdownState {
  open: boolean;
  gutterEnabled: boolean;
  lang: string;
  id: string;
  wrapperRef: LegacyRef<HTMLDivElement> | undefined;
  input: string;
}

export const LANG_SELECTOR_BUTTON_ID = 'lang_selector_button';
class LanguageDropdown extends React.Component<LangDropdownProps, LangDropdownState> {
  state: Readonly<LangDropdownState> = {
    open: true,
    gutterEnabled: true,
    lang: this.props.node.attrs.lang as string,
    id: this.props.node.attrs.id as string,
    wrapperRef: undefined,
    input: ''
  };

  private wrapperRef: any;

  constructor(props: {
    settings: CodeBlockSettings;
    node: Node;
    view: EditorView;
    getPos: (() => number) | boolean;
    open: boolean;
    gutterEnabled: boolean;
    readonly: boolean;
  }) {
    super(props);
    this.setWrapperRef = this.setWrapperRef.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.state = { ...this.state, open: false, gutterEnabled: true };
  }

  componentDidUpdate(prevProps: Readonly<LangDropdownProps>, prevState: Readonly<LangDropdownState>) {
    if (prevProps.node.attrs.lang !== this.props.node.attrs.lang && this.state.lang !== this.props.node.attrs.lang) {
      this.setState({ lang: this.props.node.attrs.lang as string });
    }
    if (prevProps.node.attrs.id !== this.props.node.attrs.id && this.state.id !== this.props.node.attrs.id) {
      this.setState({ id: this.props.node.attrs.id as string });
    }
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  setWrapperRef(node: LegacyRef<HTMLDivElement> | undefined) {
    this.wrapperRef = node;
  }

  handleClickOutside(event: Event) {
    if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
      this.setState({ open: false });
    }
  }

  toggleList() {
    this.setState((prevState) => ({
      ...this.state,
      open: !prevState.open
    }));
  }

  closeList() {
    this.setState({
      ...this.state,
      open: false,
      input: ''
    });
  }

  handleKeyDown(e: React.KeyboardEvent<any>) {
    if (e.key === 'Escape') {
      this.closeList();
    }
  }

  render() {
    const selects = Array.from(document.querySelectorAll('.codeBlockSelectWrapper'));
    const selectIndex = selects.findIndex((element) => element.id === this.state.id);
    const regExp = new RegExp(`${this.state.input.toUpperCase().replace(/\s/g, '\\s')}`);
    const availableLangs = Object.keys(this.props.settings.languageLoaders ? this.props.settings.languageLoaders : {})
      .sort()
      .filter((item) => this.props.settings.languageWhitelist?.includes(item))
      // filtering out items depending on user input
      .filter((item) => item.toUpperCase().match(regExp) !== null);
    const handleKeyPress = (e: React.KeyboardEvent) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const lang = availableLangs.length === 1 ? availableLangs[0] : e.target.value;
      if (e.key === 'Enter' && availableLangs.includes(lang)) {
        this.setState({ ...this.state, open: false, lang: lang, input: '' });
        if (typeof this.props.getPos === 'function') {
          this.props.view.dispatch(
            this.props.view.state.tr.setNodeMarkup(this.props.getPos(), undefined, {
              ...this.props.node.attrs,
              lang
            })
          );
        }
      }
    };
    const parent = document.getElementById(this.state.id)?.parentElement;
    const gutter = !!parent
      ? (parent.getElementsByClassName('cm-gutters') as HTMLCollectionOf<HTMLElement>)[0]
      : undefined;
    const codeblock = !!parent
      ? (parent.getElementsByClassName('cm-content') as HTMLCollectionOf<HTMLElement>)[0]
      : undefined;

    const copyText = (e: React.MouseEvent) => {
      e?.stopPropagation();
      if (!codeblock || !codeblock.textContent) return;
      void navigator.clipboard.writeText(codeblock.textContent);
    };

    const toggleGutters = (e: React.MouseEvent) => {
      e?.stopPropagation();
      if (!gutter) return;
      const gutterEnabled = gutter.style.opacity === '1' || !gutter.style.opacity;
      this.setState((prevState) => ({
        ...this.state,
        gutterEnabled: !prevState.gutterEnabled
      }));
      gutter.style.paddingRight = gutterEnabled ? '10px' : '16px';
      gutter.style.opacity = gutterEnabled ? '0' : '1';
      gutter.style.width = gutterEnabled ? '0px' : '26px';
    };

    return (
      <div
        className='codeblock-select'
        style={{ zIndex: `${9999999 - selectIndex}` }}
        ref={this.wrapperRef as LegacyRef<HTMLDivElement> | undefined}
      >
        <div className='select-lang-container'>
          <div className='select-lang'>
            <IconText
              endIcon={this.state.open ? Icon.ChevronUp : Icon.ChevronDown}
              label={this.state.lang !== 'none' ? this.state.lang : 'Plaintext'}
              color='secondary'
              size={Size.SMALL}
              onClick={(e?: React.MouseEvent) => {
                e?.stopPropagation();
                if (this.props.readOnly) {
                  return;
                }
                this.toggleList();
              }}
              dataTest='code-lang-select=button'
            />
          </div>
          <div className='select-lang-buttons'>
            <IconButton type={Type.SECONDARY} icon={Icon.Copy} onClick={copyText} size={Size.SMALL} />
            <IconButton
              iconColor={this.state.gutterEnabled ? 'secondary' : 'disabled'}
              icon={Icon.NumberList}
              onClick={toggleGutters}
              size={Size.SMALL}
            />
          </div>
        </div>
        <div className='dropdown-container'>
          <Dropdown
            showDropdown={this.state.open}
            maxHeight={260}
            setShowDropdown={(target: boolean) => {
              if (!target) this.toggleList();
            }}
          >
            <InputFieldContainer $numOfAvailableLangs={availableLangs.length}>
              <InputField
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  this.setState({ ...this.state, input: (e.target as HTMLInputElement).value });
                }}
                onKeyPress={(e: React.KeyboardEvent<Element>) => {
                  handleKeyPress(e);
                }}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => this.handleKeyDown(e)}
                value={this.state.input}
                size={Size.SMALL}
                autoFocus
                forceTheme={ThemeMode.DARK}
                dataTest='code-lang-selector-input'
              />
            </InputFieldContainer>
            {availableLangs.map((lang, idx) => (
              <DropdownItem
                label={this.props.settings.languageNameMap?.[lang] || lang}
                key={`${lang}_${idx}`}
                data-test={`code-lang-${lang}`}
                active={lang === this.state.lang}
                onClick={() => {
                  this.setState({ ...this.state, open: false, lang: lang, input: '' });
                  if (typeof this.props.getPos === 'function') {
                    this.props.view.dispatch(
                      this.props.view.state.tr.setNodeMarkup(this.props.getPos(), undefined, {
                        ...this.props.node.attrs,
                        lang
                      })
                    );
                  }
                }}
              />
            ))}
          </Dropdown>
        </div>
      </div>
    );
  }
}
export const updateCustomSelect = (
  settings: CodeBlockSettings,
  dom: HTMLElement,
  node: Node,
  view: EditorView,
  getPos: (() => number) | boolean
) => {
  const readOnly = customStateKey.getState(view.state)?.readOnly;
  const cSelect = <LanguageDropdown settings={settings} node={node} view={view} getPos={getPos} readOnly={readOnly} />;
  const container = dom.querySelector('.codeBlockSelectWrapper');
  ReactDOM.render(cSelect, container);
  return () => {};
};

export const customCreateSelect = (
  settings: CodeBlockSettings,
  dom: HTMLElement,
  node: Node,
  view: EditorView,
  getPos: (() => number) | boolean
) => {
  const readOnly = customStateKey.getState(view.state)?.readOnly;
  const cSelect = <LanguageDropdown settings={settings} node={node} view={view} getPos={getPos} readOnly={readOnly} />;
  const container = document.createElement('div');
  container.className = 'codeBlockSelectWrapper';
  const id = `select-${uuid()}`;
  node.attrs.id = id;
  container.id = id;
  ReactDOM.render(cSelect, container);
  dom.prepend(container);
  if (typeof getPos === 'function')
    // mouseDown is a workaround for a safari bug where the codeblock can't be edited if draggable is true
    // So we set it when we start to drag, then set it back on drop
    dom.prepend(
      handlesFactory(
        true,
        () => {
          dom.draggable = true;
        },
        () => {
          dom.draggable = false;
        }
      )(view, getPos)
    );
  return () => {};
};
