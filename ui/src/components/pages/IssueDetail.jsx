import React, { useState, useEffect } from 'react';
import Issue from '../molecules/Issue';
import { API_ROOT } from '../../Constants';

function getIssue(issue_name) {
  return fetch(`${API_ROOT}/issues/${issue_name}`).then((response) =>
    response.json(),
  );
}

export default function IssueDetail(props) {
  const { issue_name } = props;
  const [issue, setIssue] = useState({});

  useEffect(() => {
    let mounted = true;
    getIssue(issue_name).then((issue) => {
      if (mounted) {
        setIssue(issue);
      }
    });
    return () => (mounted = false);
  }, [issue_name]);

  return <Issue {...issue.data} />;
}
