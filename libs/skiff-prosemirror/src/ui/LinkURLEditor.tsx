import './skiff-form.css';
import './skiff-image-url-editor.css';

import React from 'react';

import sanitizeURL from '../sanitizeURL';

import { ENTER } from './KeyCodes';
import preventEventDefault from './preventEventDefault';

const BAD_CHARACTER_PATTER = /\s/;

class LinkURLEditor extends React.PureComponent<
  {
    href: string | null;
    close: (href?: string | null) => void;
  },
  any
> {
  constructor(props: any) {
    super(props);
    this.state = {
      url: this.props.href
    };
  }

  _onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.keyCode === ENTER) {
      e.preventDefault();

      this._apply();
    }
  };

  _onURLChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    this.setState({
      url
    });
  };

  _cancel = (): void => {
    this.props.close?.();
  };

  _apply = (): void => {
    const { url } = this.state;

    if (url && !BAD_CHARACTER_PATTER.test(url)) {
      this.props.close?.(sanitizeURL(url));
    }
  };

  render(): React.ReactElement<any> {
    const { href } = this.props;
    const { url } = this.state;
    const error = url ? BAD_CHARACTER_PATTER.test(url) : false;
    let label = 'Link';
    let disabled = !!error;

    if (href) {
      label = url ? 'Link' : 'Unlink';
      disabled = error;
    } else {
      disabled = error || !url;
    }

    return (
      <div className='skiff-image-url-editor'>
        <form
          className='skiff-form'
          onSubmit={preventEventDefault}
          style={{
            display: 'inline-flex',
            alignItems: 'center'
          }}
        >
          <fieldset>
            <input
              autoFocus
              className='skiff-image-url-editor-src-input'
              data-test='link-input'
              onChange={this._onURLChange}
              onKeyDown={this._onKeyDown}
              placeholder='Website link'
              spellCheck={false}
              type='text'
              value={url || ''}
            />
          </fieldset>
        </form>
      </div>
    );
  }
}

export default LinkURLEditor;
