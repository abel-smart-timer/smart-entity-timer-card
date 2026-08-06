# Smart Entity Timer Card

A responsive Home Assistant dashboard card for the [Smart Entity Timer integration](https://github.com/abel-smart-timer/smart-entity-timer).

![Card preview](images/preview.svg)

## Requirements

- Home Assistant 2026.7.0 or newer.
- Smart Entity Timer integration 0.1.2 or newer.
- A configured Smart Entity Timer helper.

## Features

- Choose **Turn on** or **Turn off**.
- Enter any duration in hours and minutes.
- Adjust the duration with configurable `−30 min` and `+30 min` buttons.
- Start and cancel controls with correct disabled states.
- Live local countdown and progress bar.
- Automatic reaction to normal completion, manual cancellation, automatic cancellation, restart restoration, skipped actions, and errors.
- Visual editor and entity picker.
- Responsive layouts for phones, tablets, and desktop dashboards.
- Compatible with Home Assistant light and dark themes.

## Manual installation

1. Copy `dist/smart-entity-timer-card.js` to:

   `/config/www/smart-entity-timer-card/smart-entity-timer-card.js`

2. In Home Assistant, open **Settings → Dashboards → three-dot menu → Resources**.
3. Add this resource as **JavaScript Module**:

   `/local/smart-entity-timer-card/smart-entity-timer-card.js?v=0.1.0`

4. Refresh the browser completely.
5. Edit a dashboard, add a card, and search for **Smart Entity Timer Card**.
6. Select the `sensor.*_estado` / Timer status entity created by the integration.

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
| `entity` | Yes | — | Smart Entity Timer status sensor. |
| `name` | No | Target entity name | Custom card title. |
| `icon` | No | Action-dependent timer icon | MDI icon. |
| `increment_minutes` | No | `30` | Amount added or removed by the step buttons. |
| `layout` | No | `auto` | `auto`, `compact`, or `expanded`. |
| `show_target_state` | No | `true` | Show the target entity's current state. |
| `show_last_result` | No | `true` | Show a recent result for 30 seconds. |
| `max_duration_minutes` | No | `1440` | Fallback maximum if the duration entity cannot be discovered. |
| `duration_entity` | No | Automatic | Optional manual override. |
| `action_entity` | No | Automatic | Optional manual override. |
| `start_entity` | No | Automatic | Optional manual override. |
| `cancel_entity` | No | Automatic | Optional manual override. |

The main Start and Cancel operations use `smart_entity_timer.start` and `smart_entity_timer.cancel`. Therefore, the card can still work if companion helper discovery fails.

## Development validation

```bash
npm run check
npm test
```

## License

MIT
