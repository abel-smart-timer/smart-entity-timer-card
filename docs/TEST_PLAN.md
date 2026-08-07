# Smart Entity Timer Card 0.2.2 test plan

Use Smart Entity Timer integration 0.1.3 or newer.

## Upgrade compatibility

- [ ] Replace the previous JS with 0.2.2 and update the resource query string.
- [ ] An existing 0.1.1 card opens without editing its YAML.
- [ ] Default appearance remains Modern + Bar + Selectable action.
- [ ] Existing duration/action synchronization across browsers still works.

## Visual editor

- [ ] General, Behavior, Visible sections, and Custom colors panels open correctly.
- [ ] Smart Entity Timer status sensor picker works.
- [ ] Layout offers Auto / Compact / Expanded.
- [ ] Style offers Modern / Flat / Minimal.
- [ ] Action mode offers Selectable / Turn on only / Turn off only.
- [ ] Progress offers Bar / Ring / Time only.
- [ ] Time format offers Automatic / Digital / Text.
- [ ] Quick durations accept multiple minute values.
- [ ] RGB color pickers can be set and cleared.
- [ ] Set deliberately different colors for Start, Timer ON, Cancel, inactive, Turn on, Turn off, progress, quick durations, and selected quick duration; every rendered element must visibly use its configured color.
- [ ] Clear each custom color and verify that element returns to the Home Assistant theme/default color.

## Core timer regression

- [ ] Turn on / Turn off selector changes correctly in selectable mode.
- [ ] Start is disabled when target already has the requested state.
- [ ] Step buttons use the configured increment.
- [ ] Hours/minutes accept arbitrary values.
- [ ] Start changes to Timer ON and disables editable controls.
- [ ] Cancel works.
- [ ] Normal completion updates the card.
- [ ] Early target-state automatic cancellation updates the card.
- [ ] Restart restoration resumes visually.
- [ ] Unavailable target disables Start and displays status.

## Fixed actions

### Turn off only
- [ ] Set `action_mode: turn_off` while backend currently says turn_on.
- [ ] Action selector is hidden.
- [ ] Card displays Turn off as its idle action.
- [ ] Merely opening the card does not change the backend action.
- [ ] Press Start and verify backend action becomes turn_off immediately before starting.
- [ ] Timer turns the target off.

### Turn on only
- [ ] Repeat the inverse behavior with `action_mode: turn_on`.

## Quick durations

Use presets 15, 30, 60, 120.

- [ ] Four preset buttons appear.
- [ ] Selecting a preset updates the backend duration.
- [ ] Other open cards synchronize to the new duration.
- [ ] Current preset is visually selected while idle.
- [ ] Presets disable while timer is active.
- [ ] Empty `quick_times` hides the section.
- [ ] Invalid/duplicate/out-of-range values are ignored safely.

## Progress styles

### Bar
- [ ] Bar fills as elapsed time increases.
- [ ] Custom progress color applies.

### Ring
- [ ] Ring renders without clipping in mobile and desktop layouts.
- [ ] Ring advances as elapsed time increases.
- [ ] Remaining/programmed time stays centered and readable.

### Time only
- [ ] No bar/ring is displayed.
- [ ] Time remains prominent and updates every second when active.

## Time formats

- [ ] Automatic: idle uses text, active uses digital countdown.
- [ ] Digital: idle and active use clock format.
- [ ] Text: idle and active use human-readable units.
- [ ] Active text format includes seconds and updates every second.

## Visibility controls

Toggle every option individually:

- [ ] Header.
- [ ] Target state.
- [ ] Action selector.
- [ ] Duration controls.
- [ ] Quick durations.
- [ ] Progress/time visual.
- [ ] Status message.
- [ ] Start/Cancel footer.
- [ ] Recent result behavior.

Verify hiding one section does not break remaining controls.

## Colors

- [ ] Turn on color changes ON accent.
- [ ] Turn off color changes OFF accent.
- [ ] Progress color changes bar/ring independently.
- [ ] Cancel color changes Cancel styling.
- [ ] Background color changes card background.
- [ ] Clearing every custom color returns to theme colors.
- [ ] Light theme remains readable.
- [ ] Dark theme remains readable.

## Visual styles

### Modern
- [ ] Current rich design, shadows and gradients render correctly.

### Flat
- [ ] No decorative elevation/gradient remains on major action/progress surfaces.
- [ ] Layout and controls stay identical functionally.

### Minimal
- [ ] Tighter spacing and smaller controls render without clipping.
- [ ] All selected sections remain available.

## Responsive layouts

Test each style with Auto / Compact / Expanded:

- [ ] Phone width.
- [ ] Tablet width.
- [ ] Desktop dashboard.
- [ ] Sections dashboard resizing.

## Multi-panel synchronization

Open the same timer in three browsers/devices.

- [ ] Change duration from browser A; B and C follow.
- [ ] Change action from B; A and C follow if they are selectable cards.
- [ ] Fixed-action cards retain their configured visual action while idle without writing it until Start.
- [ ] Start from one browser and Cancel from another.
- [ ] All cards converge to the backend status without reload.

## GitHub validation

- [ ] `npm run check` passes.
- [ ] `npm test` passes.
- [ ] GitHub JavaScript checks pass.
- [ ] HACS validation passes.
- [ ] No warnings from Actions runtime versions.
