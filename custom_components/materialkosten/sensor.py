from __future__ import annotations
from homeassistant.components.sensor import SensorEntity
from .const import DOMAIN

async def async_setup_entry(hass, entry, async_add_entities):
    manager = hass.data[DOMAIN]
    async_add_entities([MaterialTotalSensor(manager), MaterialProjectsSensor(manager)])

class MaterialTotalSensor(SensorEntity):
    _attr_native_unit_of_measurement = "EUR"
    _attr_icon = "mdi:cash-multiple"
    _attr_name = "Materialkosten gesamt"
    _attr_unique_id = "materialkosten_total"
    def __init__(self, manager): self.manager = manager
    @property
    def native_value(self): return self.manager.total()

class MaterialProjectsSensor(SensorEntity):
    _attr_icon = "mdi:briefcase-outline"
    _attr_name = "Materialkosten Projekte"
    _attr_unique_id = "materialkosten_projects"
    def __init__(self, manager): self.manager = manager
    @property
    def native_value(self): return len(self.manager.projects())
    @property
    def extra_state_attributes(self):
        return {
            "materialien": list(self.manager.materials().values()),
            "projekte": [
                {"id": p["id"], "name": p["name"], "customer": p.get("customer",""),
                 "material": self.manager.material_total(p["id"]),
                 "arbeitszeit": self.manager.work_total(p["id"]),
                 "kosten": self.manager.project_total(p["id"])}
                for p in self.manager.projects().values()
            ]
        }
