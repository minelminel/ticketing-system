import React from 'react';
import styled from 'styled-components';

import { formatTimestamp } from '../../Utils';

/*
 * Typically this component would not be used directly,
 * and instead would be conditionally used by a generic
 * `ActivityComponent` determined by the `activity_type`
 *
 * TODO: ^^
 */

const defaultProps = {};

const Decorated = styled.li`
  list-style: none;
  list-style-type: none;
  list-style-position: inside;
  margin: 0;
  padding: 0.5rem;
  border: 1px solid gray;
  margin-bottom: 1rem;
  border-radius: 5px;
  background-color: #f2f2f2;
`;

export default function ActivityComment(props) {
  const { created_by, activity_type, created_at, activity_text } = props;
  return (
    <Decorated>
      <span
        style={{ fontWeight: 300, fontSize: '1.05rem' }}
      >{`${created_by} added a ${activity_type} - ${formatTimestamp(
        created_at,
      )}`}</span>
      <p className="mt-1">{activity_text}</p>
    </Decorated>
  );
}

ActivityComment.defaultProps = defaultProps;
