import assert from "node:assert/strict";

class MockShadowRoot {
  constructor() {
    this.innerHTML = "";
  }
  getElementById() {
    return null;
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
assert.equal(module.CARD_VERSION, "0.1.1");
assert.equal(module.formatClock(3661), "01:01:01");
assert.equal(module.targetReached("light.test", "off", "turn_off"), true);
assert.equal(module.targetReached("climate.test", "cool", "turn_on"), true);
assert.ok(customElements.get("smart-entity-timer-card"));
assert.equal(window.customCards.length, 1);

const statusEntity = "sensor.luz_del_bano_estado";
const states = {
  [statusEntity]: {
    state: "idle",
    last_updated: "2026-08-06T12:00:00.000Z",
    last_changed: "2026-08-06T12:00:00.000Z",
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
      companion_entities: {
        duration: "number.luz_del_bano_duracion",
        action: "select.luz_del_bano_accion",
        start: "button.luz_del_bano_iniciar",
        cancel: "button.luz_del_bano_cancelar",
      },
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
    status.last_updated = `2026-08-06T12:00:${String(sequence).padStart(2, "0")}.000Z`;
  },
};

const Card = customElements.get("smart-entity-timer-card");
const cardA = new Card();
const cardB = new Card();
cardA.setConfig({ entity: statusEntity });
cardB.setConfig({ entity: statusEntity });
cardA.hass = hass;
cardB.hass = hass;

assert.match(cardA.shadowRoot.innerHTML, /Luz del baño/);
assert.match(cardA.shadowRoot.innerHTML, /Iniciar/);
assert.equal(cardA._draftMinutes, 60);
assert.equal(cardB._draftMinutes, 60);

// A duration change is written to the backend and another open card follows
// the authoritative status sensor rather than keeping a permanent local copy.
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
assert.equal(cardA._pendingAction, undefined);

// External change from a different panel/device is immediately reconciled.
states[statusEntity].attributes.duration_minutes = 35;
states[statusEntity].attributes.duration_seconds = 2100;
states[statusEntity].attributes.end_action = "turn_off";
sequence += 1;
states[statusEntity].last_updated = `2026-08-06T12:01:${String(sequence).padStart(2, "0")}.000Z`;
cardA.hass = hass;
cardB.hass = hass;
assert.equal(cardA._draftMinutes, 35);
assert.equal(cardB._draftMinutes, 35);
assert.equal(cardA._draftAction, "turn_off");
assert.equal(cardB._draftAction, "turn_off");

assert.ok(serviceCalls.some((call) => call.service === "set_values" && call.data.duration_minutes === 90));
assert.ok(serviceCalls.some((call) => call.service === "set_values" && call.data.end_action === "turn_on"));
console.log("Smart Entity Timer Card synchronization smoke tests passed.");
