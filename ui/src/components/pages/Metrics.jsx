import React from 'react';

const defaultProps = {};

export default function Metrics(props) {
  return (
    <React.Fragment>
      <iframe
        frameBorder="0"
        style={{ overflow: 'hidden', height: '100%', width: '100%' }}
        width="100%"
        height="100%"
        src="http://localhost:3001/?orgId=1"
        title="Grafana"
      ></iframe>
    </React.Fragment>
  );
}

Metrics.defaultProps = defaultProps;
