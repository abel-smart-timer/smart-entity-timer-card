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
assert.equal(module.CARD_VERSION, "0.1.0");
assert.equal(module.formatClock(3661), "01:01:01");
assert.equal(module.targetReached("light.test", "off", "turn_off"), true);
assert.equal(module.targetReached("climate.test", "cool", "turn_on"), true);
assert.ok(customElements.get("smart-entity-timer-card"));
assert.equal(window.customCards.length, 1);

const Card = customElements.get("smart-entity-timer-card");
const card = new Card();
card.setConfig({ entity: "sensor.luz_del_bano_estado" });
card.hass = {
  language: "es",
  connection: {},
  states: {
    "sensor.luz_del_bano_estado": {
      state: "idle",
      last_updated: "2026-08-06T12:00:00Z",
      attributes: {
        card_api_version: 1,
        backend_version: "0.1.2",
        target_entity: "light.luz_del_bano",
        target_entity_name: "Luz del baño",
        target_entity_state: "on",
        end_action: "turn_off",
        duration_minutes: 60,
        duration_seconds: 3600,
      },
    },
  },
  callWS: async () => [],
  callService: async () => undefined,
};
await new Promise((resolve) => setTimeout(resolve, 0));
assert.match(card.shadowRoot.innerHTML, /Luz del baño/);
assert.match(card.shadowRoot.innerHTML, /Iniciar/);
console.log("Smart Entity Timer Card smoke test passed.");
