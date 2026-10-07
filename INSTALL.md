# Installation

HACS Repository:
https://github.com/th1982tom/materialkosten

Nach Installation und Neustart:
Einstellungen → Geräte & Dienste → Integration hinzufügen → Materialkosten.

Es ist keine zusätzliche Lovelace-Ressource notwendig.

## Update auf v0.7.10

ZIP im GitHub-Repository entpacken, sodass custom_components/materialkosten direkt im Repository liegt. Commit und Release mit Tag v0.7.10 erstellen. Danach in HACS aktualisieren und Home Assistant neu starten, damit die neue Python-Panel-Konfiguration aktiv wird. Die Integration nicht löschen oder neu anlegen.

Bestehende Daten in .storage/materialkosten.data bleiben erhalten (Speicherversion 2). Zur Sicherung vor dem Update ein Home-Assistant-Backup erstellen.

Alte manuelle Materialkosten-Lovelace-Ressourcen und alte panel_custom-Einträge entfernen, sofern vorhanden. Alte /local- oder /hacsfiles-Skripte gehören nicht zur aktuellen Integration und können weiterhin eigene Konsolenfehler erzeugen. v0.7.10 nutzt einen separaten Elementnamen und benötigt diese Einträge nicht. Andere Ressourcen unverändert lassen.

Nach dem Neustart das Materialkosten-Panel öffnen. Für den ersten Aufruf der aktuellen Panel-Konfiguration eine bereits lange geöffnete Browserseite gegebenenfalls einmal neu laden; danach benötigt die neue Ansicht keinen wiederholten Reload.
