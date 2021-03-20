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
import UserLoginForm from './components/molecules/UserLoginForm';

console.log(`ENV: ${ENV}`);

export default function App() {
  // auth
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  // data
  const [issues, setIssues] = useState([]);

  /**
   * Perform the initial loading of data from the API, using
   * hooks to avoid a loop of fetch/render. Functionally
   * equivalent to using React.Component#constructor
   */
  useEffect(() => {
    let mounted = true;
    request({ route: '/issues', method: 'GET' }).then((issues) => {
      if (mounted) {
        setIssues(issues);
      }
    });
    return () => (mounted = false);
  }, []);

  /**
   * Called when user login succeeds from the UserLoginForm.
   * Failed validation is handled within the component,
   * this method is only called after a successful operation.
   */
  const handleUserLogin = (response) => {
    setUser(response.data.username);
    setToken(response.data.token);
  };

  const handleUserLogout = () => {
    // prompt for confirmation
    const confirmed = window.confirm(`Are you sure you want to log out?`);
    if (confirmed) {
      setUser(null);
      setToken(null);
    }
  };

  /**
   * If the user/token is not set, display a login form.
   * IF the user/token is set, display a logout button.
   */
  const HomeRoute = () => {
    return (
      <Page fluid={false}>
        {!token || !user ? (
          <UserLoginForm
            style={{
              position: 'relative',
              width: '50%',
              marginTop: '20%',
              marginLeft: '25%',
              padding: '2rem',
              boxShadow: '0 0 10px var(--secondary)',
              borderRadius: '10px',
            }}
            onSuccess={(data) => handleUserLogin(data)}
          />
        ) : (
          <div>This is only visible when a user is logged in</div>
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
            <NavItem href={ROUTES.CREATE}>
              <Nav.Link as={Link} to={ROUTES.CREATE}>
                + New Issue
              </Nav.Link>
            </NavItem>
          </Nav>
          {/* This is super janky and just a temporary way to visibly check when credentials are persisted */}
          <NavItem style={{ color: 'var(--light)' }} className="mr-3">
            <span className="mr-3">{user ? `${user}` : '(no user)'}</span>
            <span className="mr-3">
              {token ? `${token.substring(0, 10)}...` : '(no token)'}
            </span>
          </NavItem>
          {/* End janky horribleness */}
          <NavItem href={ROUTES.HOME}>
            <Nav.Link as={Link} to={ROUTES.HOME}>
              {user ? (
                <Button onClick={handleUserLogout} size="sm">
                  Log Out
                </Button>
              ) : (
                <Button size="sm">Log In</Button>
              )}
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
