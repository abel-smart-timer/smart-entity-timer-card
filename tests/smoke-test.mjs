import assert from "node:assert/strict";

class MockShadowRoot {
  constructor() {
    this.innerHTML = "";
  }
  getElementById() {
    return null;
  }
  querySelectorAll() {
    return [];
  }
}

class MockHTMLElement {
  attachShadow() {
    this.shadowRoot = new MockShadowRoot();
    return this.shadowRoot;
  }
  dispatchEvent() {
    return true;
  }
}

const definitions = new Map();
globalThis.HTMLElement = MockHTMLElement;
globalThis.CustomEvent = class CustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    Object.assign(this, init);
  }
};
globalThis.customElements = {
  define(name, definition) {
    definitions.set(name, definition);
  },
  get(name) {
    return definitions.get(name);
  },
};
globalThis.window = { customCards: [] };
Object.defineProperty(globalThis, "navigator", { value: { language: "es-MX" }, configurable: true });

const module = await import("../dist/smart-entity-timer-card.js");
assert.equal(module.CARD_VERSION, "0.2.2");
assert.equal(module.formatClock(3661), "01:01:01");
assert.equal(module.formatTimeValue(90, "text", { language: "es" }, false), "1 h 30 min");
assert.equal(module.formatTimeValue(61, "digital", { language: "es" }, true), "01:01");
assert.deepEqual(module.parseQuickTimes(["15", "30", "30", "0", "2000"], 1440), [15, 30]);
assert.deepEqual(module.parseQuickTimes("15, 30;60 120", 1440), [15, 30, 60, 120]);
assert.equal(module.normalizeColor([255, 128, 0]), "rgb(255 128 0)");
assert.equal(module.normalizeColor("#ff8800"), "#ff8800");
assert.equal(module.normalizeColor("red;position:absolute"), undefined);
assert.equal(module.targetReached("light.test", "off", "turn_off"), true);
assert.equal(module.targetReached("climate.test", "cool", "turn_on"), true);
assert.ok(customElements.get("smart-entity-timer-card"));
assert.equal(window.customCards.length, 1);

const statusEntity = "sensor.luz_del_bano_estado";
const states = {
  [statusEntity]: {
    state: "idle",
    last_updated: "2026-08-07T05:00:00.000Z",
    last_changed: "2026-08-07T05:00:00.000Z",
    attributes: {
      card_api_version: 2,
      backend_version: "0.1.3",
      target_entity: "light.luz_del_bano",
      target_entity_name: "Luz del baño",
      target_entity_state: "on",
      end_action: "turn_off",
      duration_minutes: 60,
      duration_seconds: 3600,
      can_start: true,
      can_cancel: false,
      constraints: { min_seconds: 60, max_seconds: 86400, step_seconds: 60 },
      capabilities: ["turn_on", "turn_off", "set_duration", "set_action", "start", "cancel"],
    },
  },
};

let sequence = 1;
const serviceCalls = [];
const hass = {
  language: "es",
  states,
  callWS: async () => {
    throw new Error("Card API v2 must not query the entity registry");
  },
  callService: async (domain, service, data) => {
    serviceCalls.push({ domain, service, data });
    assert.equal(domain, "smart_entity_timer");
    const status = states[statusEntity];
    if (service === "set_values") {
      if (data.duration_minutes !== undefined) {
        status.attributes.duration_minutes = data.duration_minutes;
        status.attributes.duration_seconds = data.duration_minutes * 60;
      }
      if (data.end_action !== undefined) status.attributes.end_action = data.end_action;
    } else if (service === "start") {
      status.state = "active";
      status.attributes.can_start = false;
      status.attributes.can_cancel = true;
    } else if (service === "cancel") {
      status.state = "idle";
      status.attributes.can_cancel = false;
    }
    sequence += 1;
    status.last_updated = `2026-08-07T05:00:${String(sequence).padStart(2, "0")}.000Z`;
  },
};

const Card = customElements.get("smart-entity-timer-card");

const form = Card.getConfigForm();
assert.ok(Array.isArray(form.schema));
assert.ok(form.schema.some((item) => item.type === "expandable"));
const formText = JSON.stringify(form.schema);
assert.match(formText, /color_rgb/);
assert.match(formText, /quick_times/);
assert.match(formText, /action_mode/);
assert.match(formText, /progress_style/);
assert.doesNotMatch(formText, /show_footer/);
assert.doesNotMatch(formText, /color_background/);
assert.match(formText, /color_start/);
assert.match(formText, /color_timer_active/);
assert.match(formText, /color_quick_selected/);
const cardA = new Card();
const cardB = new Card();
cardA.setConfig({ entity: statusEntity });
cardB.setConfig({ entity: statusEntity });
cardA.hass = hass;
cardB.hass = hass;

// 0.1.1-style configuration remains valid and keeps the modern/bar/selectable defaults.
assert.match(cardA.shadowRoot.innerHTML, /Luz del baño/);
assert.match(cardA.shadowRoot.innerHTML, /style-modern/);
assert.match(cardA.shadowRoot.innerHTML, /progress-bar/);
assert.match(cardA.shadowRoot.innerHTML, /id="turn-on"/);
assert.match(cardA.shadowRoot.innerHTML, /id="turn-off"/);
assert.equal(cardA._draftMinutes, 60);
assert.equal(cardB._draftMinutes, 60);

// Cross-panel synchronization stays backend-authoritative.
await cardA._setDuration(90);
cardA.hass = hass;
cardB.hass = hass;
assert.equal(states[statusEntity].attributes.duration_minutes, 90);
assert.equal(cardA._draftMinutes, 90);
assert.equal(cardB._draftMinutes, 90);
assert.equal(cardA._pendingDuration, undefined);

