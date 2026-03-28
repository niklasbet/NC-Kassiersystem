# NS Kassiersystem

Modernisiertes Expo-Kassensystem mit Fokus auf schnelle Bedienung, klare Produktverwaltung und nachvollziehbare Tagesstatistiken.

## Highlights

- Refactorte Datenarchitektur mit zentralem App-Store (`AppDataContext`)
- Persistenz via `AsyncStorage` für Produkte, Tagesauswahl und Bestellhistorie
- Neu gestaltete Kassenoberfläche mit Produktkarten und Live-Bestellübersicht
- Überarbeitete Statistikansicht mit KPI-Karten und Verteilungsdiagramm
- Aufgeräumte Produktverwaltung (Bearbeiten, Bildauswahl, Statistik-Toggle)
- Bestellverlauf mit Pagination und Löschfunktion

## Tech Stack

- Expo Router
- React Native
- React Native Paper
- TypeScript (strict)

## Start

```bash
npm install
npm run start
```

## Qualitätschecks

```bash
npx tsc --noEmit
npm run lint
```

## Projektstruktur (Auszug)

- `app/(tabs)/index.tsx`: Kassenansicht
- `app/(tabs)/explore.tsx`: Statistikansicht
- `app/buttonView.tsx`: Produktverwaltung
- `app/historyView.tsx`: Bestellverlauf
- `app/store/`: zentraler Zustand + Persistenz
- `app/theme/`: Theme und Farbpalette
- `app/utils/`: Formatter/Utilities
