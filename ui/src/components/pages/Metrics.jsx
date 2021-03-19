import React from 'react';
import { GRAFANA_ROOT } from '../../Constants';

const defaultProps = {};

export default function Metrics(props) {
  return (
    <React.Fragment>
      <iframe
        frameBorder="0"
        style={{ overflow: 'hidden', height: '100%', width: '100%' }}
        width="100%"
        height="100%"
        src={GRAFANA_ROOT}
        title="Grafana"
      ></iframe>
    </React.Fragment>
  );
}

Metrics.defaultProps = defaultProps;
