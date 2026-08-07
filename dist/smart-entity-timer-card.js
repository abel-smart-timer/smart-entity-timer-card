/*
 * Smart Entity Timer Card
 * Copyright (c) 2026 Abel Smart Timer contributors
 * MIT License
 */

const CARD_VERSION = "0.1.1";
const MIN_CARD_API_VERSION = 2;
const DOMAIN = "smart_entity_timer";
const ACTION_TURN_ON = "turn_on";
const ACTION_TURN_OFF = "turn_off";
const STATUS_ACTIVE = "active";
const STATUS_EXECUTING = "executing";
const STATUS_ERROR = "error";
const RESULT_VISIBLE_MS = 30000;

const I18N = {
  es: {
    card_name: "Temporizador inteligente",
    setup_title: "Configura la tarjeta",
    setup_text: "Selecciona la entidad «Estado del temporizador» creada por Smart Entity Timer.",
    entity_missing: "No se encontró la entidad configurada.",
    incompatible: "La entidad seleccionada no pertenece a una versión compatible de Smart Entity Timer.",
    target: "Entidad",
    target_state: "Estado actual",
    action: "Acción al finalizar",
    turn_on: "Encender",
    turn_off: "Apagar",
    duration: "Duración",
    hours: "h",
    minutes: "min",
    decrement: "Restar {value} min",
    increment: "Sumar {value} min",
    remaining: "Tiempo restante",
    programmed: "Tiempo programado",
    idle: "Sin temporizador activo",
    active: "Temporizador activo",
    executing: "Ejecutando acción…",
    restoring: "Restaurando temporizador…",
    error: "Error del temporizador",
    ready_on: "Listo para encender {name}",
    ready_off: "Listo para apagar {name}",
    already_on: "{name} ya está encendido",
    already_off: "{name} ya está apagado",
    unavailable: "{name} no está disponible",
    start: "Iniciar",
    timer_on: "Timer ON",
    cancel: "Cancelar",
    inactive: "Inactivo",
    select_on: "Seleccionar encendido",
    select_off: "Seleccionar apagado",
    open_more_info: "Abrir información de la entidad",
    service_error: "No se pudo completar la operación: {message}",
    api_required: "La tarjeta requiere card_api_version {value} o posterior.",
    last_completed: "Temporizador completado",
    last_cancelled: "Temporizador cancelado",
    last_auto_cancelled: "Cancelado automáticamente: el objetivo se alcanzó antes",
    last_skipped: "Acción omitida por seguridad",
    last_error: "La última operación terminó con error",
    unknown_result: "Última operación actualizada",
    status_on: "Encendido",
    status_off: "Apagado",
    status_unavailable: "No disponible",
  },
  en: {
    card_name: "Smart Entity Timer",
    setup_title: "Configure the card",
    setup_text: "Select the Timer status entity created by Smart Entity Timer.",
    entity_missing: "The configured entity was not found.",
    incompatible: "The selected entity is not from a compatible Smart Entity Timer version.",
    target: "Entity",
    target_state: "Current state",
    action: "Action at finish",
    turn_on: "Turn on",
    turn_off: "Turn off",
    duration: "Duration",
    hours: "h",
    minutes: "min",
    decrement: "Subtract {value} min",
    increment: "Add {value} min",
    remaining: "Time remaining",
    programmed: "Programmed time",
    idle: "No active timer",
    active: "Timer active",
    executing: "Executing action…",
    restoring: "Restoring timer…",
    error: "Timer error",
    ready_on: "Ready to turn on {name}",
    ready_off: "Ready to turn off {name}",
    already_on: "{name} is already on",
    already_off: "{name} is already off",
    unavailable: "{name} is unavailable",
    start: "Start",
    timer_on: "Timer ON",
    cancel: "Cancel",
    inactive: "Inactive",
    select_on: "Select turn on",
    select_off: "Select turn off",
    open_more_info: "Open entity information",
    service_error: "The operation could not be completed: {message}",
    api_required: "The card requires card_api_version {value} or later.",
    last_completed: "Timer completed",
    last_cancelled: "Timer cancelled",
    last_auto_cancelled: "Automatically cancelled: target was reached early",
    last_skipped: "Action skipped for safety",
    last_error: "The last operation ended with an error",
    unknown_result: "Last operation updated",
    status_on: "On",
    status_off: "Off",
    status_unavailable: "Unavailable",
  },
};

function languageFor(hass) {
  const language = hass?.language || hass?.locale?.language || navigator?.language || "en";
  return String(language).toLowerCase().startsWith("es") ? "es" : "en";
}

