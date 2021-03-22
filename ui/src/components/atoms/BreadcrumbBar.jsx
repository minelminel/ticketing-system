import React from 'react';
import Nav from 'react-bootstrap/Nav';
import { v4 as uuidv4 } from 'uuid';

function capitalize(word) {
  return word.toUpperCase() === word
    ? word
    : word.toLowerCase().substring(0, 1).toUpperCase() +
        word.toLowerCase().substring(1);
}

/**
 * As an example, the path localhost://8080/issues/ABC-0001
 * would return the array ["issues", "ABC-0001"] if the
 * rootSegmentName was ommitted, ["home", "issues", "ABC-0001"]
 * if it were provided as "home"
 */
function getPathnameSegments(rootSegmentName) {
  return [rootSegmentName, ...window.location.pathname.split('/')].filter(
    function (e) {
      return e;
    },
  );
}

/**
 * s = "issues"
 * p = window.location.pathname
 * window.location.href     "http://localhost:8080/issues/ABC-0001"
 * window.location.origin   "http://localhost:8080"
 *
 * arr = ["issues", "ABC-0001"]
 * for (let i=0; i<arr.length; i++) { console.log(  arr.slice(0, i+1).join('/')  ); }
 *
 * issues
 * issues/ABC-0001
 */

/**
 * For each path segment, if segment is not already upper-cased,
 * transform to title-case. While iterating, keep adding to the
 * window.location.pathname to allow incremental navigation.
 */
export default function BreadcrumbBar(props) {
  function scaffoldHref() {
    const arr = getPathnameSegments();
    const segments = [];
    for (let i = 0; i < arr.length; i++) {
      segments.push(['', ...arr.slice(0, i + 1)].join('/'));
    }
    return ['/', ...segments];
  }
  const hrefs = scaffoldHref();

  /**
   * This can surely be optimized in some form. The gist
   * is that each breadcrumb item is parsed from the
   * window location, and the components assembed in
   * such a way that all elements up to the current
   * path are links, with the final element only being
   * a list item (since the user is already on the page)
   */
  return (
    <Nav width="100%" className="nav-breadcrumb">
      <ol className="breadcrumb" style={{ width: '100%' }}>
        {getPathnameSegments('home').map((segment, index) => (
          <li
            key={uuidv4()}
            className={`breadcrumb-item ${
              index === hrefs.length - 1 ? 'active' : ''
            }`}
          >
            {index === hrefs.length - 1 &&
              (segment.toUpperCase() === segment
                ? segment
                : capitalize(segment))}
            {index !== hrefs.length - 1 && (
              <a href={hrefs[index]}>
                {segment.toUpperCase() === segment
                  ? segment
                  : capitalize(segment)}
              </a>
            )}
          </li>
        ))}
      </ol>
    </Nav>
  );
}
