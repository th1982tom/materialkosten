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

## v0.7.6

- Fix: Frontend cache-buster updated so the booked-material view is loaded by Home Assistant.

## v0.7.7

- Neue Auftragsübersicht mit Detailansicht je Auftrag.
- Material und Arbeitszeit werden erst beim Öffnen eines Auftrags angezeigt.
- Materialstamm bleibt über die Auftragsdetailansicht erreichbar.

## v0.7.8

- Einzelne Materialpositionen können direkt im Auftrag gelöscht werden.
- Auch einzelne Arbeitszeitpositionen können direkt im Auftrag gelöscht werden.

## v0.7.9

- Eigener Elementname aus Version und Frontend-Prüfsumme: eine bereits geladene alte Oberfläche kann die aktuelle Ansicht nicht mehr übernehmen.
- Registrierung mit customElements.get abgesichert; erneutes Laden desselben Builds ist sicher.
- Modul-URL mit Version, Prüfsumme und Elementname; statischer Pfad ohne Cache-Header.
- Frontend/HTTP als Abhängigkeiten; Registrierungsfehler werden nicht mehr still verschluckt.
- Auftragsübersicht, Detailansicht und einzelne Löschaktionen bleiben erhalten.
- Auftragsnummer wird auch aus dem bisherigen Sensorfeld angezeigt; nach Dialogschluss wird der aktuelle Zustand gerendert.
- Speicherformat, Speicherschlüssel, Sensor-IDs und Service-Namen unverändert.

## v0.7.10

- Material direkt zum Auftrag hinzufügen, ohne vorherigen Materialstammeintrag.
- Auswahl zwischen vorhandenen Stammdaten und freier Eingabe von Name, Einheit und Preis.
- Optionales Kontrollkästchen „Auch in den Materialstamm übernehmen“, standardmäßig aus.
- Gleicher Name und gleiche Einheit erzeugen keinen doppelten Stammeintrag; bestehender Standardpreis bleibt erhalten.
- Position und optionaler Stammeintrag werden zusammen gespeichert.
- Speicherformat und bestehende Daten bleiben unverändert.
