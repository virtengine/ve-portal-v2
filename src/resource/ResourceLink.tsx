import React, { FunctionComponent } from 'react';

import { Link } from '@waldur/core/Link';

interface ResourceLinkProps {
  type: string;
  uuid: string;
  label: React.ReactNode;
}

export const ResourceLink: FunctionComponent<ResourceLinkProps> = (props) => (
  <Link
    state="resource-details"
    params={{
      resource_type: props.type,
      uuid: props.uuid,
    }}
    label={props.label}
  />
);
