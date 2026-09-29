# Materialkosten für Home Assistant

Projekt- und Auftragsverwaltung für Materialkosten und Arbeitszeit.

## Installation über HACS

Repository:

`https://github.com/th1982tom/materialkosten`

In HACS → Integrationen → ⋮ → Benutzerdefinierte Repositories → Repository eintragen → Typ **Integration**.

Danach installieren und Home Assistant neu starten.

## Danach

**Einstellungen → Geräte & Dienste → Integration hinzufügen → Materialkosten**

Die Oberfläche wird von der Integration selbst bereitgestellt. Es ist **keine Lovelace-Ressource und kein `/hacsfiles`-Pfad notwendig**.

Nach der Installation erscheint die Seite **Materialkosten** in der Home-Assistant-Seitenleiste.

## Funktionen

- Auftragsnummer
- Projekt/Kunde
- Status Offen / In Bearbeitung / Abgeschlossen
- Material-Stammliste
- Materialpositionen
- Menge × Einzelpreis
- Arbeitszeit
- Stunden × Stundensatz
- Materialkosten
- Arbeitskosten
- Projektgesamtbetrag
- Gesamtsumme

## v0.7.3

- Fix: Dialoge bleiben beim Öffnen sichtbar und werden nicht durch Home-Assistant-State-Updates sofort geschlossen.

## v0.7.4

- Fix: Auftrags-, Material- und Arbeitszeitdialoge bleiben bei Home-Assistant-State-Updates geöffnet.
- Frontend-Modul erhält eine neue Versionskennung zur Vermeidung von Browser-Caching.

## v0.7.5

- Gebuchtes Material wird direkt unter jedem Auftrag angezeigt.
- Anzeige von Menge, Einheit, Einzelpreis und Positionssumme.
- Oberfläche aktualisiert sich nach Änderungen sofort.
