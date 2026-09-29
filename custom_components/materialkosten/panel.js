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
      <div class="grid"><label>Einheit<input name="unit" value="Stk." required></label><label>Standardpreis (€)<input name="price" type="number" step="0.01" min="0" value="0"></label></div>`,
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
  async remove(id,name){if(confirm(`Auftrag "${name}" wirklich löschen?`)){await this.call("remove_project",{project_id:id});this._selectedProject=null;this.render()}}

  selectProject(id){this._selectedProject=id;this.render()}

  render(){
    if(!this._hass || this._dialog)return;
    const a=this.attrs(),ps=a.projekte||[];
    const selected=ps.find(p=>p.id===this._selectedProject);

    if(this._selectedProject && !selected)this._selectedProject=null;

    this.innerHTML=`<style>
      :host{display:block;padding:24px;box-sizing:border-box}.wrap{max-width:1100px;margin:auto}
      .top{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}.title{font-size:28px;font-weight:600}.sub{color:var(--secondary-text-color);font-size:13px}
      .actions{display:flex;gap:8px;margin-bottom:20px}button{border:0;border-radius:8px;padding:10px 14px;background:var(--primary-color);color:white;cursor:pointer}button.delete{background:var(--secondary-background-color);color:var(--primary-text-color)}button.back{background:var(--secondary-background-color);color:var(--primary-text-color)}
      .section{font-size:18px;font-weight:600;border-top:1px solid var(--divider-color);padding:20px 0 8px}.project{padding:16px 0;border-bottom:1px solid var(--divider-color);cursor:pointer}.project:hover{background:var(--secondary-background-color)}
      .prow{display:grid;grid-template-columns:1fr auto auto;gap:16px;align-items:center}.name{font-weight:600;font-size:17px}.cost{font-weight:600;text-align:right}.break{font-size:12px;color:var(--secondary-text-color);text-align:right}
      .detail-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;padding-bottom:18px;border-bottom:1px solid var(--divider-color)}.detail-meta{display:grid;grid-template-columns:repeat(2,minmax(150px,1fr));gap:10px 24px;margin-top:16px}.meta-label{font-size:12px;color:var(--secondary-text-color)}.meta-value{font-weight:500}
      .cards{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}.card{padding:14px;border-radius:12px;background:var(--secondary-background-color)}
      .card-title{font-size:17px;font-weight:600;margin-bottom:8px}.row{display:flex;justify-content:space-between;gap:16px;padding:9px 0;border-top:1px solid var(--divider-color)}.row:first-of-type{border-top:0}.empty{color:var(--secondary-text-color);padding:10px 0}
      .pactions{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px}.summary .card{background:var(--card-background-color);border:1px solid var(--divider-color)}
      select,input,textarea{box-sizing:border-box;width:100%;margin-top:5px;padding:10px;border:1px solid var(--divider-color);border-radius:8px;background:var(--secondary-background-color);color:var(--primary-text-color);font:inherit}label{display:block;margin:11px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .overlay{position:fixed;inset:0;background:#0008;display:flex;align-items:center;justify-content:center;z-index:10000}.dialog{background:var(--card-background-color);padding:22px;border-radius:14px;width:min(520px,calc(100vw - 32px));box-shadow:0 10px 40px #0008}.dialog h2{margin-top:0}.buttons{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.cancel{background:var(--secondary-background-color);color:var(--primary-text-color)}
      @media(max-width:760px){.prow{grid-template-columns:1fr auto}.detail-meta,.cards,.summary{grid-template-columns:1fr}.cost{grid-column:1/-1;text-align:left}.break{text-align:left}.grid{grid-template-columns:1fr}}
    </style>`;

    if(selected){
      const items=selected.material_positionen||[];
      const works=selected.arbeitspositionen||[];
      const matTotal=Number(selected.material||0), workTotal=Number(selected.arbeitszeit||0), total=Number(selected.kosten||0);
      this.innerHTML+=`<div class="wrap">
        <div class="actions"><button class="back" id="back">← Aufträge</button></div>
        <div class="detail-head">
          <div>
            <div class="title">${this.esc((selected.order_number?selected.order_number+" – ":"")+selected.name)}</div>
            <div class="sub">${this.esc(selected.customer||"Kein Kunde")} · ${this.esc(selected.status||"offen")}</div>
            <div class="detail-meta">
              <div><div class="meta-label">Auftrag</div><div class="meta-value">${this.esc(selected.order_number||"–")}</div></div>
              <div><div class="meta-label">Kunde</div><div class="meta-value">${this.esc(selected.customer||"–")}</div></div>
              <div><div class="meta-label">Erstellt</div><div class="meta-value">${this.esc(selected.erstellt?new Date(selected.erstellt).toLocaleString("de-DE"):"–")}</div></div>
              <div><div class="meta-label">Abgeschlossen</div><div class="meta-value">${this.esc(selected.abgeschlossen?new Date(selected.abgeschlossen).toLocaleString("de-DE"):"–")}</div></div>
            </div>
          </div>
          <div style="min-width:180px"><label>Status<select class="detail-status" data-id="${selected.id}"><option value="offen" ${selected.status==="offen"?"selected":""}>Offen</option><option value="in_bearbeitung" ${selected.status==="in_bearbeitung"?"selected":""}>In Bearbeitung</option><option value="abgeschlossen" ${selected.status==="abgeschlossen"?"selected":""}>Abgeschlossen</option></select></label></div>
        </div>

        <div class="pactions">
          <button id="addm">＋ Material</button><button id="addw">＋ Arbeit</button><button id="newmat" class="back">＋ Materialstamm</button><button id="delete" class="delete">Auftrag löschen</button>
        </div>

        <div class="summary">
          <div class="card"><div class="meta-label">Material</div><div class="meta-value">${matTotal.toFixed(2)} €</div></div>
          <div class="card"><div class="meta-label">Arbeitszeit</div><div class="meta-value">${workTotal.toFixed(2)} €</div></div>
          <div class="card"><div class="meta-label">Gesamt</div><div class="meta-value">${total.toFixed(2)} €</div></div>
        </div>

        <div class="cards">
          <div class="card"><div class="card-title">Gebuchtes Material</div>
            ${items.length?items.map(i=>`<div class="row"><div><b>${this.esc(i.material)}</b><div class="sub">${Number(i.quantity).toLocaleString("de-DE")} ${this.esc(i.unit)} × ${Number(i.unit_price).toFixed(2)} €${i.note?` · ${this.esc(i.note)}`:""}</div></div><b>${(Number(i.quantity)*Number(i.unit_price)).toFixed(2)} €</b></div>`).join(""):`<div class="empty">Noch kein Material gebucht.</div>`}
          </div>
          <div class="card"><div class="card-title">Arbeitszeit</div>
            ${works.length?works.map(w=>`<div class="row"><div><b>${this.esc(w.description)}</b><div class="sub">${this.esc(w.date||"")} · ${Number(w.hours).toFixed(2)} Std. × ${Number(w.hourly_rate).toFixed(2)} €</div></div><b>${(Number(w.hours)*Number(w.hourly_rate)).toFixed(2)} €</b></div>`).join(""):`<div class="empty">Noch keine Arbeitszeit erfasst.</div>`}
          </div>
        </div>

        ${selected.note?`<div class="section">Notiz</div><div class="card">${this.esc(selected.note)}</div>`:""}
      </div>`;

      this.querySelector("#back").onclick=()=>{this._selectedProject=null;this.render()};
      this.querySelector("#addm").onclick=()=>this.addMaterial(selected.id);
      this.querySelector("#addw").onclick=()=>this.work(selected.id);
      this.querySelector("#newmat").onclick=()=>this.material();
      this.querySelector("#delete").onclick=()=>this.remove(selected.id,selected.name);
      this.querySelector(".detail-status").onchange=()=>this.status(selected.id,this.querySelector(".detail-status").value);
      return;
    }

    this.innerHTML+=`<div class="wrap">
      <div class="top"><div><div class="title">Materialkosten</div><div class="sub">Aufträge</div></div></div>
      <div class="actions"><button id="p">＋ Auftrag</button></div>
      <div class="section">Aufträge</div>
      ${ps.length?ps.map(p=>`<div class="project" data-id="${p.id}">
        <div class="prow">
          <div><div class="name">${this.esc(p.order_number? p.order_number+" – ":"")}${this.esc(p.name)}</div><div class="sub">${this.esc(p.customer||"Kein Kunde")} · ${this.esc(p.status||"offen")}</div></div>
          <div class="cost"><div class="break">Material ${Number(p.material||0).toFixed(2)} € · Arbeit ${Number(p.arbeitszeit||0).toFixed(2)} €</div>${Number(p.kosten||0).toFixed(2)} €</div>
          <span>›</span>
        </div>
      </div>`).join(""):`<div class="empty">Noch keine Aufträge.</div>`}
    </div>`;

    this.querySelector("#p").onclick=()=>this.project();
    this.querySelectorAll(".project").forEach(b=>b.onclick=()=>this.selectProject(b.dataset.id));
  }
}
customElements.define("materialkosten-panel",MaterialkostenPanel);
