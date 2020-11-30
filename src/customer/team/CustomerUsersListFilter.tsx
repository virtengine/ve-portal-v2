import * as React from 'react';
import * as Row from 'react-bootstrap/lib/Row';
import { reduxForm } from 'redux-form';

import { CUSTOMER_USERS_LIST_FILTER_FORM_ID } from '@waldur/customer/team/constants';
import { OrganizationRoleSelectField } from '@waldur/customer/team/OrganizationRoleSelectField';
import { ProjectRoleSelectField } from '@waldur/customer/team/ProjectRoleSelectField';

const PureCustomerUsersListFilter = () => (
  <Row>
    <ProjectRoleSelectField />
    <OrganizationRoleSelectField />
  </Row>
);

const enhance = reduxForm({
  form: CUSTOMER_USERS_LIST_FILTER_FORM_ID,
});

export const CustomerUsersListFilter = enhance(PureCustomerUsersListFilter);