import React, { useState, useEffect } from 'react';

import { request } from '../../Requests';
import Issue from '../molecules/Issue';

export default function IssueDetail(props) {
  const { issue_name } = props;
  const [issue, setIssue] = useState({});

  useEffect(() => {
    let mounted = true;
    request({ route: `/issues/${issue_name}`, method: 'GET' }).then((issue) => {
      if (mounted) {
        setIssue(issue);
      }
    });
    return () => (mounted = false);
  }, [issue_name]);

  return <Issue {...issue.data} />;
}
