import React from 'react';
import Badge from 'react-bootstrap/Badge';

const defaultProps = {
  style: {},
};

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
    <Badge
      title={`Issue Type`}
      style={props.style}
      variant={getVariant(issue_type)}
    >
      {issue_type?.toUpperCase()}
    </Badge>
  );
}

IssueTypeBadge.defaultProps = defaultProps;
