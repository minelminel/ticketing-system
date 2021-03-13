import React from 'react';
import Badge from 'react-bootstrap/Badge';

function getVariant(issue_type) {
  const colors = {
    bug: 'danger',
    task: 'success',
    feature: 'primary',
    requirement: 'info',
    support: 'secondary',
    epic: 'royal',
  };
  return colors[issue_type];
}

export default function IssueTypeBadge(props) {
  const { issue_type } = props;
  return (
    <Badge variant={getVariant(issue_type)}>{issue_type?.toUpperCase()}</Badge>
  );
}
