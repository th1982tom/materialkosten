from __future__ import annotations
from homeassistant.components.sensor import SensorEntity
from homeassistant.core import callback
from .const import DOMAIN

UPDATED_EVENT = f"{DOMAIN}_updated"

async def async_setup_entry(hass, entry, async_add_entities):
    manager = hass.data[DOMAIN]
    entities = [MaterialTotalSensor(manager), MaterialProjectsSensor(manager)]
    async_add_entities(entities)

class MaterialTotalSensor(SensorEntity):
    _attr_native_unit_of_measurement = "EUR"
    _attr_icon = "mdi:cash-multiple"
    _attr_name = "Materialkosten gesamt"
    _attr_unique_id = "materialkosten_total"
    def __init__(self, manager):
        self.manager = manager
        self._remove_listener = None

    async def async_added_to_hass(self):
        self._remove_listener = self.hass.bus.async_listen(UPDATED_EVENT, self._handle_update)

    async def async_will_remove_from_hass(self):
        if self._remove_listener:
            self._remove_listener()
            self._remove_listener = None

    @callback
    def _handle_update(self, event):
        self.async_write_ha_state()
    @property
    def native_value(self): return self.manager.total()

class MaterialProjectsSensor(SensorEntity):
    _attr_icon = "mdi:briefcase-outline"
    _attr_name = "Materialkosten Projekte"
    _attr_unique_id = "materialkosten_projects"
    def __init__(self, manager):
        self.manager = manager
        self._remove_listener = None

    async def async_added_to_hass(self):
        self._remove_listener = self.hass.bus.async_listen(UPDATED_EVENT, self._handle_update)

    async def async_will_remove_from_hass(self):
        if self._remove_listener:
            self._remove_listener()
            self._remove_listener = None

    @callback
    def _handle_update(self, event):
        self.async_write_ha_state()

    @property
    def native_value(self): return len(self.manager.projects())
    @property
    def extra_state_attributes(self):
        return {
            "materialien": list(self.manager.materials().values()),
            "projekte": [
                {"id": p["id"], "name": p["name"], "customer": p.get("customer",""),
                 "auftragsnummer": p.get("order_number",""),
                 "status": p.get("status","offen"),
                 "erstellt": p.get("created"),
                 "abgeschlossen": p.get("completed"),
                 "material": self.manager.material_total(p["id"]),
                 "material_positionen": self.manager.items(p["id"]),
                 "arbeitszeit": self.manager.work_total(p["id"]),
                 "kosten": self.manager.project_total(p["id"])}
                for p in self.manager.projects().values()
            ]
        }
