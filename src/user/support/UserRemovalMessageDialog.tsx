import { FunctionComponent } from 'react';

import { TranslateProps, withTranslation } from '@waldur/i18n';
import { CloseDialogButton } from '@waldur/modal/CloseDialogButton';
import { ModalDialog } from '@waldur/modal/ModalDialog';

interface UserRemovalMessageDialogProps extends TranslateProps {
  resolve: {
    supportEmail: string;
    userName: string;
  };
}

export const PureUserRemovalMessageDialog: FunctionComponent<UserRemovalMessageDialogProps> = (
  props,
) => {
  const {
    resolve: { supportEmail, userName },
    translate,
  } = props;
  return (
    <ModalDialog
      title={translate('Request account removal for {userName}.', { userName })}
      footer={
        <div>
          <CloseDialogButton label={translate('Close')} />
        </div>
      }
    >
      <p>
        {translate('To remove account, please send a request to {support}.', {
          support: supportEmail || translate('support'),
        })}
      </p>
      <p>
        {translate(
          'Please note that request should specify user name and provide a reason.',
        )}
      </p>
    </ModalDialog>
  );
};

export const UserRemovalMessageDialog = withTranslation(
  PureUserRemovalMessageDialog,
);
