import * as React from 'react';
import * as Col from 'react-bootstrap/lib/Col';
import * as Row from 'react-bootstrap/lib/Row';

import { LoadingSpinner } from '@waldur/core/LoadingSpinner';
import Panel from '@waldur/core/Panel';
import { translate } from '@waldur/i18n';
import { CloseDialogButton } from '@waldur/modal/CloseDialogButton';
import { ModalDialog } from '@waldur/modal/ModalDialog';
import { connectAngularComponent } from '@waldur/store/connect';

import { ImportButton } from './ImportButton';
import { OfferingsList } from './OfferingsList';
import { ResourcesList } from './ResourcesList';
import { ImportDialogProps } from './types';
import { useImportDialog } from './useImportDialog';

export const ResourceImportDialog: React.SFC<ImportDialogProps> = props => {

  const {
    offering,
    setOffering,
    resources,
    toggleResource,
    plans,
    assignPlan,
    offeringsProps,
    resourceProps,
    handleSubmit,
    submitting,
  } = useImportDialog(props);

  return (
    <ModalDialog
      title={translate('Import resource')}
      footer={
        <>
          <ImportButton
            disabled={resources.length === 0}
            submitting={submitting}
            onClick={handleSubmit}
          />
          <CloseDialogButton/>
        </>
      }>
      {
        offeringsProps.loading ? <LoadingSpinner/> :
        offeringsProps.erred ? <h3>{translate('Unable to load data.')}</h3> :
        offeringsProps.loaded &&
        <Row>
          <Col lg={12}>
            <Panel
              className="float-e-margins"
              title={translate('Step 1. Select offering')}>
              <OfferingsList
                choices={offeringsProps.data}
                value={offering}
                onChange={setOffering}
              />
            </Panel>
          </Col>
          {offering && (
            <Col lg={12}>
              <Panel
                className="float-e-margins"
                title={translate('Step 2. Select resources')}>
                {
                  resourceProps.loading ? <LoadingSpinner/> :
                  resourceProps.erred ? <h3>{translate('Unable to load data.')}</h3> :
                  resourceProps.loaded &&
                  <ResourcesList
                    resources={resourceProps.data}
                    offering={offering}
                    value={resources}
                    toggleResource={toggleResource}
                    plans={plans}
                    assignPlan={assignPlan}
                  />
                }
              </Panel>
            </Col>
          )}
        </Row>
      }
    </ModalDialog>
  );
};

export default connectAngularComponent(ResourceImportDialog, ['resolve']);
