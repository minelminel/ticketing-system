import React from 'react';
import styled from 'styled-components';
import MDEditor from '@uiw/react-md-editor';

import { formatTimestamp } from '../../Utils';

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

export default function ActivityItem(props) {
  const { created_by, activity_type, created_at, activity_text } = props;
  const vowel =
    ['A', 'E', 'I', 'O', 'U'].indexOf(activity_type.substring(0, 1)) > -1;
  return (
    <Decorated>
      <span
        style={{ fontWeight: 300, fontSize: '1.05rem' }}
      >{`${created_by} added a${
        vowel ? 'n' : ''
      } ${activity_type} - ${formatTimestamp(created_at)}`}</span>
      <MDEditor.Markdown source={activity_text} />
    </Decorated>
  );
}

ActivityItem.defaultProps = defaultProps;
