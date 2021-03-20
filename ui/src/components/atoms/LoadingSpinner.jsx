import React from 'react';
import Spinner from 'react-bootstrap/Spinner';

const defaultProps = {
  loading: false,
};

export default function LoadingSpinner(props) {
  return (
    <React.Fragment>
      {props.loading && (
        <Spinner
          style={{
            position: 'absolute',
            top: '50%',
            right: '50%',
          }}
          animation="border"
          size="lg"
        />
      )}
    </React.Fragment>
  );
}

LoadingSpinner.defaultProps = defaultProps;
