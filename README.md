# Materialkosten für Home Assistant

Projektbezogene Material- und Arbeitskostenerfassung als Home-Assistant-Custom-Integration.

## Funktionen

- Projekte und Kunden
- Material-Stammliste mit Einheit und Standardpreis
- Materialpositionen je Projekt
- Arbeitszeit je Projekt
- Menge × Einzelpreis
- Stunden × Stundensatz
- Materialkosten, Arbeitskosten und Projektgesamtbetrag
- Gesamtkosten über alle Projekte
- lokale Speicherung in Home Assistant
- Lovelace-Oberfläche
- Home-Assistant-Services für Automationen

## Installation über HACS

Dieses Repository als **Benutzerdefiniertes Repository** in HACS hinzufügen:

Repository:
`https://github.com/th1982tom/materialkosten`

1. HACS öffnen
2. **Integrationen**
3. Menü **⋮**
4. **Benutzerdefinierte Repositories**
5. GitHub-Repository-Adresse eintragen
6. Typ: **Integration**
7. Hinzufügen
8. Nach **Materialkosten** suchen und installieren
9. Home Assistant neu starten

Danach:

**Einstellungen → Geräte & Dienste → Integration hinzufügen → Materialkosten**

## Lovelace

Die Oberfläche wird als Custom Card verwendet.

Ressource:

```text
/hacsfiles/materialkosten/materialkosten-panel.js
```

Typ:

```text
JavaScript-Modul
```

Karte:

```yaml
type: custom:materialkosten-panel
```

## Beispiel

Projekt: Seyer

Material:

- NYM-J 3×1,5 — 12 m × 1,25 € = 15,00 €
- Netzwerkstecker — 4 × 2,50 € = 10,00 €

Arbeitszeit:

- Verkabelung — 3 h × 45 € = 135,00 €

Projekt:

- Material: 25,00 €
- Arbeit: 135,00 €
- Gesamt: 160,00 €
