# Smart Entity Timer Card 0.3.0 test plan

This candidate focuses on mobile layouts. Keep Smart Entity Timer backend on Card API v2.

## M01 — Existing card compatibility
Open an existing 0.2.2 card without changing YAML.
Expected: it loads and all timer functions still work.

## M02 — Mini idle
Set `layout: mini` on a phone.
Expected:
- target-state block hidden by default;
- duration `- / hours:minutes / +` stays on one row;
- quick presets remain visible and compact;
- Start and Inactive controls stay side by side with `button_mode: auto`;
- height is substantially lower than the full card.

## M03 — Mini active
Start the timer.
Expected:
- action selector, duration editing and quick presets collapse by default;
- remaining time/progress stays visible;
- Timer ON and Cancel stay side by side;
- Cancel works normally.

## M04 — Tile idle
Set `layout: tile`, preferably with a fixed action.
Expected:
- essential header + duration + Start only;
- no target state, presets, status detail or idle progress by default;
- `button_mode: auto` behaves as `primary_only`.

## M05 — Tile active
Start the timer.
Expected:
- duration/action editing collapses;
- progress/remaining becomes visible;
- only Cancel is shown while active.

## M06 — Legacy visibility values
Use a 0.2.2-style configuration containing `show_quick_times: true`, `show_progress: true`, `show_status: true`, and `show_target_state: true`, then switch to Tile.
Expected: Tile still hides those nonessential idle sections so the layout remains compact.

## M07 — Button modes
Test `inline` and `primary_only` in Mini and normal layouts.
Expected: inline never stacks on a phone; primary_only shows only the usable action.

## M08 — Density
Test Mini with `density: normal`, then `density: tight`.
Expected: same functions, visibly different spacing.

## M09 — Progress styles
In Mini and Tile test bar, ring and time.
Expected: all render at compact dimensions and keep the configured progress color.

## M10 — Visual styles and colors
Test Modern, Flat, Minimal plus custom colors.
Expected: styles remain distinct and custom colors continue to apply.

## M11 — Synchronization
Open the same timer in two browsers/apps.
Change duration/action and start/cancel.
Expected: Card API v2 synchronization remains backend-authoritative.

## Release gate
Publish 0.3.0 only after M01–M11 pass on at least one phone and no JavaScript errors appear in the browser/app logs.
