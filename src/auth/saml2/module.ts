import { connectAngularComponent } from '@waldur/store/connect';

import authSaml2 from './auth-saml2';
import authSaml2Trigger from './auth-saml2-trigger';
import { AuthSaml2Dialog } from './AuthSaml2Dialog';
import Saml2Service from './saml2-service';

export default module => {
  module.service('Saml2Service', Saml2Service);
  module.component('authSaml2Dialog', connectAngularComponent(AuthSaml2Dialog));
  module.component('authSaml2Trigger', authSaml2Trigger);
  module.component('authSaml2', authSaml2);
};
