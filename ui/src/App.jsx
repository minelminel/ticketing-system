import React, { useState, useEffect } from "react";

import { API_ROOT } from "./Constants";
import Issue from "./components/molecules/Issue";

function getIssues() {
  return fetch(`${API_ROOT}/issues`).then((response) => response.json());
}

export default function App() {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    let mounted = true;
    getIssues().then((issues) => {
      if (mounted) {
        setIssues(issues);
      }
    });
    return () => (mounted = false);
  }, []);

  return (
    <React.Fragment>
      {issues.map((issue) => (
        <Issue {...issue} />
      ))}
    </React.Fragment>
  );
}
