/* Requests.jsx */
import { API_ROOT } from './Constants';

export async function request(options) {
  const route = options.route ? options.route : '';
  const method = options.method ? options.method.toUpperCase() : 'GET';
  const body = options.body ? options.body : null;
  const params = options.params
    ? new URLSearchParams(options.params).toString()
    : '';
  const headers = options.headers
    ? options.headers
    : { 'Content-Type': 'application/json' };
  // Default options are marked with *
  const url = params ? `${API_ROOT}${route}?${params}` : `${API_ROOT}${route}`;
  console.log(`[request:send] url=${url} method=${method}`);
  const response = await fetch(url, {
    // *GET, POST, PUT, DELETE, etc.
    method: method,
    // no-cors, *cors, same-origin
    mode: 'cors',
    // *default, no-cache, reload, force-cache, only-if-cached
    cache: 'no-cache',
    // include, *same-origin, omit
    credentials: 'same-origin',
    headers: headers,
    // manual, *follow, error
    redirect: 'follow',
    // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    referrerPolicy: 'no-referrer',
    // body data type must match "Content-Type" header
    // body: JSON.stringify(body),
    ...(body && { body: JSON.stringify(body) }),
  });
  // parses JSON response into native JavaScript objects
  console.log(
    `[request:recv] url=${url} method=${method} status=${response.status}`,
  );
  return response.json();
}
