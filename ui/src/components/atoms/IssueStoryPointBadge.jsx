import React from 'react';
import Badge from 'react-bootstrap/Badge';

const defaultProps = {
  style: {},
};

export default function IssueStoryPointBadge(props) {
  const { issue_story_points } = props;
  return (
    <Badge
      title={`Story Points: ${issue_story_points}`}
      style={props.style}
      variant={`secondary`}
    >
      {`${issue_story_points} pts`}
    </Badge>
  );
}

IssueStoryPointBadge.defaultProps = defaultProps;
