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

import { APP_NAME, ENV, ROUTES } from './Constants';
import { request } from './Requests';
import Page from './components/pages/Page';
import IssueDetail from './components/pages/IssueDetail';
import IssueTable from './components/pages/IssueTable';
import Dashboard from './components/pages/Dashboard';
import Metrics from './components/pages/Metrics';
import IssueForm from './components/pages/IssueForm';

console.log(`ENV: ${ENV}`);

export default function App() {
  // auth
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  // data
  const [issues, setIssues] = useState([]);
  // view
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    request({ route: '/issues', method: 'GET' }).then((issues) => {
      if (mounted) {
        setIssues(issues);
      }
    });
    return () => (mounted = false);
  }, []);

  const HomeRoute = () => {
    return (
      <Page fluid={false} className="full-height" loading={loading}>
        <h4>Home Page</h4>
        <pre>{JSON.stringify({ user, token }, null, 2)}</pre>
        {user ? (
          <fieldset>
            <legend>LOGOUT</legend>
            <input
              type="button"
              value="Logout"
              onClick={() => {
                setLoading(true);
                setUser(null);
                setToken(null);
                setLoading(false);
              }}
            />
          </fieldset>
        ) : (
          <fieldset>
            <legend>LOGIN</legend>
            <form
              onSubmit={(event) => {
                // page actions
                setLoading(true);
                event.preventDefault();
                // extract the fields
                const username = event.target.username.value;
                const password = event.target.password.value;
                const aotb = btoa(username + ':' + password);
                console.log(
                  `username=${username} password=${password} btoa=${aotb}`,
                );
                // fire the request
                request({
                  route: '/auth/token',
                  method: 'GET',
                  headers: { Authorization: `Basic ${aotb}` },
                }).then((json) => {
                  setUser(json.data.username);
                  setToken(json.data.token);
                  setLoading(false);
                });
              }}
            >
              <label htmlFor="username" className="mr-2">
                Username
              </label>
              <input
                name="username"
                id="username"
                defaultValue="michael"
                placeholder="Enter username..."
                type="text"
                required
              />
              <br />
              <label htmlFor="password" className="mr-2">
                Password
              </label>
              <input
                name="password"
                id="password"
                defaultValue="hello"
                placeholder="Enter password..."
                type="password"
                required
              />
              <br />
              <input type="submit" value="Submit" />
            </form>
          </fieldset>
        )}
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
        <Navbar.Brand as={Link} to={ROUTES.HOME}>
          {APP_NAME}
        </Navbar.Brand>
        <Navbar.Collapse>
          <Nav className="mr-auto">
            <NavItem href={ROUTES.HOME}>
              <Nav.Link as={Link} to={ROUTES.HOME}>
                Home
              </Nav.Link>
            </NavItem>
            <NavItem href={ROUTES.ISSUES}>
              <Nav.Link as={Link} to={ROUTES.ISSUES}>
                Issues
              </Nav.Link>
            </NavItem>
            <NavItem href={ROUTES.DASHBOARD}>
              <Nav.Link as={Link} to={ROUTES.DASHBOARD}>
                Dashboard
              </Nav.Link>
            </NavItem>
            <NavItem href={ROUTES.METRICS}>
              <Nav.Link as={Link} to={ROUTES.METRICS}>
                Metrics
              </Nav.Link>
            </NavItem>
          </Nav>
          <NavItem style={{ color: 'var(--light)' }} className="mr-3">
            {user ? user : 'Not logged in'}
          </NavItem>
          <NavItem href={ROUTES.CREATE}>
            <Nav.Link as={Link} to={ROUTES.CREATE}>
              <Button size="sm">+ New Issue</Button>
            </Nav.Link>
          </NavItem>
        </Navbar.Collapse>
      </Navbar>
      {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
      <Switch>
        <Route path={ROUTES.ISSUES} component={IssuesRoute} />
        <Route path={ROUTES.DASHBOARD} component={DashboardRoute} />
        <Route path={ROUTES.METRICS} component={MetricsRoute} />
        <Route path={ROUTES.CREATE} component={CreationRoute} />
        <Route exact path={ROUTES.HOME} component={HomeRoute} />
        <Route component={NotFoundRoute} />
      </Switch>
    </Router>
  );
}
