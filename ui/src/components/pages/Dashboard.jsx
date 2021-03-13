import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { v4 as uuidv4 } from 'uuid';

import IssueItem from '../molecules/IssueItem';
import { IssueStatusEnum } from '../../Enums';

function groupIssuesByStatus(list, key = 'issue_status') {
  const defaults = Object.fromEntries(
    Object.keys(IssueStatusEnum).map((key) => [key, []]),
  );
  if (!list) {
    return defaults;
  }
  const groups = list.reduce((groups, item) => {
    // TODO: use enum values for return order
    const group = groups[item[key]] || [];
    group.push(item);
    groups[item[key]] = group;
    return groups;
  }, {});

  return { ...defaults, ...groups };
}

export default function Dashboard(props) {
  const { data } = props;
  const groups = groupIssuesByStatus(data, 'issue_status');

  return (
    <Container fluid>
      <Row>
        {Object.entries(groups).map(([key, array]) => (
          <Col key={uuidv4()}>
            <h3>{`${key} (${array.length})`}</h3>
            <hr />
            <div key={uuidv4()}>
              {array.map((issue) => (
                <IssueItem href={`/issues/${issue.issue_name}`} {...issue} />
              ))}
            </div>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
