# ROADMAP — Tris di Dolci

Le fasi del progetto, nell'ordine. Ogni fase ha il suo prompt nella Parte C di `KIT-CLAUDE-CODE.md`.

## Fasi

- [x] **Fase 0 — Impostazione del progetto**
  - [x] `CLAUDE.md` copiato dal kit
  - [x] Struttura delle cartelle, `package.json` senza dipendenze, `.gitignore`
  - [x] Pagina minima con il titolo su sfondo a gradiente
  - [x] Test funzionanti con `npm test`
  - [x] `README.md` per Marco
- [x] **Fase 1 — Motore di gioco (solo logica e test)**
  - [x] RNG con seed
  - [x] Tabellone con celle e buchi
  - [x] Generazione senza match iniziali e con almeno una mossa valida
  - [x] Ricerca dei match: linee da 3, 4, 5+ e forme L/T
  - [x] Scambio con annullamento se non valido (mossa non consumata)
  - [x] Eliminazione, gravità, riempimento, cascate con moltiplicatore
  - [x] Mosse valide, suggerimento, rimescolo garantito
  - [x] `trySwap` restituisce la lista di passi con id stabili
- [x] **Fase 2 — Tabellone giocabile sul telefono**
  - [x] Le 6 caramelle SVG (`src/ui/pieces.js`)
  - [x] Tabellone e animazioni guidate dai passi (`src/ui/render.js`)
  - [x] Swipe e tocca-tocca (`src/ui/input.js`)
  - [x] HUD: mosse, punteggio, obiettivo
  - [x] Livello di prova (8×8, 5 colori, 25 mosse, 3000 punti)
  - [x] Schermata finale vinto/perso con "Riprova"
  - [x] Suggerimento dopo 5 secondi
- [ ] **Fase 3 — Caramelle speciali**
  - [ ] Creazione di Razzo, Bomba e Arcobaleno con la priorità prevista
  - [ ] Attivazione e reazioni a catena
  - [ ] Le 6 combinazioni speciale + speciale
  - [ ] Grafica, animazioni, punteggi bonus, vibrazione
- [ ] **Fase 4 — Livelli, mappa e salvataggio**
  - [ ] Gelatina e ghiaccio nel motore
  - [ ] Obiettivi: punteggio, raccogli colori, gelatina, ghiaccio
  - [ ] 30 livelli con tip e manina al livello 1
  - [ ] Menu, mappa dei livelli, fine livello, impostazioni
  - [ ] Salvataggio in `localStorage`
  - [ ] Test di validità di tutti i livelli
- [ ] **Fase 5 — Bilanciamento della difficoltà**
  - [ ] `tools/simulate.js` (bot, 200 partite per livello)
  - [ ] Livelli regolati sugli obiettivi di vittoria
  - [ ] Tabella finale in questo file
- [ ] **Fase 6 — Rifinitura e app installabile (PWA)**
  - [ ] `manifest.webmanifest` e icone
  - [ ] `sw.js`: gioco offline e avviso "Nuova versione disponibile"
  - [ ] Rifiniture e prestazioni
  - [ ] Verifica finale: niente risorse esterne, niente audio, console pulita
  - [ ] README finale
- [ ] **Fase 7 (facoltativa) — App Android vera**
  - [ ] Cartella `android-app/` con Capacitor
  - [ ] Guida `docs/ANDROID.md`

## Decisioni

- **Fase 0** — Il repository su GitHub si chiama `Tris-di-dolci` (con la T maiuscola), quindi l'indirizzo di GitHub Pages sarà `https://costamarco-alt.github.io/Tris-di-dolci/`. Tutti i percorsi nel codice sono relativi, quindi il nome del repository non crea problemi.
- **Fase 0** — Le cartelle ancora vuote (`src/ui/`, `src/levels/`, `tools/`, `icons/`) contengono un file `.gitkeep`, perché git non salva le cartelle vuote. Sparirà quando arriveranno i file veri.
- **Fase 0** — I test si lanciano con `node --test` (trova da solo i file `*.test.js`). Serve Node 20 o più recente.
- **Fase 1** — Coordinate: ogni casella è `{ r, c }` (riga e colonna, da 0, partendo in alto a sinistra).
- **Fase 1** — Forma dei passi restituiti da `trySwap`:
  - `swap` / `swapBack`: `{ a: { r, c, id }, b: { r, c, id } }` (posizioni prima dello scambio);
  - `cascade`: `{ n }`, emesso all'inizio di ogni cascata, anche la prima (l'interfaccia mostra il testo da 2 in su);
  - `clear`: `{ cascade, points, cells: [{ r, c, id, color }], groups: [{ color, shape, orientation, cells }] }`;
  - `fall`: `{ moves: [{ id, from, to }] }`;
  - `spawn`: `{ candies: [{ id, color, special, from, to }] }`, con `from.r` negativo (sopra il tabellone);
  - `shuffle`: `{ candies: [{ id, color, special, from, to }], recolored, success }`.
- **Fase 1** — Forme dei match (`shape`): `line3`, `line4`, `line5` (5 o più in fila), `L`, `T`. Una croce conta come `T`. Per ora si eliminano tutte come match normali; gli speciali arrivano con la Fase 3.
- **Fase 1** — Gravità e buchi: le caramelle **attraversano i buchi** (cadono nella prima casella libera sotto) e quelle nuove entrano sempre dall'alto della colonna. È la soluzione più semplice e garantisce che il tabellone si riempia sempre.
- **Fase 1** — Rimescolo: prima si prova a ridistribuire le stesse caramelle; se nessuna disposizione dà una mossa valida (caso raro), si cambiano anche i colori mantenendo gli id (`recolored: true`).
- **Fase 1** — `findValidMoves` dà a ogni mossa uno `score` pari ai punti della prima eliminazione (senza contare le cascate). Il suggerimento è la mossa con lo `score` più alto.
- **Fase 1** — Il layout legge già i simboli di gelatina e ghiaccio (`j J i I`), ma il loro comportamento e gli obiettivi diversi dal punteggio arrivano con la Fase 4. Le mosse avanzate diventano punti solo per quegli obiettivi, quindi anche questo arriva con la Fase 4.
- **Fase 1** — Un livello per cui non si riesce a generare un tabellone giocabile (per esempio 2×2) fa fallire `createGame` con un errore chiaro: servirà al test di validità dei livelli della Fase 4.
- **Fase 2** — Il livello di prova usa i valori chiesti dal kit (25 mosse, 3000 punti). Senza caramelle speciali un bot lo vince circa una volta su tre: diventerà più facile con i bonus della Fase 3 e verrà bilanciato nella Fase 5.
- **Fase 2** — Le animazioni usano la Web Animations API del browser (`element.animate`), solo su `transform` e `opacity`. Ogni caramella è un elemento posizionato con `transform`, quindi il tabellone si adatta allo schermo senza ricalcoli.
- **Fase 2** — Caduta e arrivo delle nuove caramelle (passi `fall` e `spawn`) vengono animati insieme.
- **Fase 2** — Aprendo la pagina con `?debug` (e, volendo, `&seed=7` per una partita sempre uguale) si attiva `window.trisDebug`, usato solo per le prove automatiche con il browser.
- **Fase 2** — Provato con Chromium a 390×844, 412×915 e 360×640: swipe, tocca-tocca, partita intera, schermata finale, "Riprova" e suggerimento dopo 5 secondi. Nessun errore in console, nessuna risorsa esterna.
