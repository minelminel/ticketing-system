import React from 'react';
import Badge from 'react-bootstrap/Badge';

const defaultProps = {
  style: {},
};

function getVariant(issue_priority) {
  const colors = {
    1: 'danger',
    2: 'warning',
    3: 'primary',
    4: 'info',
    5: 'secondary',
  };
  return colors[issue_priority];
}

export default function IssuePriorityBadge(props) {
  const { issue_priority } = props;
  return (
    <Badge
      title={`Issue Priority`}
      style={props.style}
      variant={getVariant(issue_priority)}
    >
      {issue_priority}
    </Badge>
  );
}

IssuePriorityBadge.defaultProps = defaultProps;
