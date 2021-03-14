import React from 'react';
import Badge from 'react-bootstrap/Badge';
import Icon from '@material-ui/core/Icon';

const defaultProps = {
  style: {},
};

function icons(issue_type) {
  const colors = {
    bug: {
      variant: 'danger',
      icon: 'bug_report',
    },
    task: {
      variant: 'success',
      icon: 'check',
    },
    feature: {
      variant: 'primary',
      icon: 'add',
    },
    requirement: {
      variant: 'info',
      icon: 'star',
    },
    support: {
      variant: 'secondary',
      icon: 'accessibility',
    },
    epic: {
      variant: 'royal',
      icon: 'flash_on',
    },
  };
  return colors[issue_type];
}

export default function IssueTypeBadge(props) {
  const { issue_type } = props;
  return (
    <Badge
      title={`Issue Type: ${issue_type}`}
      style={props.style}
      variant={icons(issue_type).variant}
    >
      {/* {issue_type?.toUpperCase()} */}
      <Icon fontSize={`inherit`}>{icons(issue_type).icon}</Icon>
    </Badge>
  );
}

IssueTypeBadge.defaultProps = defaultProps;
