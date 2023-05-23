import './skiff-subpage-tooltip.css';

import { Button, Size } from 'nightwatch-ui';
import React from 'react';

class AddSubpageTooltip extends React.PureComponent<
  {
    close: (subpage?: Record<string, any> | null | string) => void;
  },
  {
    hidden: boolean;
    title: string;
  }
> {
  state = {
    hidden: false,
    title: ''
  };

  _onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    this.setState({
      title
    });
  };

  _onTitleKeyDown = (e: any) => {
    if (e.key === 'Escape') {
      e.preventDefault();

      if (this.props.close) {
        this.props.close(undefined);
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault();

      if (this.props.close) {
        this.props.close(this.state.title);
      }

      this.setState({
        title: ''
      });
    }
  };

  _onButtonPress = (e: any) => {
    e.preventDefault();
    if (this.props.close) {
      this.props.close(this.state.title);
    }

    this.setState({
      title: ''
    });
  };

  render() {
    const { title } = this.state;
    return (
      <div className='skiff-subpage-tooltip'>
        <input
          autoFocus
          data-test='subpage-input'
          onChange={this._onTitleChange}
          onKeyDown={this._onTitleKeyDown}
          placeholder='New subpage name...'
          value={title}
        />
        <Button dataTest='subpage-create-button' onClick={this._onButtonPress} size={Size.SMALL}>
          Create
        </Button>
      </div>
    );
  }
}

export default AddSubpageTooltip;
