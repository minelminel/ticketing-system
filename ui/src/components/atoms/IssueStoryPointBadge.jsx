import React from 'react';
import Badge from 'react-bootstrap/Badge';

const defaultProps = {
  style: {},
};

export default function IssueStoryPointBadge(props) {
  const { issue_story_points } = props;
  return (
    <Badge title={`Story Points`} style={props.style} variant={`secondary`}>
      {issue_story_points}
    </Badge>
  );
}

IssueStoryPointBadge.defaultProps = defaultProps;
