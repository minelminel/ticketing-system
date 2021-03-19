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
import Metrics from './components/pages/Metrics';
import IssueForm from './components/pages/IssueForm';

function getIssues() {
  return fetch(`${API_ROOT}/issues`).then((response) => response.json());
}

export default function App() {
  const [user, setUser] = useState(``);
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
      <Page className="full-height">
        <h4>Home Page</h4>
      </Page>
    );
  };

  const MetricsRoute = () => {
    return (
      <Page className="p-0 full-height">
        <Metrics />
      </Page>
    );
  };

  const CreationRoute = () => {
    return (
      <Page fluid={null} className="mt-2">
        <IssueForm user={user} />
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
      <Page className="mt-2">
        <Dashboard user={user} data={issues.data} />
      </Page>
    );
  };

  const IssuesRoute = (props) => {
    const match = useRouteMatch();
    return (
      <Switch>
        <Route path={`${match.path}/:issue_name`}>
          {/* single issue detail, does its own fetch */}
          <Page fluid={false}>
            <IssuePage />
          </Page>
        </Route>
        <Route path={match.path}>
          {/* all issues */}
          <Page>
            <IssueTable {...issues} />
          </Page>
        </Route>
      </Switch>
    );
  };

  const IssuePage = () => {
    return (
      <Page>
        <IssueDetail {...{ fluid: false, ...useParams() }} />
      </Page>
    );
  };

  return (
    <Router>
      <Navbar bg="dark" variant="dark" className="mb-0">
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
          <NavItem style={{ color: 'var(--light)' }} className="mr-3">
            {user ? user : 'Not logged in'}
          </NavItem>
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
