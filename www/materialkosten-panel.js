
const mkStyle = document.createElement("style");
mkStyle.textContent = `
materialkosten-panel .wrap{padding:20px}
materialkosten-panel .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
materialkosten-panel .title{font-size:22px;font-weight:600}
materialkosten-panel .sub,.hint{color:var(--secondary-text-color);font-size:13px}
materialkosten-panel .total{font-size:28px;font-weight:600}
materialkosten-panel .actions{display:flex;gap:8px;margin-bottom:18px}
materialkosten-panel button{border:0;border-radius:8px;padding:9px 14px;background:var(--primary-color);color:white;cursor:pointer}
materialkosten-panel button.delete{background:var(--secondary-background-color);color:var(--primary-text-color)}
materialkosten-panel .section{border-top:1px solid var(--divider-color);padding:16px 0 8px;margin-top:8px}
materialkosten-panel .count{float:right;color:var(--secondary-text-color)}
materialkosten-panel .project{display:grid;grid-template-columns:1fr auto auto;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid var(--divider-color)}
materialkosten-panel .pname{font-weight:600}
materialkosten-panel .cost{font-weight:600}
materialkosten-panel .breakdown{display:flex;flex-direction:column;gap:2px;text-align:right;font-size:13px} 
materialkosten-panel .breakdown b{font-size:15px} 
materialkosten-panel .pactions{display:flex;gap:6px}
materialkosten-panel .material{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--divider-color)}
materialkosten-panel .material small{margin-left:10px;color:var(--secondary-text-color)}
materialkosten-panel .empty{color:var(--secondary-text-color);padding:12px 0}
materialkosten-panel .overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center}
materialkosten-panel .dialog{background:var(--card-background-color);color:var(--primary-text-color);width:min(520px,calc(100vw - 32px));border-radius:14px;padding:20px;box-shadow:0 10px 40px #0008}
materialkosten-panel .dtitle{font-size:20px;font-weight:600;margin-bottom:18px}
materialkosten-panel label{display:block;margin:12px 0;font-size:14px}
materialkosten-panel input,materialkosten-panel select,materialkosten-panel textarea{box-sizing:border-box;width:100%;margin-top:6px;padding:10px;border:1px solid var(--divider-color);border-radius:8px;background:var(--secondary-background-color);color:var(--primary-text-color);font:inherit}
materialkosten-panel .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
materialkosten-panel .dactions{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}
materialkosten-panel .dactions .primary{background:var(--primary-color);color:white}
materialkosten-panel .danger{color:var(--error-color)}
@media(max-width:600px){materialkosten-panel .project{grid-template-columns:1fr auto}.pactions{grid-column:1/-1}.grid{grid-template-columns:1fr}}
`;
document.head.appendChild(mkStyle);
class MaterialkostenPanel extends HTMLElement {
  set hass(hass) { this._hass = hass; this.render(); }
  setConfig(config) { this.config = config || {}; this.render(); }

  esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, c =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  attrs() { return this._hass.states["sensor.materialkosten_projekte"]?.attributes || {}; }
  async call(service, data) {
    await this._hass.callService("materialkosten", service, data);
  }
  closeDialog() { this._dialog?.remove(); this._dialog = null; }
  dialog(title, body, onSubmit) {
    this.closeDialog();
    const d = document.createElement("div");
    d.className = "overlay";
    d.innerHTML = `<div class="dialog">
      <div class="dtitle">${this.esc(title)}</div>
      <form>${body}
        <div class="dactions">
          <button type="button" class="cancel">Abbrechen</button>
          <button class="primary" type="submit">Speichern</button>
        </div>
      </form>
    </div>`;
    this.appendChild(d);
    this._dialog = d;
    d.querySelector(".cancel").onclick = () => this.closeDialog();
    d.querySelector("form").onsubmit = async e => {
      e.preventDefault();
      const result = await onSubmit(new FormData(e.target));
      if (result !== false) this.closeDialog();
    };
  }
  newProject() {
    this.dialog("Neues Projekt", `
      <label>Auftragsnummer<input name="order" placeholder="z.B. 2026-001"></label>
      <label>Projektname<input name="name" required autofocus></label>
      <label>Kunde<input name="customer"></label>
      <label>Status<select name="status">
        <option value="offen">Offen</option>
        <option value="in_bearbeitung">In Bearbeitung</option>
        <option value="abgeschlossen">Abgeschlossen</option>
      </select></label>
      <label>Notiz<textarea name="note" rows="3"></textarea></label>`,
      async f => {
        await this.call("add_project", {
          name:f.get("name"), customer:f.get("customer") || "", note:f.get("note") || "",
          order_number:f.get("order") || "", status:f.get("status") || "offen"
        });
      });
  }
  newMaterial() {
    this.dialog("Neues Material", `
      <label>Material<input name="name" required autofocus placeholder="z.B. NYM-J 3×1,5"></label>
      <div class="grid">
        <label>Einheit<input name="unit" value="m" required></label>
        <label>Standardpreis (€)<input name="price" type="number" step="0.01" min="0" value="0" required></label>
      </div>`,
      async f => {
        await this.call("add_material", {
          name:f.get("name"), unit:f.get("unit"), unit_price:Number(f.get("price"))
        });
      });
  }
  addItem(projectId, projectName) {
    const mats = this.attrs().materialien || [];
    if (!mats.length) { this.newMaterial(); return; }
    const options = mats.map(m =>
      `<option value="${this.esc(m.id)}">${this.esc(m.name)} – ${Number(m.unit_price||0).toFixed(2)} €/ ${this.esc(m.unit)}</option>`
    ).join("");
    this.dialog(`Material für ${projectName}`, `
      <label>Material<select name="material" required>${options}</select></label>
      <div class="grid">
        <label>Menge<input name="qty" type="number" step="0.001" min="0.001" value="1" required></label>
        <label>Einzelpreis (€)<input name="price" type="number" step="0.01" min="0" required></label>
      </div>
      <div class="hint">Der Einzelpreis wird aus der Material-Stammliste übernommen und kann für dieses Projekt geändert werden.</div>
      <label>Notiz<textarea name="note" rows="2"></textarea></label>`,
      async f => {
        const m = mats.find(x => x.id === f.get("material"));
        await this.call("add_item", {
          project_id:projectId, material:m.name, quantity:Number(f.get("qty")),
          unit:m.unit, unit_price:Number(f.get("price")), note:f.get("note") || ""
        });
      });
    const select = this._dialog.querySelector('[name="material"]');
    const price = this._dialog.querySelector('[name="price"]');
    const update = () => {
      const m = mats.find(x => x.id === select.value);
      if (m) price.value = Number(m.unit_price || 0).toFixed(2);
    };
    select.onchange = update; update();
  }

