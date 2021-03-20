import React from 'react';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';

const defaultProps = {
  className: ``,
  children: [],
  style: {},
  fluid: true,
  loading: false,
};

export default function Page(props) {
  return (
    <Container
      fluid={props.fluid}
      className={props.className}
      style={props.style}
    >
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
      {props.children}
    </Container>
  );
}

Page.defaultProps = defaultProps;
