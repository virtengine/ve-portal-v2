import { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';

import { getTitle } from '../title';

import { Breadcrumbs } from './Breadcrumbs';
import { getBreadcrumbs } from './store';

export const BreadcrumbsContainer: FunctionComponent = () => {
  const items = useSelector(getBreadcrumbs);
  const activeItem = useSelector(getTitle);
  if (!items) {
    return null;
  }
  return <Breadcrumbs items={items} activeItem={activeItem} />;
};