  workForm(projectId, projectName) {
    this.dialog(`Arbeitszeit für ${projectName}`, `
      <div class="grid">
        <label>Datum<input name="date" type="date" value="${new Date().toISOString().slice(0,10)}" required></label>
        <label>Stunden<input name="hours" type="number" step="0.25" min="0.01" value="1" required></label>
      </div>
      <label>Beschreibung<input name="description" required placeholder="z.B. Verkabelung"></label>
      <label>Stundensatz (€)<input name="rate" type="number" step="0.50" min="0" value="45" required></label>`,
      async f => {
        await this.call("add_work", {
          project_id:projectId, date:f.get("date"),
          description:f.get("description"), hours:Number(f.get("hours")),
          hourly_rate:Number(f.get("rate"))
        });
      });
  }

  deleteProject(id, name) {
    this.dialog("Projekt löschen", `
      <p>Das Projekt <b>${this.esc(name)}</b> und alle darin gespeicherten Materialpositionen werden gelöscht.</p>
      <p class="danger">Dieser Vorgang kann nicht rückgängig gemacht werden.</p>`,
      async () => {
        await this.call("remove_project", {project_id:id});
      });
  }
  render() {
    if (!this._hass) return;
    const a = this.attrs(), projects = a.projekte || [], mats = a.materialien || [];
    const total = Number(this._hass.states["sensor.materialkosten_gesamt"]?.state || 0);
    this.innerHTML = `<ha-card><div class="wrap">
      <div class="header">
        <div><div class="title">Materialkosten</div><div class="sub">Material- und Projektkosten</div></div>
        <div class="total">${total.toFixed(2)} €</div>
      </div>
      <div class="actions">
        <button id="project">＋ Projekt</button>
        <button id="material">＋ Material</button>
      </div>
      <div class="section"><b>Projekte</b></div>
      ${projects.length ? projects.map(p => `<div class="project">
        <div class="pinfo"><div class="pname">${this.esc(p.order_number ? p.order_number + " – " : "")}${this.esc(p.name)}</div>
        <div class="sub">${this.esc(p.customer || "Kein Kunde")} · ${this.esc(p.status || "offen")}</div></div>
        <div class="breakdown"><span>Material ${Number(p.material||0).toFixed(2)} €</span><span>Arbeit ${Number(p.arbeitszeit||0).toFixed(2)} €</span><b>${Number(p.kosten||0).toFixed(2)} €</b></div>
        <div class="pactions">
          <button class="add" data-id="${p.id}" data-name="${this.esc(p.name)}">＋ Material</button><button class="work" data-id="${p.id}" data-name="${this.esc(p.name)}">＋ Arbeit</button>
          <button class="delete" data-id="${p.id}" data-name="${this.esc(p.name)}">Löschen</button>
        </div>
      </div>`).join("") : `<div class="empty">Noch keine Projekte angelegt.</div>`}
      <div class="section"><b>Material-Stammliste</b><span class="count">${mats.length}</span></div>
      ${mats.length ? mats.map(m => `<div class="material">
        <span><b>${this.esc(m.name)}</b><small>${this.esc(m.unit)}</small></span>
        <b>${Number(m.unit_price||0).toFixed(2)} €</b>
      </div>`).join("") : `<div class="empty">Noch keine Materialien angelegt.</div>`}
    </div></ha-card>`;

    this.querySelector("#project").onclick = () => this.newProject();
    this.querySelector("#material").onclick = () => this.newMaterial();
    this.querySelectorAll(".add").forEach(b => b.onclick = () => this.addItem(b.dataset.id, b.dataset.name));
    this.querySelectorAll(".work").forEach(b => b.onclick = () => this.workForm(b.dataset.id, b.dataset.name));
    this.querySelectorAll(".delete").forEach(b => b.onclick = () => this.deleteProject(b.dataset.id, b.dataset.name));
  }
  getCardSize(){return 6}
}
customElements.define("materialkosten-panel", MaterialkostenPanel);
