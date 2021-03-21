/* Constants.jsx */

/**
 * This is the name of the app as it will appear in the Navbar,
 * popup messages, etc..
 */
export const APP_NAME = `🗳 TIX`;

/**
 * Main flag for configuration of environment-conditional settings.
 */
export const ENV = process.env.REACT_APP_ENV || `development`;

/**
 * When we develop locally, we are fine to point requests directly
 * at the Flask dev server, but in docker/prod we use the proxy.
 */
export const API_ROOT =
  ENV === `development`
    ? `http://localhost:5000/api`
    : `http://localhost:8080/api`;

/**
 * Similar to the API_ROOT, we either point directly at the service
 * when running locally, or use the proxy in docker/prod.
 */
export const GRAFANA_ROOT =
  ENV === `development`
    ? `http://localhost:3001/?orgId=1`
    : `http://localhost:8080/grafana/?orgId=1`;

/**
 * Single source of truth for ReactRouter page routes
 */
export const ROUTES = {
  HOME: `/`,
  ISSUES: `/issues`,
  DASHBOARD: `/dashboard`,
  METRICS: `/metrics`,
  CREATE: `/create`,
  LOGIN: `/login`,
  REGISTER: `/register`,
};
