import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Field, Form } from 'react-final-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { validateWindow } from '../utils';

vi.mock('@/form/useFlatpickrTheme', () => ({
  useFlatpickrTheme: () => undefined,
}));

// Flatpickr reads its "today" from `defaults.now = new Date()`, evaluated ONCE
// at module load. Vitest hoists every `import` above the test body, so a
// `beforeEach` fake clock always loses the race: flatpickr latched the real
// date, the calendar opened on the real month, and every `getByLabelText`
// keyed to the frozen month missed. The freeze has to happen before the
// component (and flatpickr) enter the module graph, which means the import
// below is deferred rather than hoisted.
const FROZEN_NOW = new Date(2026, 8, 2, 15, 30);
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(FROZEN_NOW);

const { MaintenanceWindowPicker } = await import('./MaintenanceWindowPicker');

// Drives the real react-flatpickr: every bug this file guards against lives in
// how the library wires up its inputs, which a stub would define away.
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

// Flatpickr flags its visible input as active for as long as the calendar is
// open; the calendar element itself stays in the DOM either way.
const pickerInput = () => screen.getByRole('textbox');

describe('MaintenanceWindowPicker', () => {
  beforeEach(() => {
    // Re-assert the freeze per test: `afterEach` restores the real clock, and
    // Flatpickr's module-level `defaults.now` cannot be re-read per test — the
    // value below only ever has to match what was latched at import time.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(FROZEN_NOW);
  });
  afterEach(() => vi.useRealTimers());

  it('opens the calendar from the Custom… chip', async () => {
    render(<Harness />);

    await userEvent.click(screen.getByText('Custom…'));

    expect(pickerInput()).toHaveClass('active');
  });

  it('enables submit after picking today and tomorrow in the afternoon', async () => {
    render(<Harness />);
    await userEvent.click(pickerInput());

    await userEvent.click(screen.getByLabelText('September 2, 2026'));
    await userEvent.click(screen.getByLabelText('September 3, 2026'));

    expect(screen.getByText('Submit')).toBeEnabled();
  });

  it('shows the validation error once the calendar is closed', async () => {
    render(<Harness />);
    await userEvent.click(pickerInput());
    await userEvent.click(screen.getByLabelText('September 10, 2026'));
    await userEvent.click(screen.getByLabelText('September 10, 2026'));
    expect(screen.queryByText('End must be after start.')).toBeNull();

    // user-event sets only `key`/`code`; Flatpickr's handler switches on the
    // legacy `keyCode`, so its Escape-to-close path needs a raw keydown.
    // eslint-disable-next-line testing-library/prefer-user-event, testing-library/no-node-access
    fireEvent.keyDown(document.activeElement, { key: 'Escape', keyCode: 27 });

    expect(screen.getByText('End must be after start.')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeDisabled();
  });
});
