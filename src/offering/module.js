import offeringRoutes from './routes';
import offeringsService from './offerings-service';
import projectOfferingsList from './offerings-list';
import appstoreOffering from './appstore-offering';
import offeringSummary from './OfferingSummary';
import offeringDetails from './offering-details';
import offeringState from './OfferingState';
import offeringPolicy from './offering-policy';
import offeringReportButton from './OfferingReportButton';
import offeringReportDialog from './OfferingReportDialog';
import registerOfferingCategory from './register-offering-category';
import registerSidebarExtension from './sidebar';
import appstoreOfferingSummary from './appstore-offering-summary';
import registerTableExtension from './table-extension';
import actions from './actions';
import './events';
import './marketplace';

export default module => {
  module.config(offeringRoutes);
  module.service('offeringsService', offeringsService);
  module.component('appstoreOfferingSummary', appstoreOfferingSummary);
  module.component('projectOfferingsList', projectOfferingsList);
  module.component('offeringSummary', offeringSummary);
  module.component('appstoreOffering', appstoreOffering);
  module.component('offeringDetails', offeringDetails);
  module.component('offeringState', offeringState);
  module.component('offeringPolicy', offeringPolicy);
  module.component('offeringReportButton', offeringReportButton);
  module.component('offeringReportDialog', offeringReportDialog);
  module.run(registerOfferingCategory);
  module.run(registerSidebarExtension);
  module.run(registerTableExtension);
  module.config(actionsConfig);
};

// @ngInject
function actionsConfig(ActionConfigurationProvider) {
  ActionConfigurationProvider.register('Support.Offering', actions);
}
