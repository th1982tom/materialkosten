class MaterialkostenCard extends HTMLElement {
  setConfig(config) { this.config = config || {}; this.attachShadow({mode:"open"}); this._render(); }
  set hass(hass) { this._hass = hass; this._render(); }
  _esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  _render() {
    if (!this.shadowRoot || !this._hass) return;
    const st = this._hass.states;
    const pstate = st["sensor.materialkosten_projekte"];
    const tstate = st["sensor.materialkosten_gesamt"];
    const projects = pstate?.attributes?.projekte || [];
    const total = Number(tstate?.state || 0).toFixed(2);
    this.shadowRoot.innerHTML = `
      <style>
        ha-card{padding:16px} h2{margin:0 0 12px;font-size:20px}
        .total{font-size:28px;font-weight:600;margin-bottom:16px}
        .project{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-top:1px solid var(--divider-color)}
        button{border:0;border-radius:8px;padding:8px 12px;background:var(--primary-color);color:white;cursor:pointer}
        .muted{color:var(--secondary-text-color);font-size:13px}
      </style>
      <ha-card>
        <h2>Materialkosten</h2>
        <div class="total">${total} €</div>
        <button id="new">+ Projekt</button>
        <div style="margin-top:12px">
          ${projects.length ? projects.map(p => `<div class="project">
             <div><b>${this._esc(p.name)}</b><div class="muted">${this._esc(p.customer || "")}</div></div>
             <div><b>${Number(p.kosten || 0).toFixed(2)} €</b></div>
           </div>`).join("") : '<div class="muted" style="margin-top:16px">Noch keine Projekte.</div>'}
        </div>
      </ha-card>`;
    this.shadowRoot.getElementById("new")?.addEventListener("click", () => this._newProject());
  }
  async _newProject() {
    const name = prompt("Projektname");
    if (!name) return;
    const customer = prompt("Kunde (optional)") || "";
    await this._hass.callService("materialkosten","add_project",{name,customer});
  }
  getCardSize(){return 4}
}
customElements.define("materialkosten-card", MaterialkostenCard);
