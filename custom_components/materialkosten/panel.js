class MaterialkostenPanel extends HTMLElement {
  set hass(hass){this._hass=hass;if(!this._dialog)this.render()}
  setConfig(c){this.config=c||{};this.render()}
  esc(v){return String(v??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  attrs(){return this._hass.states["sensor.materialkosten_projekte"]?.attributes||{}}
  async call(s,d){await this._hass.callService("materialkosten",s,d)}
  dialog(title,body,submit){
    this.close();
    const d=document.createElement("div"); d.className="overlay";
    d.innerHTML=`<div class="dialog"><h2>${this.esc(title)}</h2><form>${body}<div class="buttons"><button type="button" class="cancel">Abbrechen</button><button class="primary">Speichern</button></div></form></div>`;
    this.appendChild(d);this._dialog=d;
    d.querySelector(".cancel").onclick=()=>this.close();
    d.querySelector("form").onsubmit=async e=>{e.preventDefault();if(await submit(new FormData(e.target))!==false)this.close()}
  }
  close(){if(this._dialog)this._dialog.remove();this._dialog=null}
  project(){
    this.dialog("Neuer Auftrag",`
      <label>Auftragsnummer<input name="order" placeholder="2026-001"></label>
      <label>Projektname<input name="name" required autofocus></label>
      <label>Kunde<input name="customer"></label>
      <label>Status<select name="status"><option value="offen">Offen</option><option value="in_bearbeitung">In Bearbeitung</option><option value="abgeschlossen">Abgeschlossen</option></select></label>
      <label>Notiz<textarea name="note"></textarea></label>`,
      async f=>this.call("add_project",{order_number:f.get("order")||"",name:f.get("name"),customer:f.get("customer")||"",status:f.get("status"),note:f.get("note")||""}))
  }
  material(){
    this.dialog("Material anlegen",`
      <label>Material<input name="name" required autofocus placeholder="NYM-J 3×1,5"></label>
      <div class="grid"><label>Einheit<input name="unit" value="m" required></label><label>Standardpreis (€)<input name="price" type="number" step="0.01" min="0" value="0"></label></div>`,
      async f=>this.call("add_material",{name:f.get("name"),unit:f.get("unit"),unit_price:Number(f.get("price"))}))
  }
  addMaterial(project){
    const mats=this.attrs().materialien||[];
    if(!mats.length){this.material();return}
    const opts=mats.map(m=>`<option value="${this.esc(m.id)}">${this.esc(m.name)} – ${Number(m.unit_price).toFixed(2)} €/${this.esc(m.unit)}</option>`).join("");
    this.dialog("Material erfassen",`
      <label>Material<select name="material">${opts}</select></label>
      <div class="grid"><label>Menge<input name="qty" type="number" step="0.001" min="0.001" value="1"></label><label>Einzelpreis (€)<input name="price" type="number" step="0.01" min="0"></label></div>
      <label>Notiz<textarea name="note"></textarea></label>`,
      async f=>{const m=mats.find(x=>x.id===f.get("material"));return this.call("add_item",{project_id:project,material:m.name,quantity:Number(f.get("qty")),unit:m.unit,unit_price:Number(f.get("price")),note:f.get("note")||""})});
    const sel=this._dialog.querySelector("[name=material]"),price=this._dialog.querySelector("[name=price]");
    const upd=()=>{const m=mats.find(x=>x.id===sel.value);if(m)price.value=Number(m.unit_price).toFixed(2)};sel.onchange=upd;upd();
  }
  work(project){
    this.dialog("Arbeitszeit erfassen",`
      <div class="grid"><label>Datum<input name="date" type="date" value="${new Date().toISOString().slice(0,10)}"></label><label>Stunden<input name="hours" type="number" step="0.25" min="0.01" value="1"></label></div>
      <label>Tätigkeit<input name="description" required placeholder="Verkabelung"></label>
      <label>Stundensatz (€)<input name="rate" type="number" step="0.50" min="0" value="45"></label>`,
      async f=>this.call("add_work",{project_id:project,date:f.get("date"),description:f.get("description"),hours:Number(f.get("hours")),hourly_rate:Number(f.get("rate"))}))
  }
  status(id,status){return this.call("update_project_status",{project_id:id,status})}
  async remove(id,name){if(confirm(`Auftrag "${name}" wirklich löschen?`))await this.call("remove_project",{project_id:id})}
  render(){
    if(!this._hass || this._dialog)return;
    const a=this.attrs(),ps=a.projekte||[],ms=a.materialien||[],total=Number(this._hass.states["sensor.materialkosten_gesamt"]?.state||0);
    this.innerHTML=`<style>
      :host{display:block;padding:24px;box-sizing:border-box}.wrap{max-width:1100px;margin:auto}
      .top{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}.title{font-size:28px;font-weight:600}.sub{color:var(--secondary-text-color);font-size:13px}.total{font-size:30px;font-weight:600}
      .actions{display:flex;gap:8px;margin-bottom:20px}button{border:0;border-radius:8px;padding:10px 14px;background:var(--primary-color);color:white;cursor:pointer}button.delete{background:var(--secondary-background-color);color:var(--primary-text-color)}
      .section{font-size:18px;font-weight:600;border-top:1px solid var(--divider-color);padding:20px 0 8px}.project{padding:15px 0;border-bottom:1px solid var(--divider-color)}
      .prow{display:grid;grid-template-columns:1fr auto auto;gap:16px;align-items:center}.name{font-weight:600;font-size:17px}.cost{font-weight:600;text-align:right}.break{font-size:12px;color:var(--secondary-text-color);text-align:right}.pactions{display:flex;gap:6px;justify-content:flex-end;margin-top:9px}
      .material{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--divider-color)}.booked{margin:12px 0;padding:12px;border-radius:10px;background:var(--secondary-background-color)}.booked-title{font-weight:600;margin-bottom:7px}.booked-row{display:flex;justify-content:space-between;gap:16px;padding:8px 0;border-top:1px solid var(--divider-color)}
      select,input,textarea{box-sizing:border-box;width:100%;margin-top:5px;padding:10px;border:1px solid var(--divider-color);border-radius:8px;background:var(--secondary-background-color);color:var(--primary-text-color);font:inherit}label{display:block;margin:11px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .overlay{position:fixed;inset:0;background:#0008;display:flex;align-items:center;justify-content:center;z-index:10000}.dialog{background:var(--card-background-color);padding:22px;border-radius:14px;width:min(520px,calc(100vw - 32px));box-shadow:0 10px 40px #0008}.dialog h2{margin-top:0}.buttons{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.cancel{background:var(--secondary-background-color);color:var(--primary-text-color)}.empty{color:var(--secondary-text-color);padding:15px 0}
      @media(max-width:700px){.prow{grid-template-columns:1fr auto}.pactions{grid-column:1/-1;justify-content:flex-start}.grid{grid-template-columns:1fr}}
    </style>
    <div class="wrap"><div class="top"><div><div class="title">Materialkosten</div><div class="sub">Aufträge · Material · Arbeitszeit</div></div><div class="total">${total.toFixed(2)} €</div></div>
    <div class="actions"><button id="p">＋ Auftrag</button><button id="m">＋ Material</button></div>
    <div class="section">Aufträge</div>
    ${ps.length?ps.map(p=>{const items=p.material_positionen||[]; return `<div class="project"><div class="prow"><div><div class="name">${this.esc(p.order_number? p.order_number+" – ":"")}${this.esc(p.name)}</div><div class="sub">${this.esc(p.customer||"Kein Kunde")} · ${this.esc(p.status||"offen")}</div></div><div class="cost"><div class="break">Material ${Number(p.material||0).toFixed(2)} € · Arbeit ${Number(p.arbeitszeit||0).toFixed(2)} €</div>${Number(p.kosten||0).toFixed(2)} €</div><select class="status" data-id="${p.id}"><option value="offen" ${p.status==="offen"?"selected":""}>Offen</option><option value="in_bearbeitung" ${p.status==="in_bearbeitung"?"selected":""}>In Bearbeitung</option><option value="abgeschlossen" ${p.status==="abgeschlossen"?"selected":""}>Abgeschlossen</option></select></div><div class="booked"><div class="booked-title">Gebuchtes Material</div>${items.length?items.map(i=>`<div class="booked-row"><div><b>${this.esc(i.material)}</b><div class="sub">${Number(i.quantity).toLocaleString("de-DE")} ${this.esc(i.unit)} × ${Number(i.unit_price).toFixed(2)} €</div>${i.note?`<div class="sub">${this.esc(i.note)}</div>`:""}</div><b>${(Number(i.quantity)*Number(i.unit_price)).toFixed(2)} €</b></div>`).join(""):`<div class="empty">Noch kein Material gebucht.</div>`}</div><div class="pactions"><button class="addm" data-id="${p.id}">＋ Material</button><button class="addw" data-id="${p.id}">＋ Arbeit</button><button class="delete" data-id="${p.id}" data-name="${this.esc(p.name)}">Löschen</button></div></div>`}).join(""):`<div class="empty">Noch keine Aufträge.</div>`}
    <div class="section">Material-Stammliste</div>
    ${ms.length?ms.map(m=>`<div class="material"><span><b>${this.esc(m.name)}</b> · ${this.esc(m.unit)}</span><b>${Number(m.unit_price||0).toFixed(2)} €</b></div>`).join(""):`<div class="empty">Noch keine Materialien.</div>`}
    </div>`;
    this.querySelector("#p").onclick=()=>this.project();this.querySelector("#m").onclick=()=>this.material();
    this.querySelectorAll(".addm").forEach(b=>b.onclick=()=>this.addMaterial(b.dataset.id));
    this.querySelectorAll(".addw").forEach(b=>b.onclick=()=>this.work(b.dataset.id));
    this.querySelectorAll(".delete").forEach(b=>b.onclick=()=>this.remove(b.dataset.id,b.dataset.name));
    this.querySelectorAll(".status").forEach(s=>s.onchange=()=>this.status(s.dataset.id,s.value));
  }
}
customElements.define("materialkosten-panel",MaterialkostenPanel);
