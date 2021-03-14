import React, { useState } from 'react';
import MaterialTable from 'material-table';

import IssuePriorityBadge from '../atoms/IssuePriorityBadge';
import IssueTypeBadge from '../atoms/IssueTypeBadge';
import IssueNameLink from '../atoms/IssueNameLink';
import { IssueTypeEnum } from '../../Enums';
import { formatTimestamp } from '../../Utils';

const options = {
  grouping: true,
  pageSize: 10, // initial rows per page
  pageSizeOptions: [10, 25, 50, 100],
  actionsColumnIndex: -1,
  toolbarButtonAlignment: 'left', // relocate the freeAction icon
};

const columns = [
  {
    title: 'Type',
    field: 'issue_type',
    render: (rowData) => <IssueTypeBadge {...rowData} />,
    lookup: { ...IssueTypeEnum },
    width: 75,
  },
  {
    title: 'Priority',
    field: 'issue_priority',
    type: 'numeric',
    render: (rowData) => <IssuePriorityBadge {...rowData} />,
    width: 75,
  },
  {
    title: 'Name',
    field: 'issue_name',
    render: (rowData) => <IssueNameLink {...rowData} />,
    width: 150,
    grouping: false,
  },
  {
    title: 'Summary',
    field: 'issue_summary',
    grouping: false,
  },
  {
    title: 'Assignee',
    field: 'issue_assigned_to',
  },
  {
    title: 'Created',
    field: 'created_at',
    render: (rowData) => formatTimestamp(rowData.created_at),
    customSort: (a, b) => a.created_at - b.created_at,
  },
  {
    title: 'Story Points',
    field: 'issue_story_points',
  },
  {
    title: 'Status',
    field: 'issue_status',
  },
];

export default function IssueTable(props) {
  const [onlyOpenIssues, setOnlyOpenIssues] = useState(true);

  const { data } = props;

  return (
    <div>
      <MaterialTable
        title={onlyOpenIssues ? `Open Issues` : `Closed Issues`}
        columns={columns}
        data={data?.filter(function (row) {
          return onlyOpenIssues
            ? row.issue_resolution === `unresolved`
            : row.issue_resolution !== `unresolved`;
        })}
        options={options}
        actions={[
          {
            icon: onlyOpenIssues ? 'history' : 'history_toggle_off',
            tooltip: onlyOpenIssues
              ? 'Show Closed Issues Only'
              : 'Show Open Issues Only',
            isFreeAction: true,
            onClick: (event) => setOnlyOpenIssues(!onlyOpenIssues),
          },
        ]}
      />
    </div>
  );
}
