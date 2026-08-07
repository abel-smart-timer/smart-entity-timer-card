# Changelog

## 0.2.2

- Fixed custom colors selected in the visual editor not being applied to the rendered card.
- Moved derived color variables to the same `ha-card` scope that receives the editor-selected RGB variables.
- Added a regression test for the CSS custom-property scope bug.
- No backend changes are required; Smart Entity Timer 0.1.3 remains compatible.

## 0.2.1 — 2026-08-07

Real-HAOS usability refinement of the 0.2 personalization release.

- Start and Cancel controls are now always visible; the experimental `show_footer` option was removed because hiding the only execution controls made the card impractical.
- Reworks custom colors so every option maps directly to a visible control.
- Adds separate colors for Start, Timer ON, Cancel, inactive/disabled controls, Turn on, Turn off, progress, quick durations, and selected quick duration.
- Removes the experimental whole-card background color control.
- Progress color now applies to the bar, ring, and time-only value.
- Quick-duration colors now apply to both unselected and selected presets.
- Makes Modern, Flat, and Minimal styles visually distinct instead of subtle variations.
- Flat uses solid controls, stronger borders, and no shadows/gradients.
- Minimal removes most decorative containers and uses underline-oriented controls with tighter spacing.
- Keeps Card API v2 synchronization and all 0.2.0 behavior unchanged.

## 0.2.0 — 2026-08-07

Personalization release built on the stable Card API v2 synchronization contract.

- Adds optional custom RGB colors for Turn on, Turn off, progress, cancel, and card background.
- Adds `action_mode`: selectable, turn-on only, or turn-off only.
- Fixed-action cards apply their configured action immediately before Start and do not mutate the backend just by being displayed.
- Adds `progress_style`: bar, ring, or time only.
- Adds independent visibility controls for header, target state, action selector, duration controls, quick presets, progress, status message, and footer controls.
- Adds `time_format`: automatic, digital, or text.
- Adds configurable quick-duration presets.
- Adds modern, flat, and minimal visual styles.
- Adds expandable sections to the visual card editor.
- Keeps 0.1.1 YAML configurations backward compatible.
- Keeps Home Assistant / Card API v2 as the source of truth across multiple open panels.
- Expands automated tests for personalization and fixed-action behavior.

## 0.1.1 — 2026-08-06

Synchronization and backend-contract stabilization release.

- Requires Smart Entity Timer 0.1.3 / Card API v2.
- Uses `smart_entity_timer.set_values` for duration and action changes.
- Removes entity-registry discovery and the global entity-registry cache.
- Removes persistent duration/action dirty flags that could desynchronize multiple panels.
- Reconciles short-lived pending UI values with the authoritative status sensor.
- Removes manual companion-entity overrides from the card editor.
- Uses backend constraints for maximum duration.
- Adds cross-card and external-change synchronization tests.
- Updates GitHub Actions to `actions/setup-node@v5`.

## 0.1.0 — 2026-08-06

Initial test release.

- Graphical card editor filtered to Smart Entity Timer status sensors.
- Turn-on and turn-off segmented control.
- Free hours/minutes input.
- Configurable minus/plus increment, defaulting to 30 minutes.
- Local one-second countdown and progress bar without writing every second to Home Assistant.
- Start and cancel through the integration's entity services.
- Responsive compact and expanded layouts.
- Light and dark theme support through Home Assistant theme variables.
- Recent completion, cancellation, skip, and error messages.
- Home Assistant Sections grid sizing and entity-card suggestions.
