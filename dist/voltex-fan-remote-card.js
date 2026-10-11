/* Voltex CFB five-speed remote card for Home Assistant.
 * Copy to /config/www/ and register /local/voltex-fan-remote-card.js as a
 * JavaScript module dashboard resource.
 */

const VOLTEX_BUTTONS = [
  ["on_entity", "ON"],
  ["off_entity", "OFF"],
  ["speed_1_entity", "Speed 1"],
  ["speed_2_entity", "Speed 2"],
  ["speed_3_entity", "Speed 3"],
  ["speed_4_entity", "Speed 4"],
  ["speed_5_entity", "Speed 5"],
  ["reverse_entity", "Reverse"],
  ["timer_1h_entity", "1 hour"],
  ["timer_2h_entity", "2 hours"],
  ["timer_4h_entity", "4 hours"],
];

const VOLTEX_STYLES = `
  :host {
    display: block;
  }

  ha-card {
    padding: 18px 14px 22px;
    overflow: hidden;
  }

  .title {
    margin: 0 0 14px;
    color: var(--primary-text-color);
    font-size: 1.1rem;
    font-weight: 500;
    text-align: center;
  }

  .remote {
    position: relative;
    box-sizing: border-box;
    width: min(100%, 270px);
    height: 510px;
    margin: 0 auto;
    padding: 42px 27px 28px;
    border: 1px solid rgba(90, 90, 90, 0.18);
    border-radius: 24px 24px 18px 18px;
    background:
      linear-gradient(90deg, rgba(0, 0, 0, 0.035), transparent 11%, transparent 88%, rgba(0, 0, 0, 0.045)),
      #fafafa;
    box-shadow: 0 12px 25px rgba(0, 0, 0, 0.18), inset 0 1px 2px #fff;
    color: #242424;
    user-select: none;
  }

  .power-row,
  .timer-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 52px;
  }

  .timer-row {
    grid-template-columns: repeat(3, 1fr);
    gap: 7px;
    margin-top: 30px;
  }

  button {
    min-width: 0;
    min-height: 44px;
    border: 1px solid #c4c4c4;
    border-radius: 8px;
    background: linear-gradient(#fff, #ececec);
    box-shadow: 0 2px 3px rgba(0, 0, 0, 0.18);
    color: #222;
    font: 600 15px/1 sans-serif;
    cursor: pointer;
    touch-action: manipulation;
    transition: transform 80ms ease, box-shadow 80ms ease, opacity 80ms ease;
  }

  button:hover:not(:disabled) {
    background: #fff;
  }

  button:active:not(:disabled),
  button.pressed {
    transform: translateY(2px);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.24);
  }

  button:focus-visible {
    outline: 3px solid var(--primary-color, #03a9f4);
    outline-offset: 2px;
  }

  button:disabled {
    border-style: dashed;
    opacity: 0.32;
    cursor: default;
  }

  .speed-pad {
    position: relative;
    width: 202px;
    height: 202px;
    margin: 33px auto 0;
  }

  .speed-pad button {
    position: absolute;
    width: 64px;
    height: 64px;
    border-radius: 32px;
    font-size: 18px;
  }

  .speed-3 { top: 0; left: 69px; }
  .speed-2 { top: 42px; left: 7px; }
  .speed-4 { top: 42px; right: 7px; }
  .speed-1 { bottom: 15px; left: 25px; }
  .speed-5 { right: 25px; bottom: 15px; }

  .speed-pad .reverse {
    top: 69px;
    left: 69px;
    z-index: 2;
    border-color: #aaa;
    font-size: 28px;
    font-weight: 400;
  }

  .timer-row button {
    min-height: 46px;
    font-size: 14px;
  }

  .brand {
    position: absolute;
    right: 0;
    bottom: 51px;
    left: 0;
    font: italic 700 27px/1 Arial, sans-serif;
    letter-spacing: -2px;
    text-align: center;
  }

  .status {
    position: absolute;
    right: 24px;
    bottom: 19px;
    left: 24px;
    min-height: 15px;
    color: #a32626;
    font: 12px/1.2 sans-serif;
    text-align: center;
  }

  @media (max-width: 350px) {
    ha-card { padding-right: 6px; padding-left: 6px; }
    .remote { transform-origin: top center; }
  }
`;

class VoltexFanRemoteCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("voltex-fan-remote-card-editor");
  }

  static getStubConfig() {
    return { title: "Fan Remote" };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._rendered = false;
  }

  setConfig(config) {
    if (!config || typeof config !== "object") {
      throw new Error("Invalid Voltex fan remote configuration");
    }
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  getCardSize() {
    return 8;
  }

  _button(key, label, className = "") {
    const entityId = this._config[key];
    const disabled = !entityId;
    const title = disabled ? `${label}: choose an entity in the card editor` : `${label}: ${entityId}`;
    return `<button class="${className}" data-key="${key}" title="${this._escape(title)}" ` +
      `aria-label="${this._escape(title)}"${disabled ? " disabled" : ""}>${label}</button>`;
  }

  _escape(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
    })[character]);
  }

  _render() {
    if (!this.shadowRoot) return;
    const title = this._config.title === false ? "" : (this._config.title || "Fan Remote");
    this.shadowRoot.innerHTML = `
      <style>${VOLTEX_STYLES}</style>
      <ha-card>
        ${title ? `<h1 class="title">${this._escape(title)}</h1>` : ""}
        <div class="remote">
          <div class="power-row">
            ${this._button("on_entity", "ON")}
            ${this._button("off_entity", "OFF")}
          </div>
          <div class="speed-pad" aria-label="Fan speeds">
            ${this._button("speed_3_entity", "3", "speed-3")}
            ${this._button("speed_2_entity", "2", "speed-2")}
            ${this._button("speed_4_entity", "4", "speed-4")}
            ${this._button("speed_1_entity", "1", "speed-1")}
            ${this._button("speed_5_entity", "5", "speed-5")}
            ${this._button("reverse_entity", "↻", "reverse")}
          </div>
          <div class="timer-row">
            ${this._button("timer_1h_entity", "1H")}
            ${this._button("timer_2h_entity", "2H")}
            ${this._button("timer_4h_entity", "4H")}
          </div>
          <div class="brand">VOLTEX</div>
          <div class="status" role="status" aria-live="polite"></div>
        </div>
      </ha-card>`;
    this.shadowRoot.querySelectorAll("button[data-key]").forEach((button) => {
      button.addEventListener("click", () => this._press(button));
    });
    this._rendered = true;
  }

  async _press(button) {
    const entityId = this._config[button.dataset.key];
    if (!entityId || !this._hass) return;
    const status = this.shadowRoot.querySelector(".status");
    button.classList.add("pressed");
    status.textContent = "";
    try {
      await this._hass.callService("button", "press", { entity_id: entityId });
    } catch (error) {
      status.textContent = `Could not press ${entityId}`;
    } finally {
      window.setTimeout(() => button.classList.remove("pressed"), 140);
    }
  }
}

class VoltexFanRemoteCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    const needsRender = !this._hass;
    this._hass = hass;
    if (needsRender) this._render();
  }

  _escape(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
    })[character]);
  }

  _entities() {
    if (!this._hass) return [];
    return Object.values(this._hass.states)
      .filter((state) => state.entity_id.startsWith("button."))
      .sort((a, b) => {
        const aName = a.attributes.friendly_name || a.entity_id;
        const bName = b.attributes.friendly_name || b.entity_id;
        return aName.localeCompare(bName);
      });
  }

  _render() {
    if (!this.shadowRoot) return;
    const entities = this._entities();
    const options = (selected) => [
      `<option value="">Not assigned</option>`,
      ...entities.map((state) => {
        const name = state.attributes.friendly_name || state.entity_id;
        const value = this._escape(state.entity_id);
        return `<option value="${value}"${state.entity_id === selected ? " selected" : ""}>` +
          `${this._escape(name)} (${value})</option>`;
      }),
    ].join("");
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .editor { display: grid; gap: 14px; padding: 8px 0; }
        label { display: grid; gap: 5px; color: var(--primary-text-color); font-size: 14px; }
        input, select {
          box-sizing: border-box;
          width: 100%;
          min-height: 42px;
          padding: 7px 10px;
          border: 1px solid var(--divider-color, #aaa);
          border-radius: 4px;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color, #222);
          font: inherit;
        }
        h3 { margin: 8px 0 0; font-size: 16px; }
        p { margin: -5px 0 0; color: var(--secondary-text-color); font-size: 13px; }
      </style>
      <div class="editor">
        <label>Card title
          <input data-key="title" value="${this._escape(this._config.title || "Fan Remote")}">
        </label>
        <h3>Remote buttons</h3>
        <p>Select the MQTT button entities discovered from the fan controller.</p>
        ${VOLTEX_BUTTONS.map(([key, label]) => `
          <label>${label}
            <select data-key="${key}">${options(this._config[key])}</select>
          </label>`).join("")}
      </div>`;
    this.shadowRoot.querySelectorAll("input, select").forEach((field) => {
      field.addEventListener("change", () => this._change(field));
    });
  }

  _change(field) {
    const config = { ...this._config };
    const value = field.value.trim();
    if (value) config[field.dataset.key] = value;
    else delete config[field.dataset.key];
    this._config = config;
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config },
      bubbles: true,
      composed: true,
    }));
  }
}

if (!customElements.get("voltex-fan-remote-card")) {
  customElements.define("voltex-fan-remote-card", VoltexFanRemoteCard);
}
if (!customElements.get("voltex-fan-remote-card-editor")) {
  customElements.define("voltex-fan-remote-card-editor", VoltexFanRemoteCardEditor);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "voltex-fan-remote-card",
  name: "Voltex Fan Remote",
  description: "A remote control card for the Voltex CFB five-speed fan without a light.",
  preview: true,
});

