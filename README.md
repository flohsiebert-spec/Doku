# Doku · IT-Dokumentation

Vollständig offline-fähige IT-Dokumentations-SPA für IT-Administratoren im KMU-Umfeld. Alle Daten werden lokal im Browser in IndexedDB gespeichert, Zugangsdaten zusätzlich AES-256-verschlüsselt hinter einem Master-Passwort.

## Funktionen

- **Standortverwaltung**: Standorte, Räume/Bereiche, Standortbilder (Grundrisse, Netzwerkpläne)
- **Geräte & Netzwerk**: Geräteverwaltung (Server, Switch, Router, Firewall, PC, Drucker, AP, …), IPAM-Lite mit Subnetzvisualisierung, globale Suche
- **Zugangsdaten**: AES-256-verschlüsselter Credential Store mit Passwortgenerator, Copy-to-Clipboard, Kategorien
- **Dokumente**: Upload, Vorschau (Bilder/PDF), Tags, Versionierung
- **Notizen & Aktivitäten**: Markdown-Notizen, Aktivitäts-/Änderungsprotokoll je Gerät
- **Backup**: JSON-Export/-Import der gesamten Datenbank, CSV-Export für Gerätelisten

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · Zustand · React Router v6 · IndexedDB (`idb`) · Web Crypto API (AES-GCM) · react-markdown

## Entwicklung

```bash
npm install
npm run dev      # Dev-Server
npm run build    # Typecheck + Produktions-Build
npm run lint     # Oxlint
```