await cardA._setAction("turn_on");
cardA.hass = hass;
cardB.hass = hass;
assert.equal(states[statusEntity].attributes.end_action, "turn_on");
assert.equal(cardA._draftAction, "turn_on");
assert.equal(cardB._draftAction, "turn_on");

// External change is still reconciled.
states[statusEntity].attributes.duration_minutes = 35;
states[statusEntity].attributes.duration_seconds = 2100;
states[statusEntity].attributes.end_action = "turn_off";
sequence += 1;
states[statusEntity].last_updated = `2026-08-07T05:01:${String(sequence).padStart(2, "0")}.000Z`;
cardA.hass = hass;
cardB.hass = hass;
assert.equal(cardA._draftMinutes, 35);
assert.equal(cardB._draftMinutes, 35);
assert.equal(cardA._draftAction, "turn_off");
assert.equal(cardB._draftAction, "turn_off");

// Customization: presets, ring, flat style, RGB colors and hidden sections.
const custom = new Card();
custom.setConfig({
  entity: statusEntity,
  quick_times: [15, 30, 60, 120],
  progress_style: "ring",
  time_format: "text",
  visual_style: "flat",
  color_turn_off: [250, 100, 30],
  color_start: [30, 180, 90],
  color_timer_active: [50, 100, 220],
  color_cancel: [220, 55, 55],
  color_inactive: [120, 120, 120],
  color_progress: [40, 120, 240],
  color_quick: [100, 100, 100],
  color_quick_selected: [120, 70, 210],
  show_target_state: false,
  show_status: false,
});
custom.hass = hass;
assert.match(custom.shadowRoot.innerHTML, /style-flat/);
assert.match(custom.shadowRoot.innerHTML, /progress-ring/);
assert.match(custom.shadowRoot.innerHTML, /ring-wrap/);
assert.match(custom.shadowRoot.innerHTML, /data-quick-minutes="15"/);
assert.match(custom.shadowRoot.innerHTML, /--set-custom-off:rgb\(250 100 30\)/);
assert.match(custom.shadowRoot.innerHTML, /--set-custom-start:rgb\(30 180 90\)/);
assert.match(custom.shadowRoot.innerHTML, /--set-custom-timer-active:rgb\(50 100 220\)/);
assert.match(custom.shadowRoot.innerHTML, /--set-custom-quick-selected:rgb\(120 70 210\)/);
// Regression 0.2.2: custom color variables and their derived variables must live
// on the same ha-card scope. In 0.2.1 the derived variables were declared on
// :host, so editor-selected colors existed in markup but could not affect the card.
assert.match(custom.shadowRoot.innerHTML, /\.timer-card \{[\s\S]*--set-accent-on: var\(--set-custom-on/);
assert.doesNotMatch(custom.shadowRoot.innerHTML, /:host \{[\s\S]{0,300}--set-accent-on:/);
assert.doesNotMatch(custom.shadowRoot.innerHTML, /class="target-state"/);
assert.doesNotMatch(custom.shadowRoot.innerHTML, /class="status-message/);

// Fixed action does not show the selector. It is applied to the backend immediately before start.
states[statusEntity].state = "idle";
states[statusEntity].attributes.target_entity_state = "on";
states[statusEntity].attributes.end_action = "turn_on";
sequence += 1;
states[statusEntity].last_updated = `2026-08-07T05:02:${String(sequence).padStart(2, "0")}.000Z`;
const fixedOff = new Card();
fixedOff.setConfig({ entity: statusEntity, action_mode: "turn_off", progress_style: "time", visual_style: "minimal" });
fixedOff.hass = hass;
assert.doesNotMatch(fixedOff.shadowRoot.innerHTML, /id="turn-on"/);
assert.doesNotMatch(fixedOff.shadowRoot.innerHTML, /id="turn-off"/);
assert.match(fixedOff.shadowRoot.innerHTML, /style-minimal/);
assert.match(fixedOff.shadowRoot.innerHTML, /progress-time/);
assert.equal(fixedOff._localCanStart(), true);
const beforeFixedStart = serviceCalls.length;
await fixedOff._start();
const fixedCalls = serviceCalls.slice(beforeFixedStart);
assert.equal(fixedCalls[0].service, "set_values");
assert.equal(fixedCalls[0].data.end_action, "turn_off");
assert.equal(fixedCalls[1].service, "start");

// Visibility controls can create a display-light card, but Start/Cancel remain mandatory.
states[statusEntity].state = "idle";
const hidden = new Card();
hidden.setConfig({
  entity: statusEntity,
  show_header: false,
  show_action_selector: false,
  show_duration_controls: false,
  show_quick_times: false,
  show_progress: false,
  show_status: false,
  // Legacy 0.2.0 setting must no longer hide the essential controls.
  show_footer: false,
});
hidden.hass = hass;
assert.doesNotMatch(hidden.shadowRoot.innerHTML, /<header>/);
assert.doesNotMatch(hidden.shadowRoot.innerHTML, /action-section/);
assert.doesNotMatch(hidden.shadowRoot.innerHTML, /duration-section/);
assert.doesNotMatch(hidden.shadowRoot.innerHTML, /<section class="progress-section">/);
assert.match(hidden.shadowRoot.innerHTML, /<footer>/);
assert.match(hidden.shadowRoot.innerHTML, /id="start"/);
assert.match(hidden.shadowRoot.innerHTML, /id="cancel"/);

assert.ok(serviceCalls.some((call) => call.service === "set_values" && call.data.duration_minutes === 90));
assert.ok(serviceCalls.some((call) => call.service === "set_values" && call.data.end_action === "turn_on"));
console.log("Smart Entity Timer Card 0.2.2 tests passed.");
