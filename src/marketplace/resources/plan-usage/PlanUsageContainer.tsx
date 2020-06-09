import * as React from 'react';

import { Panel } from '@waldur/core/Panel';
import { translate } from '@waldur/i18n';
import { useTitle } from '@waldur/navigation/title';

import { PlanUsageFilter } from './PlanUsageFilter';
import { PlanUsageList } from './PlanUsageList';

export const PlanUsageContainer = () => {
  useTitle(translate('Plan capacity'));
  return (
    <Panel>
      <PlanUsageFilter />
      <PlanUsageList />
    </Panel>
  );
};
