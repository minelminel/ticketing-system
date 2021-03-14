import React from 'react';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import styled from 'styled-components';

import IssueTypeBadge from '../atoms/IssueTypeBadge';
import IssuePriorityBadge from '../atoms/IssuePriorityBadge';
import IssueStoryPointBadge from '../atoms/IssueStoryPointBadge';

const Clickable = styled.a`
  color: inherit;
  font-size: small;
  .card-body {
    padding: 0.5rem;
  }
  &:hover {
    text-decoration: none;
    color: inherit;
    background-color: #f4f4f4;
  }
`;

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
    <Card>
      <Clickable href={href}>
        <Card.Body>
          <Row className="mb-3">
            <Col>{issue_summary}</Col>
          </Row>
          <Row className="mt-3">
            <Col>
              <IssueTypeBadge
                style={{ marginRight: '0.25rem' }}
                issue_type={issue_type}
              />
              <IssuePriorityBadge
                style={{ marginRight: '0.25rem' }}
                issue_priority={issue_priority}
              />
              <IssueStoryPointBadge
                style={{ marginRight: '0.25rem' }}
                issue_story_points={issue_story_points}
              />
            </Col>
            <Col className="text-muted" style={{ textAlign: 'right' }}>
              {issue_name}
            </Col>
          </Row>
        </Card.Body>
      </Clickable>
    </Card>
  );
}
