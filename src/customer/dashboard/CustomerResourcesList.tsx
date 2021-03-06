import { FunctionComponent } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { formatDateTime } from '@waldur/core/dateUtils';
import { translate } from '@waldur/i18n';
import { ResourceNameField } from '@waldur/marketplace/resources/list/ResourceNameField';
import { ResourceOpenDetail } from '@waldur/marketplace/resources/list/ResourceOpenDetail';
import { ResourceStateField } from '@waldur/marketplace/resources/list/ResourceStateField';
import { Resource } from '@waldur/marketplace/resources/types';
import { RootState } from '@waldur/store/reducers';
import { Table, connectTable, createFetcher } from '@waldur/table';
import { getCustomer } from '@waldur/workspace/selectors';
import { Customer } from '@waldur/workspace/types';

interface FieldProps {
  row: Resource;
}

export const TableComponent: FunctionComponent<any> = (props) => {
  const columns = [
    {
      title: translate('Name'),
      render: ({ row }) => (
        <ResourceNameField row={row} customer={props.customer} />
      ),
      orderField: 'name',
    },
    {
      title: translate('Project'),
      render: ({ row }: FieldProps) => row.project_name,
    },
    {
      title: translate('Category'),
      render: ({ row }: FieldProps) => row.category_title,
    },
    {
      title: translate('Offering'),
      render: ({ row }: FieldProps) => row.offering_name,
    },
    {
      title: translate('Created at'),
      render: ({ row }: FieldProps) => formatDateTime(row.created),
      orderField: 'created',
    },
    {
      title: translate('State'),
      render: ResourceStateField,
    },
  ];

  return (
    <Table
      {...props}
      columns={columns}
      verboseName={translate('Resources')}
      initialSorting={{ field: 'created', mode: 'desc' }}
      expandableRow={ResourceOpenDetail}
    />
  );
};

const TableOptions = {
  table: 'CustomerResourcesList',
  fetchData: createFetcher('marketplace-resources'),
  mapPropsToFilter: (props) =>
    props.customer
      ? {
          customer_uuid: props.customer.uuid,
          state: ['Creating', 'OK', 'Erred', 'Updating', 'Terminating'],
        }
      : {},
};

const mapStateToProps = (state: RootState) => ({
  customer: getCustomer(state),
});

interface StateProps {
  customer: Customer;
}

const enhance = compose(
  connect<StateProps>(mapStateToProps),
  connectTable(TableOptions),
);

export const CustomerResourcesList = enhance(TableComponent);
