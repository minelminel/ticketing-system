import React from 'react';
import styled from 'styled-components';

const StyledName = styled.span`
  text-decoration: ${(props) => (props.resolved ? 'line-through' : 'none')};
  padding: 0;
  margin: 0;
`;

export default function IssueNameLink(props) {
  const { issue_name, issue_resolution } = props;
  const resolved = issue_resolution !== 'unresolved';
  return (
    <a href={`/issues/${issue_name}`}>
      <StyledName resolved={resolved}>{issue_name}</StyledName>
    </a>
  );
}
