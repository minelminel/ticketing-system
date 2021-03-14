import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useParams,
  useRouteMatch,
} from 'react-router-dom';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavItem from 'react-bootstrap/NavItem';
import Button from 'react-bootstrap/Button';
import 'bootstrap/dist/css/bootstrap.min.css';
import './static/css/style.css';

import { API_ROOT } from './Constants';
import Page from './components/pages/Page';
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

  const HomeRoute = () => {
    return (
      <Page>
        <h1>Home Page</h1>
      </Page>
    );
  };

  const MetricsRoute = () => {
    return (
      <Page>
        <h1>Metrics Page</h1>
      </Page>
    );
  };

  const CreationRoute = () => {
    return (
      <Page>
        <h1>Create Issue</h1>
      </Page>
    );
  };

  const NotFoundRoute = () => {
    return (
      <Page>
        <h1>404: Not Found</h1>
      </Page>
    );
  };

  const DashboardRoute = () => {
    // TODO: filter by assignment
    return (
      <Page>
        <Dashboard data={issues.data} />
      </Page>
    );
  };

  const IssuesRoute = (props) => {
    const match = useRouteMatch();
    return (
      <Page>
        <Switch>
          <Route path={`${match.path}/:issue_name`}>
            {/* single issue detail, does its own fetch */}
            <IssuePage />
          </Route>
          <Route path={match.path}>
            {/* all issues */}
            <IssueTable {...issues} />
          </Route>
        </Switch>
      </Page>
    );
  };

  const IssuePage = () => {
    return (
      <Page>
        <IssueDetail {...useParams()} />
      </Page>
    );
  };

  return (
    <Router>
      <Navbar bg="dark" variant="dark">
        <Navbar.Brand as={Link} to="/">
          Ticketing System
        </Navbar.Brand>
        <Navbar.Collapse>
          <Nav className="mr-auto">
            <NavItem href="/">
              <Nav.Link as={Link} to="/">
                Home
              </Nav.Link>
            </NavItem>
            <NavItem href="/issues">
              <Nav.Link as={Link} to="/issues">
                Issues
              </Nav.Link>
            </NavItem>
            <NavItem href="/dashboard">
              <Nav.Link as={Link} to="/dashboard">
                Dashboard
              </Nav.Link>
            </NavItem>
            <NavItem href="/metrics">
              <Nav.Link as={Link} to="/metrics">
                Metrics
              </Nav.Link>
            </NavItem>
          </Nav>
          <NavItem href="/create">
            <Nav.Link as={Link} to="/create">
              <Button size="sm">+ New Issue</Button>
            </Nav.Link>
          </NavItem>
        </Navbar.Collapse>
      </Navbar>
      {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
      <Switch>
        <Route path="/issues" component={IssuesRoute} />
        <Route path="/dashboard" component={DashboardRoute} />
        <Route path="/metrics" component={MetricsRoute} />
        <Route path="/create" component={CreationRoute} />
        <Route exact path="/" component={HomeRoute} />
        <Route component={NotFoundRoute} />
      </Switch>
    </Router>
  );
}
