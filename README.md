# IT-Doku

Offline-fähige IT-Dokumentations-Webanwendung für IT-Administratoren im KMU-Umfeld. Single-Page-Application mit React, TypeScript und lokaler Datenpersistenz über IndexedDB – kein Backend erforderlich.

## Funktionen

- **Standortverwaltung**: Standorte, Räume/Bereiche, Bilder (Grundrisse, Fotos, Netzwerkpläne)
- **Geräte & Netzwerk**: vollständige Gerätestammdaten, IPAM-Lite mit Subnetz-Visualisierung
- **Zugangsdaten**: AES-256-verschlüsselter Credential Store mit Master-Passwort, Passwortgenerator
- **Dokumente**: Upload, Vorschau (Bild/PDF), Tags, Versionierung
- **Notizen & Änderungsprotokoll**: Markdown-Notizen mit Aufgabenlisten, Aktivitäts-/Änderungsprotokoll
- **Globale Suche**: Standorte, Geräte, IPs, MAC-Adressen, Zugangsdaten, Dokumente, Notizen (⌘K)
- **Backup**: verschlüsselter JSON-Export/-Import der gesamten Datenbank, CSV-Export für Gerätelisten
- **Dark Mode**

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · Zustand · React Router v6 · IndexedDB (`idb`) · Web Crypto API (AES-GCM) · react-markdown

## Entwicklung

```bash
npm install
npm run dev      # Dev-Server
npm run build    # Typecheck + Production-Build
npm run lint     # Oxlint
```

Alle Daten werden ausschließlich lokal im Browser (IndexedDB) gespeichert. Beim ersten Start wird ein Master-Passwort festgelegt, mit dem alle Zugangsdaten verschlüsselt werden.
