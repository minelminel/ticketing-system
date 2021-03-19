import React from 'react';
import { useForm } from 'react-hook-form';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import styled, { css } from 'styled-components';

const StyledLabel = styled(Form.Label)`
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

const ClickableText = styled.span`
  color: var(--secondary);
  font-style: italic;
  &:hover {
    text-decoration: underline;
    cursor: pointer;
  }
`;

const defaultProps = {
  user: null,
};

export default function IssueForm(props) {
  const { user } = props;

  const { register, handleSubmit, setValue, errors } = useForm({
    defaultValues: {
      created_by: user, // set in field as defaultValue
      issue_project: null,
      issue_summary: null,
      issue_type: 'TASK',
      issue_priority: '3',
      issue_story_points: null,
      issue_affected_version: null,
      issue_assigned_to: null,
      issue_description: null,
    },
  });
  const onSubmit = (data) => console.log(data);

  return (
    <React.Fragment>
      <h4>Create Issue</h4>
      <Form onSubmit={handleSubmit(onSubmit)}>
        {/* HIDDEN FIELDS */}
        <Form.Group>
          <Form.Control
            name="created_by"
            type="text"
            defaultValue={user}
            ref={register}
            hidden
          />
        </Form.Group>
        {/* VISIBLE FIELDS */}
        <Form.Group>
          <StyledLabel required>Project</StyledLabel>
          <Form.Control
            name="issue_project"
            as="select"
            ref={register({ required: true })}
          >
            <option value="ABC">The ABC Project</option>
          </Form.Control>
          {errors.issue_project && (
            <ValidationError>This field is required</ValidationError>
          )}
        </Form.Group>
        <Form.Group>
          <StyledLabel required>Summary</StyledLabel>
          <Form.Control
            name="issue_summary"
            type="text"
            ref={register({ required: true })}
          />
          {errors.issue_summary && (
            <ValidationError>This field is required</ValidationError>
          )}
        </Form.Group>
        <Form.Group>
          <StyledLabel required>Type</StyledLabel>
          <Form.Control
            as="select"
            name="issue_type"
            ref={register({ required: true })}
          >
            <option value="BUG">Bug</option>
            <option value="TASK">Task</option>
            <option value="FEATURE">Feature</option>
            <option value="REQUIREMENT">Requirement</option>
            <option value="SUPPORT">Support</option>
            <option value="EPIC">Epic</option>
          </Form.Control>
          {errors.issue_type && (
            <ValidationError>This field is required</ValidationError>
          )}
        </Form.Group>
        <Form.Group>
          <StyledLabel required>Priority</StyledLabel>
          <Form.Control
            as="select"
            name="issue_priority"
            ref={register({ required: true })}
          >
            <option value="1">1 - Highest</option>
            <option value="2">2 - High</option>
            <option value="3">3 - Normal</option>
            <option value="4">4 - Low</option>
            <option value="5">5 - Lowest</option>
          </Form.Control>
          {errors.issue_priority && (
            <ValidationError>This field is required</ValidationError>
          )}
        </Form.Group>
        <Form.Group>
          <StyledLabel required>Story Points</StyledLabel>
          <Form.Control
            name="issue_story_points"
            type="number"
            ref={register({ required: true })}
          />
          {errors.issue_story_points && (
            <ValidationError>This field is required</ValidationError>
          )}
        </Form.Group>
        <Form.Group>
          <StyledLabel>Affected Version/s</StyledLabel>
          <Form.Control
            name="issue_affected_version"
            type="text"
            ref={register}
          />
        </Form.Group>
        <Form.Group>
          <StyledLabel>Assigned User</StyledLabel>
          <ClickableText
            className="ml-3"
            onClick={() => setValue('issue_assigned_to', user)}
          >
            Assign To Me
          </ClickableText>
          <Form.Control name="issue_assigned_to" type="text" ref={register} />
        </Form.Group>
        <Form.Group>
          <StyledLabel>Description</StyledLabel>
          <Form.Control
            name="issue_description"
            as="textarea"
            rows={3}
            ref={register}
          />
        </Form.Group>
        <Button variant="primary" type="submit">
          Submit
        </Button>
      </Form>
    </React.Fragment>
  );
}

IssueForm.defaultProps = defaultProps;
