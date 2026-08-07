# Changelog

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
- Automatic discovery of the integration's duration, action, start, and cancel entities.
- Manual companion-entity overrides when automatic discovery is unavailable.
- Responsive compact and expanded layouts.
- Light and dark theme support through Home Assistant theme variables.
- Recent completion, cancellation, skip, and error messages.
- Home Assistant Sections grid sizing and entity-card suggestions.
