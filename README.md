# Smart Entity Timer Card

A responsive and configurable Home Assistant dashboard card for the [Smart Entity Timer integration](https://github.com/abel-smart-timer/smart-entity-timer).

![Card preview](images/preview.svg)

**Version:** 0.2.2  
**Required backend:** Smart Entity Timer 0.1.3 or newer (`card_api_version: 2`)

## Highlights

- Selectable ON/OFF action or fixed ON-only/OFF-only cards.
- Free duration input in hours and minutes.
- Configurable increment/decrement controls.
- Optional quick-duration presets.
- Live countdown calculated locally.
- Bar, ring, or time-only progress.
- Modern, flat, and minimal visual styles.
- Individually configurable visible sections.
- Per-control custom colors.
- Multi-browser synchronization through Card API v2.
- Visual editor inside Home Assistant.

## Recommended installation: HACS

1. Open **HACS** in Home Assistant.
2. Search for **Smart Entity Timer Card**.
3. Download/install it.
4. HACS should register the dashboard resource automatically.
5. Add a new card and search for **Smart Entity Timer Card**, or use YAML:

```yaml
type: custom:smart-entity-timer-card
entity: sensor.luz_del_bano_estado
```

A clean HACS installation has been validated together with Smart Entity Timer 0.1.3 on Home Assistant OS running on a Raspberry Pi 5, including automatic dashboard-resource creation.

## Manual installation / update

1. Copy `dist/smart-entity-timer-card.js` to:

   `/config/www/smart-entity-timer-card/smart-entity-timer-card.js`

2. Configure the dashboard resource as **JavaScript Module**:

   `/local/smart-entity-timer-card/smart-entity-timer-card.js?v=0.2.2`

3. If upgrading, change the existing resource query to `?v=0.2.2`.
4. Hard-refresh the browser or fully close/reopen the Home Assistant mobile app.

## Minimal configuration

```yaml
type: custom:smart-entity-timer-card
entity: sensor.luz_del_bano_estado
```

This preserves the default behavior: selectable ON/OFF action, modern style, bar progress, automatic time format, and no quick presets until configured.

## Personalized example

```yaml
type: custom:smart-entity-timer-card
entity: sensor.luz_del_bano_estado
name: Temporizador baño
icon: mdi:timer-outline
increment_minutes: 30
layout: auto
visual_style: modern
action_mode: selectable
progress_style: ring
time_format: auto
quick_times:
  - "15"
  - "30"
  - "60"
  - "120"
show_header: true
show_target_state: true
show_action_selector: true
show_duration_controls: true
show_quick_times: true
show_progress: true
show_status: true
show_last_result: true
color_start: [46, 175, 104]
color_timer_active: [74, 112, 245]
color_cancel: [219, 68, 55]
color_inactive: [125, 125, 125]
color_turn_on: [46, 175, 104]
color_turn_off: [232, 132, 61]
color_progress: [74, 112, 245]
color_quick: [120, 120, 120]
color_quick_selected: [92, 75, 219]
```

All color fields are optional. If omitted, the card inherits Home Assistant theme colors.

## Configuration reference

### General

| Option | Default | Description |
|---|---|---|
| `entity` | required | Smart Entity Timer status sensor using Card API v2. |
| `name` | target name | Optional card title. |
| `icon` | action-dependent | MDI icon. |
| `increment_minutes` | `30` | Amount added/removed by the step buttons. |
| `layout` | `auto` | `auto`, `compact`, `expanded`. |
| `visual_style` | `modern` | `modern`, `flat`, `minimal`. |

### Action and duration

| Option | Default | Description |
|---|---|---|
| `action_mode` | `selectable` | `selectable`, `turn_on`, or `turn_off`. |
| `quick_times` | `[]` | List of quick preset durations in minutes. |
| `progress_style` | `bar` | `bar`, `ring`, or `time`. |
| `time_format` | `auto` | `auto`, `digital`, or `text`. |

### Visibility

| Option | Default |
|---|---:|
| `show_header` | `true` |
| `show_target_state` | `true` |
| `show_action_selector` | `true` |
| `show_duration_controls` | `true` |
| `show_quick_times` | `true` |
| `show_progress` | `true` |
| `show_status` | `true` |
| `show_last_result` | `true` |

Start and Cancel controls are always present because they are essential to the card's primary function.

### Optional colors

The visual editor uses Home Assistant RGB color selectors. Empty values inherit the Home Assistant theme.

| Option | Controls |
|---|---|
| `color_start` | Enabled **Start** button |
| `color_timer_active` | **Timer ON** button while active |
| `color_cancel` | Enabled **Cancel** button |
| `color_inactive` | Disabled/inactive controls |
| `color_turn_on` | Turn-on selector/badge/action accents |
| `color_turn_off` | Turn-off selector/badge/action accents |
| `color_progress` | Progress bar, ring, and time-only progress value |
| `color_quick` | Unselected quick-duration buttons |
| `color_quick_selected` | Selected quick-duration button |

## Visual styles

### Modern

Rounded accent surfaces, soft shadows, gradients, and layered controls.

### Flat

Solid colors, visible borders, no elevation, and no gradients.

### Minimal

Fewer decorative containers, tighter spacing, underline-style selectors/presets, and reduced visual weight.

## Progress modes

- **Bar:** horizontal elapsed-progress indicator.
- **Ring:** circular elapsed-progress indicator.
- **Time:** time value only, without a graphical track.

## Synchronization contract

Home Assistant remains the single source of truth. Duration/action changes are written through Card API v2 using `smart_entity_timer.set_values`, and the status sensor publishes the authoritative values to every open card.

The card does not query the Entity Registry for companion entities during normal operation.

## Compatibility

Existing 0.1.1 configurations remain valid. All 0.2.x options have safe defaults.

Stable tested combination:

```text
Smart Entity Timer       0.1.3
Smart Entity Timer Card  0.2.2
Card API                  2
```

## Development validation

```bash
npm run check
npm test
```

The test suite checks syntax, Card API v2 synchronization, external state reconciliation, fixed actions, presets, time formats, colors, style modes, visibility options, and confirms that normal operation does not query the Entity Registry.

## License

MIT
