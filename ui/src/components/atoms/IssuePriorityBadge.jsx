import React from 'react';
import Badge from 'react-bootstrap/Badge';

const defaultProps = {
  style: {},
};

function getVariant(issue_priority) {
  const colors = {
    1: 'var(--red)',
    2: 'var(--yellow)',
    3: 'var(--green)',
    4: 'var(--cyan)',
    5: 'var(--purple)',
  };
  return colors[issue_priority];
}

export default function IssuePriorityBadge(props) {
  const { issue_priority } = props;
  return (
    <Badge
      title={`Issue Priority: ${issue_priority}`}
      style={{
        ...props.style,
        ...{
          backgroundColor: getVariant(issue_priority),
          color: 'var(--light)',
        },
      }}
      variant={getVariant(issue_priority)}
    >
      {issue_priority}
    </Badge>
  );
}

IssuePriorityBadge.defaultProps = defaultProps;
