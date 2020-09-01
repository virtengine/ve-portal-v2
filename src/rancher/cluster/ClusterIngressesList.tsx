import * as React from 'react';

import { formatDate } from '@waldur/core/dateUtils';
import { Table, connectTable, createFetcher } from '@waldur/table';
import { TableOptionsType } from '@waldur/table/types';

import { ViewYAMLButton } from './ViewYAMLButton';

const TableComponent = (props) => {
  const { translate } = props;
  return (
    <Table
      {...props}
      columns={[
        {
          title: translate('Name'),
          render: ({ row }) => <>{row.name}</>,
        },
        {
          title: translate('Project'),
          render: ({ row }) => <>{row.rancher_project_name}</>,
        },
        {
          title: translate('Namespace'),
          render: ({ row }) => <>{row.namespace_name}</>,
        },
        {
          title: translate('Targets'),
          render: ({ row }) => (
            <>{row.rules.map((rule) => rule.host).join(', ')}</>
          ),
        },
        {
          title: translate('Created'),
          render: ({ row }) => <>{formatDate(row.created)}</>,
        },
        {
          title: translate('State'),
          render: ({ row }) => <>{row.runtime_state}</>,
        },
        {
          title: translate('Actions'),
          render: ({ row }) => <ViewYAMLButton resource={row} />,
        },
      ]}
      verboseName={translate('ingresses')}
    />
  );
};

const TableOptions: TableOptionsType = {
  table: 'rancher-ingresses',
  fetchData: createFetcher('rancher-ingresses'),
  mapPropsToFilter: (props) => ({
    cluster_uuid: props.resource.uuid,
  }),
};

export const ClusterIngressesList = connectTable(TableOptions)(TableComponent);