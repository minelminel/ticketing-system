import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Icon from '@material-ui/core/Icon';
import Toast from 'react-bootstrap/Toast';
import Table from 'react-bootstrap/Table';
import styled from 'styled-components';

import IssueNameLink from '../atoms/IssueNameLink';
import ActivityComment from '../atoms/ActivityComment';
import { formatTimestamp, copyToClipboard } from '../../Utils';

const Summary = styled.summary`
  margin-top: 0.25rem;
  margin-bottom: 0.75rem;
  font-weight: bold;
  font-size: large;
`;

function TitlePanel(props) {
  /*
   * User is able to navigate to project page, view the ticket name,
   * title/summary, and click an icon to copy a permalink to clipboard.
   */
  const [showToast, setShowToast] = useState(false);
  const [copiedSuccessfully, setCopiedSuccessfully] = useState(false);

  const { issue_name, issue_summary, issue_resolution } = props;

  const toggleShowToast = () => {
    setShowToast(!showToast);
  };

  const handleOnClick = () => {
    const success = copyToClipboard(window.location.href);
    setCopiedSuccessfully(success);
    toggleShowToast();
  };

  const toastStyle = {
    position: 'absolute',
    right: 0,
    color: copiedSuccessfully ? 'var(--success)' : 'var(--danger)',
  };

  return (
    <React.Fragment>
      <span>
        <Toast
          style={toastStyle}
          show={showToast}
          onClose={toggleShowToast}
          delay={2000}
          autohide
        >
          <Toast.Header>
            <img
              src="holder.js/20x20?text=%20"
              className="rounded mr-2"
              alt=""
            />
            <strong className="mr-auto">Copy to clipboard</strong>
          </Toast.Header>
          <Toast.Body>
            {copiedSuccessfully ? 'Success!' : 'Something went wrong'}
          </Toast.Body>
        </Toast>
        <h3>
          <IssueNameLink {...props} />
          <Icon
            onClick={() => handleOnClick()}
            title={`Copy link to clipboard`}
            style={{ marginLeft: '1rem', cursor: 'copy' }}
          >
            link
          </Icon>
        </h3>
        <h1>{issue_summary}</h1>
      </span>
    </React.Fragment>
  );
}

function DetailsPanel(props) {
  const {
    issue_type,
    issue_priority,
    issue_status,
    issue_resolution,
    issue_story_points,
    issue_affected_version,
    issue_fixed_version,
  } = props;
  return (
    <details open={true}>
      <Summary>Details</Summary>
      <Table striped borderless size="sm" className="table-vertical">
        <tbody>
          <tr>
            <th>Status:</th>
            <td>{issue_status}</td>
          </tr>
          <tr>
            <th>Resolution:</th>
            <td>{issue_resolution}</td>
          </tr>
          <tr>
            <th>Type:</th>
            <td>{issue_type}</td>
          </tr>
          <tr>
            <th>Priority:</th>
            <td>{issue_priority}</td>
          </tr>
          <tr>
            <th>Affects Version/s:</th>
            <td>{issue_affected_version}</td>
          </tr>
          <tr>
            <th>Fixed Version/s:</th>
            <td>{issue_fixed_version}</td>
          </tr>
          <tr>
            <th>Story Points:</th>
            <td>{issue_story_points}</td>
          </tr>
        </tbody>
      </Table>
    </details>
  );
}

function DatesPanel(props) {
  const { created_at, updated_at } = props;
  return (
    <details open={true}>
      <Summary>Dates</Summary>
      <Table striped borderless size="sm" className="table-vertical">
        <tbody>
          <tr>
            <th>Created:</th>
            <td>{formatTimestamp(created_at)}</td>
          </tr>
          <tr>
            <th>Updated:</th>
            <td>{formatTimestamp(updated_at)}</td>
          </tr>
        </tbody>
      </Table>
    </details>
  );
}

function PeoplePanel(props) {
  const { created_by, issue_assigned_to } = props;
  return (
    <details open={true}>
      <Summary>People</Summary>
      <Table striped borderless size="sm" className="table-vertical">
        <tbody>
          <tr>
            <th>Created By:</th>
            <td>{created_by}</td>
          </tr>
          <tr>
            <th>Assigned To:</th>
            <td>{issue_assigned_to}</td>
          </tr>
        </tbody>
      </Table>
    </details>
  );
}

function DescriptionPanel(props) {
  const { issue_description } = props;
  return (
    <details open={true}>
      <Summary>Description</Summary>
      <p>{issue_description || `No description`}</p>
    </details>
  );
}

function ActivityPanel(props) {
  const { activity } = props;
  return (
    <details open={true}>
      <Summary>Activity</Summary>
      <ul style={{ paddingLeft: '0' }}>
        {activity?.map((a) => (
          <ActivityComment key={uuidv4()} {...a} />
        ))}
      </ul>
    </details>
  );
}

export default function Issue(props) {
  return (
    <React.Fragment>
      <TitlePanel {...props} />
      <hr />
      <DetailsPanel {...props} />
      <hr />
      <DatesPanel {...props} />
      <hr />
      <PeoplePanel {...props} />
      <hr />
      <DescriptionPanel {...props} />
      <hr />
      <ActivityPanel {...props} />
      {/* <pre>{JSON.stringify(props, null, 2)}</pre> */}
    </React.Fragment>
  );
}
