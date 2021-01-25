import { FunctionComponent } from 'react';

import { defaultCurrency } from '@waldur/core/formatCurrency';
import { FormattedHtml } from '@waldur/core/FormattedHtml';
import { Link } from '@waldur/core/Link';
import { Tooltip } from '@waldur/core/Tooltip';
import { translate } from '@waldur/i18n';
import { OfferingLogo } from '@waldur/marketplace/common/OfferingLogo';
import { OrderItemResponse } from '@waldur/marketplace/orders/types';
import { ResourceDetailsLink } from '@waldur/marketplace/resources/ResourceDetailsLink';
import { ResourceReference } from '@waldur/marketplace/resources/types';
import { BillingPeriod } from '@waldur/marketplace/types';

import './OrderItem.scss';
import { OrderItemDetailsLink } from './OrderItemDetailsLink';

interface OrderItemProps {
  project_uuid: string;
  customer_uuid: string;
  item: OrderItemResponse;
  editable: boolean;
  onRemove?(): void;
  showPrice: boolean;
  maxUnit: BillingPeriod;
}

export const OrderItem: FunctionComponent<OrderItemProps> = (props) => {
  return (
    <tr>
      <td>
        <div className="offering-item">
          <div className="offering-thumb">
            <Tooltip id="offering-tooltip" label={props.item.offering_name}>
              <OrderItemDetailsLink
                order_item_uuid={props.item.uuid}
                project_uuid={props.project_uuid}
              >
                <OfferingLogo src={props.item.offering_thumbnail} />
              </OrderItemDetailsLink>
            </Tooltip>
          </div>
          <div className="offering-info">
            <h5 className="offering-title">
              <OrderItemDetailsLink
                order_item_uuid={props.item.uuid}
                project_uuid={props.project_uuid}
              >
                {props.item.attributes.name ||
                  props.item.resource_name ||
                  props.item.offering_name}
              </OrderItemDetailsLink>
            </h5>
            <p>
              {props.item.attributes.description || (
                <FormattedHtml html={props.item.offering_description} />
              )}
            </p>
            {props.item.resource_uuid ? (
              <p>
                <ResourceDetailsLink item={props.item as ResourceReference}>
                  {translate('Resource link')}
                </ResourceDetailsLink>
              </p>
            ) : props.item.marketplace_resource_uuid ? (
              <p>
                <Link
                  state="marketplace-public-resource-details"
                  params={{
                    uuid: props.customer_uuid,
                    resource_uuid: props.item.marketplace_resource_uuid,
                  }}
                  label={translate('Resource link')}
                />
              </p>
            ) : null}
          </div>
        </div>
      </td>
      <td>{translate(props.item.type)}</td>
      {props.showPrice && (
        <>
          {props.maxUnit ? (
            <td className="text-center text-lg">
              {defaultCurrency(props.item.fixed_price || 0)}
            </td>
          ) : null}
          <td className="text-center text-lg">
            {defaultCurrency(props.item.activation_price || 0)}
          </td>
        </>
      )}
      <td className="text-center">{props.item.state}</td>
      <td className="text-center">
        <span className="btn-group">
          {props.editable && (
            <a className="btn btn-outline btn-default btn-sm m-r-xs">
              {translate('Edit')}
            </a>
          )}
        </span>
      </td>
    </tr>
  );
};
