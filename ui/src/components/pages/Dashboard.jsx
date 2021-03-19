import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { v4 as uuidv4 } from 'uuid';

import IssueItem from '../molecules/IssueItem';
import { IssueStatusEnum } from '../../Enums';
import { formatSnakeCase } from '../../Utils';

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

function filterDataByUser(data, user) {
  /*
   * If no user is provided, no filtering occurs.
   * Otherwise, filtering occurs using the prop
   * `issue_assigned_to` from the DB schema.
   */
  if (!user) {
    return data;
  }
  return data?.filter((d) => d.issue_assigned_to === user);
}

export default function Dashboard(props) {
  const { data, user } = props;
  const groups = groupIssuesByStatus(
    filterDataByUser(data, user),
    'issue_status',
  );
  // TODO: make default props
  delete groups.DONE;
  delete groups.RELEASED;
  delete groups.OPEN;
  return (
    <Container fluid>
      <Row>
        {Object.entries(groups).map(([key, array]) => (
          <Col style={{ padding: '0 5 0 5' }} key={uuidv4()}>
            <h4>{`${formatSnakeCase(key)} (${array.length})`}</h4>
            <hr />
            <div key={uuidv4()}>
              {array.map((issue) => (
                <IssueItem
                  key={uuidv4()}
                  href={`/issues/${issue.issue_name}`}
                  {...issue}
                />
              ))}
            </div>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
