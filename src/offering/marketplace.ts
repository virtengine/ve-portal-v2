import { translate } from '@waldur/i18n';
import { registerOfferingType } from '@waldur/marketplace/common/registry';
import { OfferingConfigurationDetails } from '@waldur/offering/OfferingConfigurationDetails';
import { OfferingConfigurationForm } from '@waldur/offering/OfferingConfigurationForm';

import { serializer } from './serializer';

registerOfferingType({
  type: 'Support.OfferingTemplate',
  get label() {
    return translate('Request-based item');
  },
  component: OfferingConfigurationForm,
  detailsComponent: OfferingConfigurationDetails,
  serializer,
  showOptions: true,
  showComponents: true,
});
