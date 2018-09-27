import * as React from 'react';

import { OfferingLink } from '@waldur/marketplace/links/OfferingLink';

import { Offering } from '../types';

interface MobileOfferingCardProps {
  offering: Offering;
}

export const MobileOfferingCard = (props: MobileOfferingCardProps) => (
  <tr>
    <td className="img-md">
      <OfferingLink offering_uuid={props.offering.uuid}>
        <img src={props.offering.thumbnail}/>
      </OfferingLink>
    </td>
    <td>
      <h3>
        <OfferingLink offering_uuid={props.offering.uuid}>
          {props.offering.name}
        </OfferingLink>
      </h3>
      {props.offering.description}
    </td>
  </tr>
);
