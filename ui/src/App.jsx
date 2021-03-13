import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useParams,
  useRouteMatch,
} from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './static/css/style.css';

import { API_ROOT } from './Constants';
import Issue from './components/molecules/Issue';
import IssueItem from './components/molecules/IssueItem';
import IssueDetail from './components/pages/IssueDetail';
import IssueTable from './components/pages/IssueTable';
import Dashboard from './components/pages/Dashboard';

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

  const HomeRoute = (props) => {
    return <h1>Home Page</h1>;
  };

  const DashboardRoute = (props) => {
    // TODO: filter by assignment
    return <Dashboard data={issues.data} />;
  };

  const IssuesRoute = (props) => {
    const match = useRouteMatch();
    return (
      <React.Fragment>
        <Switch>
          <Route path={`${match.path}/:issue_name`}>
            {/* single issue detail */}
            <IssuePage {...props} />
          </Route>
          <Route path={match.path}>
            {/* table for all issues */}
            <IssueTable {...issues} />
          </Route>
        </Switch>
      </React.Fragment>
    );
  };

  const IssuePage = (props) => {
    return <IssueDetail {...useParams()} />;
  };
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/issues">Issues</Link>
            </li>
            <li>
              <Link to="/dashboard">Dashboard</Link>
            </li>
          </ul>
        </nav>
        {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
        <Switch>
          <Route path="/issues">
            <IssuesRoute />
          </Route>
          <Route path="/dashboard">
            <DashboardRoute />
          </Route>
          <Route path="/">
            <HomeRoute />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}
