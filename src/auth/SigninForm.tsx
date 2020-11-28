import * as React from 'react';
import { reduxForm, SubmissionError } from 'redux-form';

import { format } from '@waldur/core/ErrorMessageFormatter';
import { translate } from '@waldur/i18n';

import { AuthService } from './AuthService';
import { InputGroup } from './InputGroup';
import { SubmitButton } from './SubmitButton';

interface FormData {
  username: string;
  password: string;
}

const signin = async (values: FormData) => {
  // See also: https://github.com/facebook/react/issues/1159#issuecomment-506584346
  if (!values.password || !values.username) {
    throw new SubmissionError({
      _error: translate('Please enter username and password.'),
    });
  }
  try {
    await AuthService.signin(values.username, values.password);
    await AuthService.redirectOnSuccess();
  } catch (error) {
    throw new SubmissionError({ _error: format(error) });
  }
};

const FORM_ID = 'SigninForm';

export const SigninForm = reduxForm<FormData>({ form: FORM_ID })(
  ({ submitting, handleSubmit, error }) => (
    <form className="m-b-sm" onSubmit={handleSubmit(signin)}>
      <InputGroup
        fieldName="username"
        placeholder={translate('Username')}
        type="text"
      />
      <InputGroup
        fieldName="password"
        placeholder={translate('Password')}
        type="password"
      />
      <SubmitButton label={translate('Login')} submitting={submitting} />
      {error && <p className="text-danger">{error}</p>}
    </form>
  ),
);
