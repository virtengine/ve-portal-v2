import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Field, Form } from 'react-final-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { validateWindow } from '../utils';

import { MaintenanceWindowPicker } from './MaintenanceWindowPicker';

// Drives the real calendar: every bug this file guards against lives in how
// the picker wires up to the form, which a stub would define away.
const Harness = () => (
  <Form onSubmit={() => undefined}>
    {({ handleSubmit, invalid }) => (
      <form onSubmit={handleSubmit}>
        <Field
          name="scheduled_window"
          component={MaintenanceWindowPicker}
          validate={(value) => validateWindow(value, {})}
        />
        <button type="submit" disabled={invalid}>
          Submit
        </button>
      </form>
    )}
  </Form>
);

const pickerTrigger = () =>
  screen.getByRole('button', { name: 'Pick a start and end date/time...' });

// Day buttons are labelled like "Wednesday, September 2nd, 2026".
const day = (label: string) =>
  screen.getByRole('button', { name: new RegExp(label) });

// Needs a frozen clock: picking *today* in the afternoon only makes a valid
// window because the start is floored at the next slot after now. The rest
// (chips, Custom…) is in the component's stories.
describe('MaintenanceWindowPicker', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 2, 15, 30));
  });
  afterEach(() => vi.useRealTimers());

  it('enables submit after picking today and tomorrow in the afternoon', async () => {
    render(<Harness />);
    await userEvent.click(pickerTrigger());

    await userEvent.click(day('September 2nd, 2026'));
    await userEvent.click(day('September 3rd, 2026'));

    expect(screen.getByText('Submit')).toBeEnabled();
  });

  // The picker only marks the field blurred when its popup closes, so this is
  // the assertion for the wiring the flatpickr era covered: the zero-length
  // range is in the form state from the second click, and only *committing* to
  // it — i.e. closing the calendar — surfaces the error. Lost with e1136eeb9
  // when the calendar became react-day-picker.
  it('shows the validation error once the calendar is closed', async () => {
    render(<Harness />);
    await userEvent.click(pickerTrigger());

    await userEvent.click(day('September 10th, 2026'));
    await userEvent.click(day('September 10th, 2026'));

    // Both ends are the same instant, but the error stays hidden: the field
    // is not touched until the user is done with it. Asserted BEFORE the close
    // on purpose — the calendar staying open across a pick is what makes the
    // close the only thing that can reveal the error.
    expect(screen.queryByText('End must be after start.')).toBeNull();

    // The popup stays open after a pick when times are enabled, so close it
    // the way a user does — a click outside it.
    await userEvent.click(document.body);

    // Only now is the field touched, so only now does the error appear.
    await waitFor(() =>
      expect(screen.getByText('End must be after start.')).toBeInTheDocument(),
    );

    // Submit is already disabled at this point and was disabled *before* the
    // close too: react-final-form's `invalid` comes from the field validator,
    // which sees the zero-length range the moment the second click lands. So
    // this line is a guard on the end state, not evidence for the close. The
    // message assertion above is what actually pins "surfaces on close" —
    // submit-disabled alone holds whether or not the calendar was ever closed.
    expect(screen.getByText('Submit')).toBeDisabled();
  });
});