function t(hass, key, replacements = {}) {
  const language = languageFor(hass);
  let value = I18N[language]?.[key] ?? I18N.en[key] ?? key;
  for (const [name, replacement] of Object.entries(replacements)) {
    value = value.replaceAll(`{${name}}`, String(replacement));
  }
  return value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatClock(totalSeconds) {
  const seconds = Math.max(0, Math.ceil(Number(totalSeconds) || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function formatMinutes(totalMinutes, hass) {
  const minutes = Math.max(1, Math.round(Number(totalMinutes) || 1));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder} ${t(hass, "minutes")}`;
  if (remainder === 0) return `${hours} ${t(hass, "hours")}`;
  return `${hours} ${t(hass, "hours")} ${remainder} ${t(hass, "minutes")}`;
}

function entityDomain(entityId) {
  return String(entityId || "").split(".", 1)[0];
}

function stateIsUsable(state) {
  return Boolean(state && !["unknown", "unavailable"].includes(state));
}

function targetReached(entityId, state, action) {
  if (!stateIsUsable(state)) return false;
  const domain = entityDomain(entityId);
  if (action === ACTION_TURN_OFF) {
    if (domain === "media_player") return ["off", "standby"].includes(state);
    return state === "off";
  }
  if (domain === "media_player") return !["off", "standby"].includes(state);
  if (["climate", "water_heater"].includes(domain)) return state !== "off";
  return state === "on";
}

function statusLabel(hass, state) {
  if (!stateIsUsable(state)) return t(hass, "status_unavailable");
  return state === "off" || state === "standby" ? t(hass, "status_off") : t(hass, "status_on");
}


class SmartEntityTimerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = undefined;
    this._config = {};
    this._lastSignature = undefined;
    this._tickInterval = undefined;
    this._resultTimeout = undefined;
    this._resultTimeoutKey = undefined;
    this._pendingReconcileTimeout = undefined;
    this._draftMinutes = 60;
    this._draftAction = ACTION_TURN_OFF;
    this._pendingDuration = undefined;
    this._pendingAction = undefined;
    this._pending = false;
    this._errorMessage = undefined;
  }

  static getStubConfig() {
    return {
      entity: "",
      increment_minutes: 30,
      layout: "auto",
      show_target_state: true,
      show_last_result: true,
    };
  }

  static getConfigForm() {
    const spanish = String(navigator?.language || "en").toLowerCase().startsWith("es");
    const labels = spanish
      ? {
          entity: "Entidad Estado del temporizador",
          name: "Nombre personalizado",
          icon: "Icono",
          increment_minutes: "Incremento de los botones",
          layout: "Diseño",
          show_target_state: "Mostrar estado de la entidad",
          show_last_result: "Mostrar resultado reciente",
        }
      : {
          entity: "Timer status entity",
          name: "Custom name",
          icon: "Icon",
          increment_minutes: "Button increment",
          layout: "Layout",
          show_target_state: "Show target entity state",
          show_last_result: "Show recent result",
        };
    const helpers = spanish
      ? {
          entity: "Selecciona el sensor Estado del temporizador de Smart Entity Timer 0.1.3 o posterior.",
          increment_minutes: "Valor usado por los botones − y +. Puedes introducir cualquier duración manualmente.",
        }
      : {
          entity: "Select the Timer status sensor from Smart Entity Timer 0.1.3 or later.",
          increment_minutes: "Used by the − and + buttons. Any duration can still be entered manually.",
        };

    return {
      schema: [
        {
          name: "entity",
          required: true,
          selector: {
            entity: {
              filter: [{ integration: DOMAIN, domain: "sensor" }],
            },
          },
        },
        {
          type: "grid",
          name: "",
          flatten: true,
          column_min_width: "180px",
          schema: [
            { name: "name", selector: { text: {} } },
            {
              name: "icon",
              selector: { icon: {} },
              context: { icon_entity: "entity" },
            },
            {
              name: "increment_minutes",
              selector: {
                number: {
                  min: 1,
                  max: 1440,
                  step: 1,
                  mode: "box",
                  unit_of_measurement: "min",
                },
              },
            },
            {
              name: "layout",
              selector: { select: { options: ["auto", "compact", "expanded"] } },
            },
            { name: "show_target_state", selector: { boolean: {} } },
            { name: "show_last_result", selector: { boolean: {} } },
          ],
        },
      ],
      computeLabel: (schema) => labels[schema.name],
      computeHelper: (schema) => helpers[schema.name],
      assertConfig: (config) => {
        if (config.entity && entityDomain(config.entity) !== "sensor") {
          throw new Error(spanish ? "La entidad principal debe ser un sensor." : "The main entity must be a sensor.");
        }
      },
    };
  }

  setConfig(config) {
    if (!config || typeof config !== "object") {
      throw new Error("Invalid Smart Entity Timer Card configuration");
    }
    const previousEntity = this._config?.entity;
    this._config = {
      increment_minutes: 30,
      layout: "auto",
      show_target_state: true,
      show_last_result: true,
      ...config,
    };
    if (previousEntity !== this._config.entity) {
      this._lastSignature = undefined;
      this._pendingDuration = undefined;
      this._pendingAction = undefined;
    }
    this._syncDrafts();
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._reconcilePending();
    this._syncDrafts();
    this._updateTicking();
    this._scheduleResultExpiry();

    const signature = this._relevantSignature();
    if (signature !== this._lastSignature) {
      this._lastSignature = signature;
      this._render();
    }
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    this._render();
    this._updateTicking();
  }

  disconnectedCallback() {
    this._clearTicking();
    if (this._resultTimeout) clearTimeout(this._resultTimeout);
    this._resultTimeout = undefined;
    if (this._pendingReconcileTimeout) clearTimeout(this._pendingReconcileTimeout);
    this._pendingReconcileTimeout = undefined;
  }

  getCardSize() {
    return this._config.layout === "compact" ? 5 : 6;
  }

  getGridOptions() {
    return {
      rows: this._config.layout === "compact" ? 5 : 6,
      columns: 6,
      min_rows: 5,
      min_columns: 3,
    };
  }

  _statusState() {
    return this._hass?.states?.[this._config.entity];
  }

  _relevantSignature() {
    if (!this._hass) return "no-hass";
    const state = this._statusState();
    return `${this._config.entity}:${state?.state ?? "missing"}:${state?.last_updated ?? ""}:${state?.last_changed ?? ""}`;
  }

  _backendDuration() {
    const minutes = Number(this._statusState()?.attributes?.duration_minutes);
    return Number.isFinite(minutes) && minutes >= 1 ? Math.round(minutes) : undefined;
  }

  _backendAction() {
    const action = this._statusState()?.attributes?.end_action;
    return [ACTION_TURN_ON, ACTION_TURN_OFF].includes(action) ? action : undefined;
  }

  _reconcilePending() {
    const status = this._statusState();
    if (!status) return;
    const now = Date.now();
    const lastUpdated = status.last_updated || status.last_changed || "";

    if (this._pendingDuration) {
      const backend = this._backendDuration();
      const changed = lastUpdated && lastUpdated !== this._pendingDuration.baseline;
      const expired = now - this._pendingDuration.started > 2500;
      if (backend === this._pendingDuration.value || changed || expired) {
        this._pendingDuration = undefined;
      }
    }

    if (this._pendingAction) {
      const backend = this._backendAction();
      const changed = lastUpdated && lastUpdated !== this._pendingAction.baseline;
      const expired = now - this._pendingAction.started > 2500;
      if (backend === this._pendingAction.value || changed || expired) {
        this._pendingAction = undefined;
      }
    }
  }

  _schedulePendingReconcile() {
    if (this._pendingReconcileTimeout) clearTimeout(this._pendingReconcileTimeout);
    this._pendingReconcileTimeout = setTimeout(() => {
      this._pendingReconcileTimeout = undefined;
      this._reconcilePending();
      this._syncDrafts();
      this._render();
    }, 2600);
  }

  _syncDrafts() {
    const status = this._statusState();
    if (!status) return;
    const busy = [STATUS_ACTIVE, STATUS_EXECUTING].includes(status.state);
    const backendDuration = this._backendDuration();
    const backendAction = this._backendAction();

    if (!this._pendingDuration || busy) {
      if (backendDuration !== undefined) this._draftMinutes = backendDuration;
      if (busy) this._pendingDuration = undefined;
    } else {
      this._draftMinutes = this._pendingDuration.value;
    }

    if (!this._pendingAction || busy) {
      if (backendAction !== undefined) this._draftAction = backendAction;
      if (busy) this._pendingAction = undefined;
    } else {
      this._draftAction = this._pendingAction.value;
    }
  }

  _maxDuration() {
    const constraints = this._statusState()?.attributes?.constraints;
    const maxSeconds = Number(constraints?.max_seconds);
    if (Number.isFinite(maxSeconds) && maxSeconds >= 60) {
      return Math.max(1, Math.floor(maxSeconds / 60));
    }
    return 1440;
  }

  _remainingAndProgress() {
    const status = this._statusState();
    const startedAt = parseDate(status?.attributes?.started_at);
    const finishesAt = parseDate(status?.attributes?.finishes_at);
    if (!finishesAt) {
      return {
        remaining: Number(status?.attributes?.remaining_seconds_snapshot) || 0,
        progress: 0,
      };
    }
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((finishesAt.getTime() - now) / 1000));
    const total = startedAt
      ? Math.max(1, (finishesAt.getTime() - startedAt.getTime()) / 1000)
      : Math.max(1, Number(status?.attributes?.duration_seconds) || this._draftMinutes * 60);
    const elapsed = clamp(total - remaining, 0, total);
    return { remaining, progress: clamp((elapsed / total) * 100, 0, 100) };
  }

  _localCanStart() {
    const status = this._statusState();
    if (!status || [STATUS_ACTIVE, STATUS_EXECUTING].includes(status.state)) return false;
    if (this._pending) return false;
    const targetState = status.attributes.target_entity_state;
    const targetEntity = status.attributes.target_entity;
    if (!stateIsUsable(targetState)) return false;
    if (targetReached(targetEntity, targetState, this._draftAction)) return false;
    return this._draftMinutes >= 1 && this._draftMinutes <= this._maxDuration();
  }

  _updateTicking() {
    const status = this._statusState()?.state;
    const shouldTick = [STATUS_ACTIVE, STATUS_EXECUTING].includes(status);
    if (shouldTick && !this._tickInterval) {
      this._tickInterval = setInterval(() => this._render(), 1000);
    } else if (!shouldTick) {
      this._clearTicking();
    }
  }

  _clearTicking() {
    if (this._tickInterval) clearInterval(this._tickInterval);
    this._tickInterval = undefined;
  }

  _scheduleResultExpiry() {
    const lastFinished = this._statusState()?.attributes?.last_finished_at;
    if (!lastFinished || lastFinished === this._resultTimeoutKey) return;
    this._resultTimeoutKey = lastFinished;
    if (this._resultTimeout) clearTimeout(this._resultTimeout);
    const date = parseDate(lastFinished);
    if (!date) return;
    const delay = Math.max(0, date.getTime() + RESULT_VISIBLE_MS - Date.now());
    this._resultTimeout = setTimeout(() => this._render(), delay + 50);
  }

  _recentResult() {
    if (!this._config.show_last_result) return undefined;
    const status = this._statusState();
    const finished = parseDate(status?.attributes?.last_finished_at);
    if (!finished || Date.now() - finished.getTime() > RESULT_VISIBLE_MS) return undefined;
    const result = status.attributes.last_result;
    const keys = {
      completed: "last_completed",
      cancelled: "last_cancelled",
      auto_cancelled: "last_auto_cancelled",
      skipped: "last_skipped",
      error: "last_error",
    };
    return {
      label: t(this._hass, keys[result] || "unknown_result"),
      message: status.attributes.last_message,
      type: result === "error" ? "error" : result === "completed" ? "success" : "info",
    };
  }

  _statusMessage(status, targetName, targetState, targetEntity) {
    if (this._errorMessage) return { type: "error", text: this._errorMessage };
    if (status.attributes.restore_pending) return { type: "info", text: t(this._hass, "restoring") };
    if (status.state === STATUS_EXECUTING) return { type: "info", text: t(this._hass, "executing") };
    if (status.state === STATUS_ERROR) {
      return { type: "error", text: status.attributes.last_message || t(this._hass, "error") };
    }
    if (status.state === STATUS_ACTIVE) return { type: "active", text: t(this._hass, "active") };

    const recent = this._recentResult();
    if (recent) return { type: recent.type, text: recent.message || recent.label, label: recent.label };
    if (!stateIsUsable(targetState)) {
      return { type: "warning", text: t(this._hass, "unavailable", { name: targetName }) };
    }
    if (targetReached(targetEntity, targetState, this._draftAction)) {
      return {
        type: "muted",
        text: t(this._hass, this._draftAction === ACTION_TURN_ON ? "already_on" : "already_off", { name: targetName }),
      };
    }
    return {
      type: "ready",
      text: t(this._hass, this._draftAction === ACTION_TURN_ON ? "ready_on" : "ready_off", { name: targetName }),
    };
  }

  _render() {
    if (!this.shadowRoot) return;
    if (!this._config.entity) {
      this.shadowRoot.innerHTML = `${this._styles()}<ha-card><div class="setup"><div class="setup-icon">⏱</div><strong>${escapeHtml(t(this._hass, "setup_title"))}</strong><span>${escapeHtml(t(this._hass, "setup_text"))}</span></div></ha-card>`;
      return;
    }
    if (!this._hass) {
      this.shadowRoot.innerHTML = `${this._styles()}<ha-card><div class="setup"><div class="spinner"></div></div></ha-card>`;
      return;
    }
    const status = this._statusState();
    if (!status) {
      this.shadowRoot.innerHTML = `${this._styles()}<ha-card><div class="setup error-panel"><strong>${escapeHtml(t(this._hass, "entity_missing"))}</strong><code>${escapeHtml(this._config.entity)}</code></div></ha-card>`;
      return;
    }

    const apiVersion = Number(status.attributes.card_api_version);
    if (!Number.isFinite(apiVersion) || apiVersion < MIN_CARD_API_VERSION) {
      this.shadowRoot.innerHTML = `${this._styles()}<ha-card><div class="setup error-panel"><strong>${escapeHtml(t(this._hass, "incompatible"))}</strong><span>${escapeHtml(t(this._hass, "api_required", { value: MIN_CARD_API_VERSION }))}</span></div></ha-card>`;
      return;
    }

    this._syncDrafts();
    this._updateTicking();
    this._scheduleResultExpiry();

    const active = status.state === STATUS_ACTIVE;
    const executing = status.state === STATUS_EXECUTING;
    const busy = active || executing;
    const action = busy ? status.attributes.end_action : this._draftAction;
    const targetName = status.attributes.target_entity_name || status.attributes.target_entity || this._config.entity;
    const targetEntity = status.attributes.target_entity;
    const targetState = status.attributes.target_entity_state;
    const title = this._config.name || targetName || t(this._hass, "card_name");
    const icon = this._config.icon || (action === ACTION_TURN_ON ? "mdi:timer-play-outline" : "mdi:timer-off-outline");
    const increment = clamp(Math.round(Number(this._config.increment_minutes) || 30), 1, 1440);
    const maxDuration = this._maxDuration();
    const displayMinutes = busy ? Number(status.attributes.duration_minutes) || this._draftMinutes : this._draftMinutes;
    const hours = Math.floor(displayMinutes / 60);
    const minutes = displayMinutes % 60;
    const { remaining, progress } = this._remainingAndProgress();
    const canStart = this._localCanStart();
    const canCancel = active && !this._pending;
    const statusMessage = this._statusMessage(status, targetName, targetState, targetEntity);
    const layoutClass = ["compact", "expanded"].includes(this._config.layout) ? this._config.layout : "auto";
    const actionLabel = action === ACTION_TURN_ON ? t(this._hass, "turn_on") : t(this._hass, "turn_off");
    const progressLabel = active ? t(this._hass, "remaining") : t(this._hass, "programmed");
    const progressValue = active ? formatClock(remaining) : formatMinutes(displayMinutes, this._hass);

    this.shadowRoot.innerHTML = `
      ${this._styles()}
      <ha-card class="timer-card ${layoutClass} action-${escapeHtml(action)} status-${escapeHtml(status.state)}">
        <div class="accent"></div>
        <div class="content">
          <header>
            <button class="entity-icon" id="more-info" title="${escapeHtml(t(this._hass, "open_more_info"))}" aria-label="${escapeHtml(t(this._hass, "open_more_info"))}">
              <ha-icon icon="${escapeHtml(icon)}"></ha-icon>
            </button>
            <div class="heading">
              <div class="title">${escapeHtml(title)}</div>
              <div class="subtitle">${escapeHtml(targetName)}</div>
            </div>
            <div class="action-badge"><span class="badge-dot"></span>${escapeHtml(actionLabel)}</div>
          </header>

          ${this._config.show_target_state ? `
            <button class="target-state" id="target-more-info" aria-label="${escapeHtml(t(this._hass, "open_more_info"))}">
              <span>${escapeHtml(t(this._hass, "target_state"))}</span>
              <strong>${escapeHtml(statusLabel(this._hass, targetState))}</strong>
              <span class="raw-state">${escapeHtml(targetState ?? "unavailable")}</span>
            </button>` : ""}

          <section class="action-section">
            <div class="section-label">${escapeHtml(t(this._hass, "action"))}</div>
            <div class="segmented" role="group" aria-label="${escapeHtml(t(this._hass, "action"))}">
              <button id="turn-on" class="segment ${action === ACTION_TURN_ON ? "selected" : ""}" ${busy || this._pending ? "disabled" : ""} aria-label="${escapeHtml(t(this._hass, "select_on"))}">
                <ha-icon icon="mdi:power-plug-outline"></ha-icon><span>${escapeHtml(t(this._hass, "turn_on"))}</span>
              </button>
              <button id="turn-off" class="segment ${action === ACTION_TURN_OFF ? "selected" : ""}" ${busy || this._pending ? "disabled" : ""} aria-label="${escapeHtml(t(this._hass, "select_off"))}">
                <ha-icon icon="mdi:power-plug-off-outline"></ha-icon><span>${escapeHtml(t(this._hass, "turn_off"))}</span>
              </button>
            </div>
          </section>

          <section class="duration-section">
            <div class="section-label">${escapeHtml(t(this._hass, "duration"))}</div>
            <div class="duration-control">
              <button id="decrement" class="step-button" ${busy || this._pending || displayMinutes <= 1 ? "disabled" : ""} aria-label="${escapeHtml(t(this._hass, "decrement", { value: increment }))}">
                <ha-icon icon="mdi:minus"></ha-icon><span>${escapeHtml(increment)} min</span>
              </button>
              <div class="time-inputs ${busy ? "locked" : ""}">
                <label><input id="hours" type="number" inputmode="numeric" min="0" max="168" value="${escapeHtml(hours)}" ${busy || this._pending ? "disabled" : ""}><span>${escapeHtml(t(this._hass, "hours"))}</span></label>
                <div class="time-separator">:</div>
                <label><input id="minutes" type="number" inputmode="numeric" min="0" max="59" value="${escapeHtml(minutes)}" ${busy || this._pending ? "disabled" : ""}><span>${escapeHtml(t(this._hass, "minutes"))}</span></label>
              </div>
              <button id="increment" class="step-button" ${busy || this._pending || displayMinutes >= maxDuration ? "disabled" : ""} aria-label="${escapeHtml(t(this._hass, "increment", { value: increment }))}">
                <ha-icon icon="mdi:plus"></ha-icon><span>${escapeHtml(increment)} min</span>
              </button>
            </div>
          </section>

          <section class="progress-section">
            <div class="progress-heading"><span>${escapeHtml(progressLabel)}</span><strong>${escapeHtml(progressValue)}</strong></div>
            <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${escapeHtml(active ? Math.round(progress) : 0)}">
              <div class="progress-fill" style="width:${escapeHtml(active ? progress : 0)}%"></div>
            </div>
            <div class="status-message ${escapeHtml(statusMessage.type)}">
              <span class="status-indicator"></span>
              <div><strong>${escapeHtml(statusMessage.label || (active ? t(this._hass, "active") : t(this._hass, "idle")))}</strong><span>${escapeHtml(statusMessage.text)}</span></div>
            </div>
          </section>

          <footer>
            <button id="start" class="primary-action" ${canStart ? "" : "disabled"}>
              <ha-icon icon="${active ? "mdi:timer-sand" : "mdi:play"}"></ha-icon>
              <span>${escapeHtml(active || executing ? t(this._hass, "timer_on") : t(this._hass, "start"))}</span>
            </button>
            <button id="cancel" class="cancel-action" ${canCancel ? "" : "disabled"}>
              <ha-icon icon="${canCancel ? "mdi:close-circle-outline" : "mdi:timer-off-outline"}"></ha-icon>
              <span>${escapeHtml(canCancel ? t(this._hass, "cancel") : t(this._hass, "inactive"))}</span>
            </button>
          </footer>
        </div>
      </ha-card>`;

    this._bindEvents();
  }

  _bindEvents() {
    const byId = (id) => this.shadowRoot?.getElementById(id);
    byId("more-info")?.addEventListener("click", () => this._showMoreInfo());
    byId("target-more-info")?.addEventListener("click", () => this._showMoreInfo());
    byId("turn-on")?.addEventListener("click", () => this._setAction(ACTION_TURN_ON));
    byId("turn-off")?.addEventListener("click", () => this._setAction(ACTION_TURN_OFF));
    byId("decrement")?.addEventListener("click", () => this._adjustDuration(-1));
    byId("increment")?.addEventListener("click", () => this._adjustDuration(1));
    byId("start")?.addEventListener("click", () => this._start());
    byId("cancel")?.addEventListener("click", () => this._cancel());

    const hours = byId("hours");
    const minutes = byId("minutes");
    const updateDraft = () => {
      const total = Math.max(1, (Number(hours?.value) || 0) * 60 + (Number(minutes?.value) || 0));
      this._draftMinutes = clamp(Math.round(total), 1, this._maxDuration());
    };
    const commit = () => {
      updateDraft();
      this._setDuration(this._draftMinutes);
    };
    hours?.addEventListener("input", updateDraft);
    minutes?.addEventListener("input", updateDraft);
    hours?.addEventListener("change", commit);
    minutes?.addEventListener("change", commit);
  }

  _showMoreInfo() {
    const entityId = this._statusState()?.attributes?.target_entity;
    if (!entityId) return;
    const event = new CustomEvent("hass-more-info", {
      bubbles: true,
      composed: true,
      detail: { entityId },
    });
    this.dispatchEvent(event);
  }

  async _setAction(action) {
    if (![ACTION_TURN_ON, ACTION_TURN_OFF].includes(action)) return;
    const status = this._statusState();
    const baseline = status?.last_updated || status?.last_changed || "";
    this._draftAction = action;
    this._pendingAction = { value: action, baseline, started: Date.now() };
    this._pending = true;
    this._errorMessage = undefined;
    this._render();
    try {
      await this._hass.callService(DOMAIN, "set_values", {
        entity_id: this._config.entity,
        end_action: action,
      });
    } catch (error) {
      this._pendingAction = undefined;
      this._showServiceError(error);
    } finally {
      this._pending = false;
      this._reconcilePending();
      this._schedulePendingReconcile();
      this._syncDrafts();
      this._render();
    }
  }

  async _setDuration(minutes) {
    const value = clamp(Math.round(minutes), 1, this._maxDuration());
    const status = this._statusState();
    const baseline = status?.last_updated || status?.last_changed || "";
    this._draftMinutes = value;
    this._pendingDuration = { value, baseline, started: Date.now() };
    this._pending = true;
    this._errorMessage = undefined;
    this._render();
    try {
      await this._hass.callService(DOMAIN, "set_values", {
        entity_id: this._config.entity,
        duration_minutes: value,
      });
    } catch (error) {
      this._pendingDuration = undefined;
      this._showServiceError(error);
    } finally {
      this._pending = false;
      this._reconcilePending();
      this._schedulePendingReconcile();
      this._syncDrafts();
      this._render();
    }
  }

  _adjustDuration(direction) {
    const increment = clamp(Math.round(Number(this._config.increment_minutes) || 30), 1, 1440);
    this._setDuration(this._draftMinutes + direction * increment);
  }

  async _start() {
    if (!this._localCanStart()) return;
    this._pending = true;
    this._errorMessage = undefined;
    this._render();
    try {
      await this._hass.callService(DOMAIN, "start", { entity_id: this._config.entity });
    } catch (error) {
      this._showServiceError(error);
    } finally {
      this._pending = false;
      this._render();
    }
  }

  async _cancel() {
    const status = this._statusState();
    if (status?.state !== STATUS_ACTIVE) return;
    this._pending = true;
    this._errorMessage = undefined;
    this._render();
    try {
      await this._hass.callService(DOMAIN, "cancel", { entity_id: this._config.entity });
    } catch (error) {
      this._showServiceError(error);
    } finally {
      this._pending = false;
      this._render();
    }
  }

  _showServiceError(error) {
    const message = error?.message || String(error || "unknown error");
    this._errorMessage = t(this._hass, "service_error", { message });
    console.error("Smart Entity Timer Card service error", error);
    this._render();
  }

  _styles() {
    return `<style>
      :host {
        display: block;
        --set-accent-on: var(--success-color, #2eaf68);
        --set-accent-off: var(--warning-color, #e8843d);
        --set-accent: var(--set-accent-off);
        --set-surface: color-mix(in srgb, var(--primary-text-color) 5%, transparent);
        --set-border: color-mix(in srgb, var(--primary-text-color) 12%, transparent);
        --set-muted: var(--secondary-text-color);
        container-type: inline-size;
      }
      * { box-sizing: border-box; }
      ha-card {
        position: relative;
        overflow: hidden;
        color: var(--primary-text-color);
        background: var(--ha-card-background, var(--card-background-color));
        border-radius: var(--ha-card-border-radius, 16px);
        border: var(--ha-card-border-width, 0) solid var(--ha-card-border-color, transparent);
        box-shadow: var(--ha-card-box-shadow, var(--material-shadow-elevation-2dp));
      }
      .action-turn_on { --set-accent: var(--set-accent-on); }
      .action-turn_off { --set-accent: var(--set-accent-off); }
      .accent {
        height: 5px;
        background: linear-gradient(90deg, var(--set-accent), var(--primary-color));
      }
      .content { padding: 18px; display: grid; gap: 16px; }
      header { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px; }
      .entity-icon {
        width: 48px; height: 48px; border: 0; border-radius: 15px; cursor: pointer;
        display: grid; place-items: center; color: var(--set-accent);
        background: color-mix(in srgb, var(--set-accent) 14%, transparent);
      }
      .entity-icon ha-icon { --mdc-icon-size: 27px; }
      .heading { min-width: 0; }
      .title { font-size: 1.13rem; line-height: 1.25; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .subtitle { margin-top: 3px; color: var(--set-muted); font-size: .84rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .action-badge {
        display: inline-flex; align-items: center; gap: 7px; padding: 7px 10px; border-radius: 999px;
        background: color-mix(in srgb, var(--set-accent) 14%, transparent); color: var(--set-accent);
        font-size: .75rem; font-weight: 750; text-transform: uppercase; letter-spacing: .04em;
      }
      .badge-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; box-shadow: 0 0 0 4px color-mix(in srgb, currentColor 14%, transparent); }
      .target-state {
        width: 100%; border: 1px solid var(--set-border); border-radius: 12px; background: var(--set-surface);
        color: inherit; cursor: pointer; padding: 10px 12px; display: grid; grid-template-columns: 1fr auto auto; gap: 10px; align-items: center; text-align: left;
      }
      .target-state > span:first-child { color: var(--set-muted); font-size: .8rem; }
      .target-state strong { font-size: .83rem; }
      .raw-state { color: var(--set-muted); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .72rem; padding: 3px 6px; border-radius: 6px; background: color-mix(in srgb, var(--primary-text-color) 7%, transparent); }
      section { display: grid; gap: 8px; }
      .section-label { color: var(--set-muted); font-size: .78rem; font-weight: 650; letter-spacing: .02em; }
      .segmented { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 5px; border-radius: 14px; background: var(--set-surface); border: 1px solid var(--set-border); }
      .segment {
        border: 0; min-height: 44px; border-radius: 10px; background: transparent; color: var(--set-muted); cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 8px; font: inherit; font-size: .9rem; font-weight: 650; transition: .18s ease;
      }
      .segment.selected { background: var(--ha-card-background, var(--card-background-color)); color: var(--set-accent); box-shadow: 0 3px 12px color-mix(in srgb, black 12%, transparent); }
      .segment:disabled { cursor: default; opacity: .65; }
      .duration-control { display: grid; grid-template-columns: minmax(88px, 1fr) minmax(150px, 1.45fr) minmax(88px, 1fr); gap: 10px; align-items: stretch; }
      .step-button {
        min-height: 62px; border: 1px solid var(--set-border); border-radius: 14px; background: var(--set-surface); color: var(--primary-text-color);
        cursor: pointer; display: flex; flex-direction: column; gap: 3px; align-items: center; justify-content: center; font: inherit; font-weight: 650;
      }
      .step-button ha-icon { color: var(--set-accent); }
      .step-button span { font-size: .72rem; color: var(--set-muted); }
      button:disabled { opacity: .45; cursor: default; }
      .time-inputs {
        min-height: 62px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; border: 1px solid color-mix(in srgb, var(--set-accent) 45%, var(--set-border));
        border-radius: 15px; background: color-mix(in srgb, var(--set-accent) 7%, transparent); padding: 7px 10px;
      }
      .time-inputs label { display: grid; justify-items: center; gap: 1px; }
      .time-inputs input {
        width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--primary-text-color); text-align: center;
        font: inherit; font-size: 1.65rem; font-weight: 760; line-height: 1; appearance: textfield;
      }
      .time-inputs input::-webkit-inner-spin-button { appearance: none; }
      .time-inputs label span { color: var(--set-muted); font-size: .67rem; font-weight: 650; }
      .time-separator { font-size: 1.5rem; font-weight: 800; color: var(--set-accent); align-self: start; padding-top: 2px; }
      .time-inputs.locked { opacity: .75; }
      .progress-section { padding: 13px; border: 1px solid var(--set-border); background: var(--set-surface); border-radius: 15px; }
      .progress-heading { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
      .progress-heading span { color: var(--set-muted); font-size: .8rem; }
      .progress-heading strong { font-variant-numeric: tabular-nums; font-size: 1.05rem; letter-spacing: .02em; }
      .progress-track { height: 9px; overflow: hidden; border-radius: 999px; background: color-mix(in srgb, var(--primary-text-color) 10%, transparent); }
      .progress-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--set-accent), var(--primary-color)); transition: width .35s linear; }
      .status-message { display: grid; grid-template-columns: auto 1fr; gap: 9px; align-items: start; padding-top: 2px; }
      .status-indicator { width: 8px; height: 8px; margin-top: 5px; border-radius: 50%; background: var(--set-muted); }
      .status-message > div { display: grid; gap: 1px; min-width: 0; }
      .status-message strong { font-size: .76rem; }
      .status-message span:last-child { color: var(--set-muted); font-size: .75rem; overflow-wrap: anywhere; }
      .status-message.active .status-indicator, .status-message.ready .status-indicator { background: var(--set-accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--set-accent) 14%, transparent); }
      .status-message.success .status-indicator { background: var(--success-color, #2eaf68); }
      .status-message.warning .status-indicator { background: var(--warning-color, #e8843d); }
      .status-message.error .status-indicator { background: var(--error-color, #db4437); }
      footer { display: grid; grid-template-columns: 1.3fr 1fr; gap: 10px; }
      footer button {
        min-height: 48px; border-radius: 13px; border: 1px solid transparent; cursor: pointer; display: flex; align-items: center; justify-content: center;
        gap: 8px; font: inherit; font-size: .9rem; font-weight: 720; transition: transform .12s ease, opacity .12s ease;
      }
      footer button:not(:disabled):active, .step-button:not(:disabled):active, .segment:not(:disabled):active { transform: scale(.98); }
      .primary-action { color: var(--text-primary-color, white); background: linear-gradient(135deg, var(--set-accent), color-mix(in srgb, var(--set-accent) 65%, var(--primary-color))); box-shadow: 0 6px 18px color-mix(in srgb, var(--set-accent) 23%, transparent); }
      .cancel-action { color: var(--error-color, #db4437); border-color: color-mix(in srgb, var(--error-color, #db4437) 30%, transparent); background: color-mix(in srgb, var(--error-color, #db4437) 8%, transparent); }
      footer button:disabled { box-shadow: none; filter: grayscale(.25); }
      .setup { min-height: 180px; padding: 26px; display: grid; gap: 10px; place-content: center; justify-items: center; text-align: center; color: var(--secondary-text-color); }
      .setup strong { color: var(--primary-text-color); font-size: 1rem; }
      .setup-icon { font-size: 2rem; }
      .setup code { padding: 5px 8px; border-radius: 7px; background: var(--set-surface); }
      .error-panel strong { color: var(--error-color); }
      .spinner { width: 28px; height: 28px; border: 3px solid var(--set-border); border-top-color: var(--primary-color); border-radius: 50%; animation: spin .8s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      @container (max-width: 410px) {
        .content { padding: 15px; gap: 14px; }
        header { grid-template-columns: auto minmax(0,1fr); }
        .action-badge { grid-column: 1 / -1; justify-self: stretch; justify-content: center; }
        .target-state { grid-template-columns: 1fr auto; }
        .raw-state { display: none; }
        .duration-control { grid-template-columns: 1fr 1fr; }
        .time-inputs { grid-column: 1 / -1; grid-row: 1; }
        footer { grid-template-columns: 1fr; }
      }
      .compact .target-state, .compact .section-label { display: none; }
      .compact .content { gap: 12px; }
      .compact .progress-section { padding: 11px; }
      .expanded .content { padding: 22px; gap: 18px; }
      @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
    </style>`;
  }
}

if (!customElements.get("smart-entity-timer-card")) {
  customElements.define("smart-entity-timer-card", SmartEntityTimerCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "smart-entity-timer-card")) {
  window.customCards.push({
    type: "smart-entity-timer-card",
    name: "Smart Entity Timer Card",
    description: "A visual timer card for the Smart Entity Timer integration.",
    preview: false,
    documentationURL: "https://github.com/abel-smart-timer/smart-entity-timer-card",
    getEntitySuggestion: (hass, entityId) => {
      const state = hass?.states?.[entityId];
      const compatible =
        entityDomain(entityId) === "sensor" &&
        Number(state?.attributes?.card_api_version) >= MIN_CARD_API_VERSION &&
        Boolean(state?.attributes?.backend_version);
      if (!compatible) return null;
      return {
        config: {
          type: "custom:smart-entity-timer-card",
          entity: entityId,
          increment_minutes: 30,
          layout: "auto",
          show_target_state: true,
          show_last_result: true,
        },
      };
    },
  });
}

console.info(
  `%c SMART ENTITY TIMER CARD %c ${CARD_VERSION} `,
  "color: white; background: #5c4bdb; font-weight: 700; padding: 3px 5px; border-radius: 4px 0 0 4px;",
  "color: #5c4bdb; background: #eeeafd; font-weight: 700; padding: 3px 5px; border-radius: 0 4px 4px 0;",
);

export { CARD_VERSION, SmartEntityTimerCard, formatClock, targetReached };
