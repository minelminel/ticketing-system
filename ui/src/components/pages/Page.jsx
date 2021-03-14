import React from 'react';
import Container from 'react-bootstrap/Container';

const defaultProps = {
  className: ``,
  children: [],
  style: {},
  fluid: true,
};

export default function Page(props) {
  return (
    <Container
      fluid={props.fluid}
      className={props.className}
      style={props.style}
    >
      {props.children}
    </Container>
  );
}

Page.defaultProps = defaultProps;
