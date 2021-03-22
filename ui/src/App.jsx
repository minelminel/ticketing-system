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
import { v4 as uuidv4 } from 'uuid';

import { APP_NAME, ENV, ROUTES } from './Constants';
import { getLocalStorage, setLocalStorage, removeLocalStorage } from './Utils';
import { request } from './Requests';
import Page from './components/pages/Page';
import IssueDetail from './components/pages/IssueDetail';
import IssueTable from './components/pages/IssueTable';
import Dashboard from './components/pages/Dashboard';
import Metrics from './components/pages/Metrics';
import IssueForm from './components/pages/IssueForm';
import UserLoginForm from './components/molecules/UserLoginForm';
import ActivityItem from './components/atoms/ActivityItem';
// import BreadcrumbBar from './components/atoms/BreadcrumbBar';

// jQuery must be handled separately for certain Bootstrap functionality
import $ from 'jquery';
window.jQuery = window.$ = $;

console.log(`ENV: ${ENV}`);

export default function App() {
  // auth
  const [user, setUser] = useState(getLocalStorage('user.username'));
  const [token, setToken] = useState(getLocalStorage('user.token'));
  // data
  const [issues, setIssues] = useState({});
  const [activity, setActivity] = useState({});

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

  useEffect(() => {
    let mounted = true;
    request({ route: '/activity', method: 'GET' }).then((activity) => {
      if (mounted) {
        setActivity(activity);
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
    setLocalStorage(`user.username`, response.data.username);
    setLocalStorage(`user.token`, response.data.token);
    setUser(response.data.username);
    setToken(response.data.token);
  };

  const handleUserLogout = () => {
    // prompt for confirmation
    const confirmed = window.confirm(`Are you sure you want to log out?`);
    if (confirmed) {
      removeLocalStorage(`user.username`);
      removeLocalStorage(`user.token`);
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
      <Page fluid={false} className="mt-2">
        {!token || !user ? (
          <UserLoginForm
            style={{
              position: 'relative',
              width: '50%',
              marginTop: '20%',
              marginLeft: '25%',
              padding: '2rem',
              boxShadow: '0 0 10px var(--gray)',
              borderRadius: '10px',
            }}
            onSuccess={(data) => handleUserLogin(data)}
          />
        ) : (
          <React.Fragment>
            <h4>Activity Stream</h4>
            {activity.data?.map((a) => (
              <ActivityItem key={uuidv4()} {...a} />
            ))}
          </React.Fragment>
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

  const IssuesRoute = () => {
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
      <Navbar
        collapseOnSelect={true}
        // className="bs-navbar-collapse"
        bg="dark"
        expand="lg"
        variant="dark"
        className="mb-0"
      >
        <Navbar.Brand as={Link} to={ROUTES.HOME}>
          {APP_NAME}
        </Navbar.Brand>
        <Navbar.Toggle />
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
          <NavItem
            style={{
              color: 'var(--light)',
              marginRight: '2rem',
            }}
          >
            <span>{user ? `${user}` : 'Not logged in'}</span>
            {/* <span className="mr-3" title={token}>
              {token ? `${token.substring(0, 10)}...` : '(no token)'}
            </span> */}
          </NavItem>
          {/* End janky horribleness */}
          <NavItem className="pl-0" href={ROUTES.HOME}>
            <Nav.Link className="pl-0" as={Link} to={ROUTES.HOME}>
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
      {/* <BreadcrumbBar /> */}
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
