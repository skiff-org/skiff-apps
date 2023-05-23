import './skiff-frag.css';

import React from 'react';

class Frag extends React.PureComponent<any, any, any> {
  render() {
    return <div className='skiff-frag'>{this.props.children}</div>;
  }
}

export default Frag;
