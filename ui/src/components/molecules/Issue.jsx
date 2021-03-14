import React from 'react';
import { v4 as uuidv4 } from 'uuid';

import IssueNameLink from '../atoms/IssueNameLink';
import { formatTimestamp } from '../../Utils';

function SummaryPanel(props) {
  const { issue_name, issue_summary, issue_resolution } = props;
  return (
    <span>
      <h3>
        <IssueNameLink {...props} />
      </h3>
      <h1>{issue_summary}</h1>
    </span>
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
    <details open>
      <summary>Details</summary>
      {/* <h3>Details</h3> */}
      <table>
        <tbody>
          <tr>
            <td>Status:</td>
            <td>{issue_status}</td>
          </tr>
          <tr>
            <td>Resolution:</td>
            <td>{issue_resolution}</td>
          </tr>
          <tr>
            <td>Type:</td>
            <td>{issue_type}</td>
          </tr>
          <tr>
            <td>Priority:</td>
            <td>{issue_priority}</td>
          </tr>
          <tr>
            <td>Affects Version/s:</td>
            <td>{issue_affected_version}</td>
          </tr>
          <tr>
            <td>Fixed Version/s:</td>
            <td>{issue_fixed_version}</td>
          </tr>
          <tr>
            <td>Story Points:</td>
            <td>{issue_story_points}</td>
          </tr>
        </tbody>
      </table>
    </details>
  );
}

function DatesPanel(props) {
  const { created_at, updated_at } = props;
  return (
    <details open>
      <summary>Dates</summary>
      <table>
        <tbody>
          <tr>
            <td>Created:</td>
            <td>{formatTimestamp(created_at)}</td>
          </tr>
          <tr>
            <td>Updated:</td>
            <td>{formatTimestamp(updated_at)}</td>
          </tr>
        </tbody>
      </table>
    </details>
  );
}

function PeoplePanel(props) {
  const { created_by, issue_assigned_to } = props;
  return (
    <details open>
      <summary>People</summary>
      <table>
        <tbody>
          <tr>
            <td>Created By:</td>
            <td>{created_by}</td>
          </tr>
          <tr>
            <td>Assigned To:</td>
            <td>{issue_assigned_to}</td>
          </tr>
        </tbody>
      </table>
    </details>
  );
}

function DescriptionPanel(props) {
  const { issue_description } = props;
  return (
    <details open>
      <summary>Description</summary>
      <p>{issue_description || `No description`}</p>
    </details>
  );
}

function ActivityPanel(props) {
  const { activity } = props;
  return (
    <div>
      <h3>Activity</h3>
      <ul>
        {activity?.map((a) => (
          <li key={uuidv4()}>{`${a.created_by} on ${formatTimestamp(
            a.created_at,
          )} [${a.activity_type}]: ${a.activity_text}`}</li>
        ))}
      </ul>
    </div>
  );
}

export default function Issue(props) {
  return (
    <React.Fragment>
      <SummaryPanel {...props} />
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
