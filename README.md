# Smart Entity Timer Card

A responsive Home Assistant dashboard card for the [Smart Entity Timer integration](https://github.com/abel-smart-timer/smart-entity-timer).

![Card preview](images/preview.svg)

**Version:** 0.1.1  
**Required backend:** Smart Entity Timer 0.1.3 or newer (`card_api_version: 2`)

## What changed in 0.1.1

This is a synchronization and architecture stabilization release. The visual design remains intentionally close to 0.1.0.

- The integration status sensor is now the single source of truth.
- Duration/action changes use `smart_entity_timer.set_values`.
- The card no longer queries `config/entity_registry/list`.
- No global entity-registry cache is retained in the browser session.
- No permanent `_durationDirty` / `_actionDirty` local copies are retained.
- A short pending value is kept only while Home Assistant processes a change, then reconciled with the status sensor.
- Multiple phones, tablets, or dashboard panels converge on the same backend values.
- Manual companion-entity assignments are no longer necessary.
- GitHub Actions uses `actions/setup-node@v5`.

## Requirements

- Home Assistant 2026.7.0 or newer.
- Smart Entity Timer integration 0.1.3 or newer.
- A configured Smart Entity Timer helper.

## Features

- Choose **Turn on** or **Turn off**.
- Enter any duration in hours and minutes.
- Configurable `−30 min` / `+30 min` adjustment buttons.
- Start and cancel controls with correct disabled states.
- Live local countdown and progress bar.
- Automatic reaction to completion, manual cancellation, automatic cancellation, restart restoration, skipped actions, and errors.
- Visual editor and entity picker.
- Responsive `auto`, `compact`, and `expanded` layouts.
- Home Assistant light/dark theme compatibility.

## Manual installation / update

1. Copy `dist/smart-entity-timer-card.js` to:

   `/config/www/smart-entity-timer-card/smart-entity-timer-card.js`

2. Configure the dashboard resource as **JavaScript Module**:

   `/local/smart-entity-timer-card/smart-entity-timer-card.js?v=0.1.1`

3. If upgrading from 0.1.0, change the existing resource URL from `?v=0.1.0` to `?v=0.1.1`.
4. Hard-refresh the browser or fully close/reopen the Home Assistant mobile app.

## Basic YAML

```yaml
type: custom:smart-entity-timer-card
entity: sensor.luz_del_bano_estado
increment_minutes: 30
layout: auto
show_target_state: true
show_last_result: true
```

## Configuration

| Option | Required | Default | Description |
|---|---:|---:|---|
| `entity` | Yes | — | Smart Entity Timer status sensor using Card API v2. |
| `name` | No | Target entity name | Custom card title. |
| `icon` | No | Action-dependent timer icon | MDI icon. |
| `increment_minutes` | No | `30` | Amount added or removed by the step buttons. |
| `layout` | No | `auto` | `auto`, `compact`, or `expanded`. |
| `show_target_state` | No | `true` | Show the target entity's current state. |
| `show_last_result` | No | `true` | Show a recent result for 30 seconds. |

The duration maximum comes from the backend `constraints` attribute. The native duration/select/start/cancel entities still exist in Home Assistant, but the card does not need to discover or control them directly.

## Synchronization contract

When the user changes duration or action, the card calls:

```yaml
action: smart_entity_timer.set_values
target:
  entity_id: sensor.luz_del_bano_estado
data:
  duration_minutes: 90
  end_action: turn_off
```

The status sensor then publishes the authoritative value. Other open cards receive the same Home Assistant state update and synchronize automatically.

## Development validation

```bash
npm run check
npm test
```

The smoke test verifies Card API v2, backend writes, cross-card synchronization, external changes, and that the card does not query the entity registry.

## Planned 0.2.0 scope

Personalization is intentionally deferred until the synchronization contract is stable. Planned optional features are limited to:

- custom colors;
- fixed or selectable action;
- bar, ring, or time-only progress;
- independently hidden sections;
- time format;
- quick durations;
- modern, flat, and minimalist styles.

## License

MIT
