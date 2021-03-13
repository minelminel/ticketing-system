import React from 'react';
import MaterialTable from 'material-table';
import IssueTypeBadge from '../atoms/IssueTypeBadge';
import { IssueTypeEnum } from '../../Enums';

const columns = [
  {
    title: 'Type',
    field: 'issue_type',
    render: (rowData) => <IssueTypeBadge {...rowData} />,
    lookup: { ...IssueTypeEnum },
  },
  {
    title: 'Priority',
    field: 'issue_priority',
    type: 'numeric',
  },
  {
    title: 'Name',
    field: 'issue_name',
    render: (rowData) => (
      <a href={`/issues/${rowData.issue_name}`}>{rowData.issue_name}</a>
    ),
  },
  {
    title: 'Summary',
    field: 'issue_summary',
  },
  {
    title: 'Assignee',
    field: 'issue_assigned_to',
  },
  {
    title: 'Story Points',
    field: 'issue_story_points',
  },
];

const options = {
  grouping: true,
};

export default function IssueTable(props) {
  const { data } = props;
  return (
    <div>
      <MaterialTable
        columns={columns}
        data={data}
        options={options}
        title="All Issues"
      />
    </div>
  );
}
