# ROADMAP — Tris di Dolci

Le fasi del progetto, nell'ordine. Ogni fase ha il suo prompt nella Parte C di `KIT-CLAUDE-CODE.md`.

## Fasi

- [x] **Fase 0 — Impostazione del progetto**
  - [x] `CLAUDE.md` copiato dal kit
  - [x] Struttura delle cartelle, `package.json` senza dipendenze, `.gitignore`
  - [x] Pagina minima con il titolo su sfondo a gradiente
  - [x] Test funzionanti con `npm test`
  - [x] `README.md` per Marco
- [ ] **Fase 1 — Motore di gioco (solo logica e test)**
  - [ ] RNG con seed
  - [ ] Tabellone con celle e buchi
  - [ ] Generazione senza match iniziali e con almeno una mossa valida
  - [ ] Ricerca dei match: linee da 3, 4, 5+ e forme L/T
  - [ ] Scambio con annullamento se non valido (mossa non consumata)
  - [ ] Eliminazione, gravità, riempimento, cascate con moltiplicatore
  - [ ] Mosse valide, suggerimento, rimescolo garantito
  - [ ] `trySwap` restituisce la lista di passi con id stabili
- [ ] **Fase 2 — Tabellone giocabile sul telefono**
  - [ ] Le 6 caramelle SVG (`src/ui/pieces.js`)
  - [ ] Tabellone e animazioni guidate dai passi (`src/ui/render.js`)
  - [ ] Swipe e tocca-tocca (`src/ui/input.js`)
  - [ ] HUD: mosse, punteggio, obiettivo
  - [ ] Livello di prova (8×8, 5 colori, 25 mosse, 3000 punti)
  - [ ] Schermata finale vinto/perso con "Riprova"
  - [ ] Suggerimento dopo 5 secondi
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
