# Smart Entity Timer Card 0.1.1 test plan

Use Smart Entity Timer integration 0.1.3 or newer.

## Installation

- [ ] Resource loads without browser-console errors.
- [ ] Card appears in the dashboard card picker.
- [ ] Visual editor only offers Smart Entity Timer sensor entities.
- [ ] Selecting the sensor renders the card.

## Idle controls

- [ ] Turn on / Turn off selector changes correctly.
- [ ] Start is disabled when the target already has the selected state.
- [ ] Start becomes enabled when the opposite action is selected.
- [ ] `−30` and `+30` use the configured increment.
- [ ] Hours and minutes accept arbitrary values.
- [ ] Duration stays within 1 and the configured maximum.

## Active timer

- [ ] Start changes to Timer ON and is disabled.
- [ ] Action and duration controls become disabled.
- [ ] Cancel becomes enabled.
- [ ] Countdown updates every second.
- [ ] Progress bar advances smoothly.
- [ ] Closing the dashboard does not affect the backend timer.

## Completion and cancellation

- [ ] Normal turn-off completion updates the card.
- [ ] Normal turn-on completion updates the card.
- [ ] Manual cancellation returns the card to idle.
- [ ] Early target-state cancellation returns the card to idle.
- [ ] Recent result message disappears after about 30 seconds.

## Restart and errors

- [ ] A timer that survives restart resumes visually.
- [ ] An expired turn-off after restart is shown as completed.
- [ ] An expired turn-on omitted for safety is shown as skipped.
- [ ] An unavailable entity shows a useful status and disables Start.
- [ ] A backend error is visible without permanently blocking controls.

## Layout

- [ ] Auto layout works in a normal masonry column.
- [ ] Compact layout works on a phone-sized card.
- [ ] Expanded layout works on a wide dashboard.
- [ ] Light theme is readable.
- [ ] Dark theme is readable.
- [ ] Sections view can resize the card without clipping controls.


## Cross-panel synchronization

1. Open the same timer card in two browsers or devices.
2. Change duration in the first.
3. Verify the second follows the status sensor value.
4. Change action in the second.
5. Verify the first follows it.
6. Confirm no reload is required.

Expected: both cards converge on backend values and no entity-registry query is required.
