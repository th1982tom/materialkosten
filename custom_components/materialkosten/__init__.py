"""Materialkosten integration."""
from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.components.http import StaticPathConfig

from .const import (
    DOMAIN,
    SERVICE_ADD_ITEM,
    SERVICE_REMOVE_ITEM,
    SERVICE_ADD_PROJECT,
    SERVICE_REMOVE_PROJECT,
    SERVICE_ADD_MATERIAL,
    SERVICE_REMOVE_MATERIAL,
    SERVICE_ADD_WORK,
    SERVICE_REMOVE_WORK,
)
from .manager import MaterialManager


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    manager = MaterialManager(hass)
    await manager.async_load()
    hass.data[DOMAIN] = manager

    # Register the integration's built-in frontend. No /local or /hacsfiles resource is required.
    await hass.http.async_register_static_paths([
        StaticPathConfig(
            "/api/materialkosten/panel.js",
            hass.config.path("custom_components/materialkosten/panel.js"),
            cache_headers=False,
        )
    ])

    try:
        from homeassistant.components.frontend import async_register_built_in_panel
        async_register_built_in_panel(
            hass,
            component_name="custom",
            sidebar_title="Materialkosten",
            sidebar_icon="mdi:cash-register",
            frontend_url_path="materialkosten",
            config={
                "_panel_custom": {
                    "name": "materialkosten-panel",
                    "embed_iframe": False,
                    "trust_external": False,
                    "module_url": "/api/materialkosten/panel.js?v=0.7.4",
                }
            },
            require_admin=False,
            update=True,
        )
    except Exception as err:
        import logging
        logging.getLogger(__name__).debug("Materialkosten panel registration failed: %s", err)

    async def add_project(call: ServiceCall):
        await manager.add_project(call.data["name"], call.data.get("customer", ""), call.data.get("note", ""), call.data.get("order_number", ""), call.data.get("status", "offen"))

    async def remove_project(call: ServiceCall):
        await manager.remove_project(call.data["project_id"])

    async def update_project_status(call: ServiceCall):
        await manager.update_project_status(call.data["project_id"], call.data["status"])

    async def add_item(call: ServiceCall):
        await manager.add_item(
            call.data["project_id"], call.data["material"], call.data["quantity"],
            call.data["unit"], call.data["unit_price"], call.data.get("note", "")
        )

    async def remove_item(call: ServiceCall):
        await manager.remove_item(call.data["item_id"])

    async def add_material(call: ServiceCall):
        await manager.add_material(call.data["name"], call.data.get("unit", "Stk."), call.data.get("unit_price", 0))

    async def remove_material(call: ServiceCall):
        await manager.remove_material(call.data["material_id"])

    async def add_work(call: ServiceCall):
        await manager.add_work(
            call.data["project_id"],
            call.data.get("date", ""),
            call.data["description"],
            call.data["hours"],
            call.data["hourly_rate"],
        )

    async def remove_work(call: ServiceCall):
        await manager.remove_work(call.data["work_id"])

    hass.services.async_register(DOMAIN, SERVICE_ADD_PROJECT, add_project)
    hass.services.async_register(DOMAIN, SERVICE_REMOVE_PROJECT, remove_project)
    hass.services.async_register(DOMAIN, "update_project_status", update_project_status)
    hass.services.async_register(DOMAIN, SERVICE_ADD_ITEM, add_item)
    hass.services.async_register(DOMAIN, SERVICE_REMOVE_ITEM, remove_item)
    hass.services.async_register(DOMAIN, SERVICE_ADD_MATERIAL, add_material)
    hass.services.async_register(DOMAIN, SERVICE_REMOVE_MATERIAL, remove_material)
    hass.services.async_register(DOMAIN, SERVICE_ADD_WORK, add_work)
    hass.services.async_register(DOMAIN, SERVICE_REMOVE_WORK, remove_work)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    manager: MaterialManager = hass.data[DOMAIN]
    await manager.async_setup_entry(entry)
    await hass.config_entries.async_forward_entry_setups(entry, ["sensor"])
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    return await hass.config_entries.async_unload_platforms(entry, ["sensor"])
