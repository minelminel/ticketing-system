import React from 'react';
import Card from 'react-bootstrap/Card';

import IssueTypeBadge from '../atoms/IssueTypeBadge';

export default function IssueItem(props) {
  const {
    href,
    issue_name,
    issue_type,
    issue_priority,
    issue_story_points,
    issue_summary,
  } = props;
  return (
    <Card href={href}>
      <Card.Body>
        <Card.Subtitle>
          <IssueTypeBadge issue_type={issue_type} />
          &nbsp;{issue_name}
        </Card.Subtitle>
        <Card.Text>{issue_summary}</Card.Text>
      </Card.Body>
    </Card>
  );
}
