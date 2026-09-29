"""Persistent data manager for Materialkosten."""
from __future__ import annotations

from datetime import date, datetime
from uuid import uuid4
from homeassistant.helpers.storage import Store


class MaterialManager:
    def __init__(self, hass):
        self.hass = hass
        self.store = Store(hass, 2, "materialkosten.data")
        self.data = {"projects": {}, "items": [], "materials": {}, "work": []}

    async def async_load(self):
        stored = await self.store.async_load()
        if stored:
            self.data = stored
            self.data.setdefault("projects", {})
            self.data.setdefault("items", [])
            self.data.setdefault("materials", {})
            self.data.setdefault("work", [])

    async def async_save(self):
        await self.store.async_save(self.data)
        self.hass.bus.async_fire("materialkosten_updated")

    async def async_setup_entry(self, entry):
        return None

    def projects(self):
        return self.data["projects"]

    def materials(self):
        return self.data["materials"]

    def items(self, project_id=None):
        items = self.data["items"]
        return [x for x in items if not project_id or x["project_id"] == project_id]

    def work(self, project_id=None):
        return [x for x in self.data["work"] if not project_id or x["project_id"] == project_id]

    def material_total(self, project_id):
        return round(sum(float(x["quantity"]) * float(x["unit_price"]) for x in self.items(project_id)), 2)

    def work_total(self, project_id):
        return round(sum(float(x["hours"]) * float(x["hourly_rate"]) for x in self.work(project_id)), 2)

    def project_total(self, project_id):
        return round(self.material_total(project_id) + self.work_total(project_id), 2)

    def total(self):
        return round(
            sum(float(x["quantity"]) * float(x["unit_price"]) for x in self.data["items"])
            + sum(float(x["hours"]) * float(x["hourly_rate"]) for x in self.data["work"]), 2
        )

    async def add_project(self, name, customer="", note="", order_number="", status="offen"):
        pid = uuid4().hex
        self.data["projects"][pid] = {
            "id": pid, "name": name, "customer": customer, "note": note,
            "order_number": order_number, "status": status,
            "created": datetime.now().isoformat(), "completed": None
        }
        await self.async_save()
        return pid

    async def update_project_status(self, project_id, status):
        project = self.data["projects"].get(project_id)
        if not project:
            return
        project["status"] = status
        project["completed"] = datetime.now().isoformat() if status == "abgeschlossen" else None
        await self.async_save()

    async def remove_project(self, project_id):
        self.data["projects"].pop(project_id, None)
        self.data["items"] = [x for x in self.data["items"] if x["project_id"] != project_id]
        await self.async_save()

    async def add_item(self, project_id, material, quantity, unit, unit_price, note=""):
        item = {
            "id": uuid4().hex, "project_id": project_id, "material": material,
            "quantity": float(quantity), "unit": unit, "unit_price": float(unit_price),
            "note": note, "date": date.today().isoformat()
        }
        self.data["items"].append(item)
        await self.async_save()
        return item

    async def remove_item(self, item_id):
        self.data["items"] = [x for x in self.data["items"] if x["id"] != item_id]
        await self.async_save()

    async def add_material(self, name, unit="Stk.", unit_price=0):
        mid = uuid4().hex
        self.data["materials"][mid] = {
            "id": mid, "name": name, "unit": unit, "unit_price": float(unit_price)
        }
        await self.async_save()
        return mid

    async def remove_material(self, material_id):
        self.data["materials"].pop(material_id, None)
        await self.async_save()

    async def add_work(self, project_id, work_date, description, hours, hourly_rate):
        item = {
            "id": uuid4().hex,
            "project_id": project_id,
            "date": work_date or date.today().isoformat(),
            "description": description,
            "hours": float(hours),
            "hourly_rate": float(hourly_rate),
        }
        self.data["work"].append(item)
        await self.async_save()
        return item

    async def remove_work(self, work_id):
        self.data["work"] = [x for x in self.data["work"] if x["id"] != work_id]
        await self.async_save()
