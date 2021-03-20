import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import styled, { css } from 'styled-components';
import LoadingSpinner from '../atoms/LoadingSpinner';

import { request, encodeAuthHeaders } from '../../Requests';

const StyledLabel = styled(Form.Label)`
  font-size: 0.85rem;
  &:after {
    ${(props) =>
      props.required &&
      css`
        content: ' *';
        color: var(--danger);
      `};
  }
`;

const ValidationError = styled.span`
  color: var(--danger);
  font-size: small;
`;

const defaultProps = {
  style: {},
  route: '/auth/token',
  onSuccess: (data) => console.log(data),
};

export default function UserLoginForm(props) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const { register, handleSubmit, setValue, reset, errors } = useForm({
    defaultValues: {
      username: 'adam@example.com',
      password: 'default',
    },
  });

  const onSubmit = (data) => {
    setLoading(true);
    request({
      route: props.route,
      method: 'GET',
      headers: encodeAuthHeaders(data.username, data.password),
    }).then((json) => {
      setLoading(false);
      if (json.response !== 200) {
        setErrorMessage(`${json.response}: ${json.message}`);
        setValue('password', null);
      } else {
        reset();
        props.onSuccess(json);
      }
    });
  };

  return (
    <div style={props.style}>
      <h4>Login</h4>
      <LoadingSpinner loading={loading} />
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Form.Group>
          <StyledLabel required>Username</StyledLabel>
          <Form.Control
            name="username"
            size="sm"
            type="text"
            ref={register({ required: true })}
          />
          {errors.username && (
            <ValidationError>This field is required</ValidationError>
          )}
        </Form.Group>
        <Form.Group>
          <StyledLabel required>Password</StyledLabel>
          <Form.Control
            name="password"
            size="sm"
            type="password"
            ref={register({ required: true })}
          />
          {errors.password && (
            <ValidationError>This field is required</ValidationError>
          )}
        </Form.Group>
        <Button variant="primary" type="submit" size="sm">
          Login
        </Button>
        {errorMessage && (
          <span className="float-right" style={{ color: 'var(--danger)' }}>
            {errorMessage}
          </span>
        )}
      </Form>
      <br />
      <a href="/">Not signed up? Register here</a>
    </div>
  );
}

UserLoginForm.defaultProps = defaultProps;
