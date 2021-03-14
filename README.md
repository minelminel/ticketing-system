# Ticketing System

### Table Schemas

`CREATE TABLE issues`

| column | type | possible values |
|:---|:---|:---|
| id | `int` |  |
| created_on | `int` |  |
| updated_on | `int` |  |
| created_by | `string` |  |
| issue_name | `string` |  |
| issue_project | `string` |  |
| issue_type | `enum` | bug, feature, requirement, support, epic |
| issue_priority | `enum` | 1, 2, 3, 4, 5 |
| issue_story_points | `int` |  |
| issue_summary | `string` |  |
| issue_description | `string` |  |
| issue_status | `enum` | open, assigned, in_progress, on_hold, under_review, done, released |
| issue_resolution | `enum` | invalid, wont_fix, overcome_by_events, unable_to_replicate, duplicate, complete |
| issue_affected_version | `string` |  |
| issue_fixed_version | `string` |  |
| issue_assignee | `string` |  |

---

`CREATE TABLE activity` *many-to-one with `issues`*

| column | type | possible values |
|:---|:---|:---|
| id | `int` |  |
| created_on | `int` |  |
| updated_on | `int` |  |
| created_by | `string` |  |
| issue_id | `int` |  |
| issue_name | `string` |  |
| activity_type | `enum` | comment, assignment, status, resolution |
| activity_text | `string` |  |

---

`CREATE TABLE users`

**TODO**

---

### Endpoints

- `/`: homepage
- `/issues`: browse all tickets
- `/issues/{ticket}`: view details of a specific ticket
- `/dashboard`: Kanban board
- `/metrics`: statistics on outstanding issues, resolution times, etc..

---

### UI Components
- ~~Icons for indicating issue_type & issue_priority~~
- ~~strikethrough issue link~~
- ~~Issue list item for use with dashboard with href action~~
- ~~navbar~~
- Dashboard grid layout
- Single issue full-page detail view
- auth provider/login page
- admin panel with separate data tables for each SQL table & editing capability
- new issue page component for creation
- comment creation component with markdown support
- loading spinner on all page components
- activity children components for each activity_type

---

### TODO
- use url params in /issues table to set view (closed/open issues, pageNo, rowsPerPage)
- generic activity component which handles all activity types
