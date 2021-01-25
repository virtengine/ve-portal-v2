import { get } from '@waldur/core/api';
import { translate } from '@waldur/i18n';
import { getTabTitle } from '@waldur/invoices/utils';
import { SidebarExtensionService } from '@waldur/navigation/sidebar/SidebarExtensionService';
import { MenuItemType } from '@waldur/navigation/sidebar/types';
import { Customer, ORGANIZATION_WORKSPACE } from '@waldur/workspace/types';

export const getDashboardItem = (customerId: string): MenuItemType => ({
  key: 'dashboard',
  label: translate('Dashboard'),
  icon: 'fa-th-large',
  state: 'organization.dashboard',
  params: {
    uuid: customerId,
  },
  index: 100,
});

export const getSidebarItems = (customer: Customer): MenuItemType[] => [
  getDashboardItem(customer.uuid),
  {
    key: 'projects',
    label: translate('Projects'),
    icon: 'fa-bookmark',
    state: 'organization.projects',
    params: {
      uuid: customer.uuid,
    },
    feature: 'projects',
    countFieldKey: 'projects',
    index: 300,
  },
  {
    key: 'events',
    label: translate('Audit logs'),
    icon: 'fa-bell-o',
    state: 'organization.details',
    params: {
      uuid: customer.uuid,
    },
    feature: 'eventlog',
    index: 600,
  },
  {
    key: 'issues',
    label: translate('Issues'),
    icon: 'fa-question-circle',
    state: 'organization.issues',
    params: {
      uuid: customer.uuid,
    },
    feature: 'support',
    index: 700,
  },
  {
    key: 'team',
    label: translate('Team'),
    icon: 'fa-group',
    state: 'organization.team',
    params: {
      uuid: customer.uuid,
    },
    feature: 'team',
    countFieldKey: 'users',
    index: 900,
  },
  {
    key: 'billing',
    label: getTabTitle(),
    icon: 'fa-file-text-o',
    state: 'organization.billing',
    params: {
      uuid: customer.uuid,
    },
    feature: 'billing',
    index: 1000,
  },
  {
    key: 'manage',
    label: translate('Manage'),
    icon: 'fa-wrench',
    state: 'organization.manage',
    params: {
      uuid: customer.uuid,
    },
    index: 9999,
  },
];

export const getCustomerCounters = (customer: Customer, fields: string[]) =>
  get(`/customers/${customer.uuid}/counters/`, { params: { fields } }).then(
    (response) => response.data,
  );

export const getExtraSidebarItems = (): Promise<MenuItemType[]> => {
  return SidebarExtensionService.getItems(ORGANIZATION_WORKSPACE);
};
