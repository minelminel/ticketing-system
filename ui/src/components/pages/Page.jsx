import React from 'react';
import Container from 'react-bootstrap/Container';
import LoadingSpinner from '../atoms/LoadingSpinner';

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
      <LoadingSpinner loading={props.loading} />
      {props.children}
    </Container>
  );
}

Page.defaultProps = defaultProps;
