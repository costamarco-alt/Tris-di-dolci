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
- [x] **Fase 3 — Caramelle speciali**
  - [x] Creazione di Razzo, Bomba e Arcobaleno con la priorità prevista
  - [x] Attivazione e reazioni a catena
  - [x] Le 6 combinazioni speciale + speciale
  - [x] Grafica, animazioni, punteggi bonus, vibrazione
- [x] **Fase 4 — Livelli, mappa e salvataggio**
  - [x] Gelatina e ghiaccio nel motore
  - [x] Obiettivi: punteggio, raccogli colori, gelatina, ghiaccio
  - [x] 30 livelli con tip e manina al livello 1
  - [x] Menu, mappa dei livelli, fine livello, impostazioni
  - [x] Salvataggio in `localStorage`
  - [x] Test di validità di tutti i livelli
- [x] **Fase 5 — Bilanciamento della difficoltà**
  - [x] `tools/simulate.js` (bot, 200 partite per livello)
  - [x] Livelli regolati sugli obiettivi di vittoria
  - [x] Tabella finale in questo file
- [ ] **Fase 6 — Rifinitura e app installabile (PWA)**
  - [ ] `manifest.webmanifest` e icone
  - [ ] `sw.js`: gioco offline e avviso "Nuova versione disponibile"
  - [ ] Rifiniture e prestazioni
  - [ ] Verifica finale: niente risorse esterne, niente audio, console pulita
  - [ ] README finale
- [ ] **Fase 7 (facoltativa) — App Android vera**
  - [ ] Cartella `android-app/` con Capacitor
  - [ ] Guida `docs/ANDROID.md`

## Bilanciamento (Fase 5)

Risultato di `node tools/simulate.js --markdown`: un bot gioca ogni livello 200 volte scegliendo sempre la mossa con il punteggio immediato più alto. "Stelle medie" e "Mosse avanzate" sono calcolate sulle partite vinte.

| Livello | Obiettivo | Mosse | Vittorie | Stelle medie | Mosse avanzate | Fascia voluta | In fascia |
|---|---|---|---|---|---|---|---|
| 1 | punteggio | 25 | 98% | 1.6 | 0.0 | 90–100% | sì |
| 2 | punteggio | 25 | 96% | 1.6 | 0.0 | 90–100% | sì |
| 3 | punteggio | 24 | 97% | 1.7 | 0.0 | 90–100% | sì |
| 4 | punteggio | 24 | 96% | 1.6 | 0.0 | 90–100% | sì |
| 5 | punteggio | 23 | 93% | 1.6 | 0.0 | 90–100% | sì |
| 6 | raccolta | 16 | 83% | 1.7 | 6.7 | 60–85% | sì |
| 7 | raccolta | 18 | 83% | 1.6 | 5.9 | 60–85% | sì |
| 8 | raccolta | 22 | 82% | 1.6 | 8.2 | 60–85% | sì |
| 9 | raccolta | 15 | 73% | 1.7 | 5.5 | 60–85% | sì |
| 10 | raccolta | 18 | 74% | 1.6 | 5.6 | 60–85% | sì |
| 11 | gelatina | 26 | 75% | 1.7 | 12.3 | 60–85% | sì |
| 12 | gelatina | 31 | 76% | 1.6 | 15.8 | 60–85% | sì |
| 13 | gelatina | 33 | 73% | 1.7 | 13.5 | 60–85% | sì |
| 14 | gelatina | 33 | 72% | 1.7 | 14.7 | 60–85% | sì |
| 15 | gelatina | 37 | 67% | 1.7 | 14.4 | 60–85% | sì |
| 16 | ghiaccio | 28 | 64% | 1.7 | 12.1 | 35–70% | sì |
| 17 | ghiaccio | 32 | 68% | 1.6 | 13.3 | 35–70% | sì |
| 18 | ghiaccio | 32 | 61% | 1.7 | 11.4 | 35–70% | sì |
| 19 | ghiaccio | 28 | 56% | 1.7 | 10.0 | 35–70% | sì |
| 20 | ghiaccio | 34 | 56% | 1.7 | 13.4 | 35–70% | sì |
| 21 | punteggio | 22 | 50% | 2.1 | 0.0 | 35–70% | sì |
| 22 | raccolta | 21 | 53% | 1.8 | 4.4 | 35–70% | sì |
| 23 | gelatina | 18 | 59% | 1.6 | 6.4 | 35–70% | sì |
| 24 | ghiaccio | 37 | 50% | 1.7 | 13.8 | 35–70% | sì |
| 25 | raccolta | 22 | 50% | 1.7 | 4.2 | 35–70% | sì |
| 26 | gelatina | 28 | 48% | 1.6 | 9.3 | 35–70% | sì |
| 27 | ghiaccio | 38 | 50% | 1.7 | 12.0 | 35–70% | sì |
| 28 | raccolta | 28 | 45% | 1.6 | 5.5 | 35–70% | sì |
| 29 | gelatina | 34 | 45% | 1.7 | 10.8 | 35–70% | sì |
| 30 | gelatina | 34 | 39% | 1.8 | 10.7 | 35–70% | sì |

Partite per livello: 200.
Tutti i livelli sono nella fascia voluta.

Il bot non ragiona sull'obiettivo (per esempio non cerca apposta la gelatina), quindi una persona attenta vince un po' più spesso di così.

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
- **Fase 3** — Quando nasce uno speciale, tutte le caramelle del match vengono eliminate e nella casella giusta compare una caramella **nuova** (con un id nuovo): passo `createSpecial` `{ id, r, c, color, special, points }`. Il bonus di creazione non viene moltiplicato dalla cascata.
- **Fase 3** — Passo `activate`: `{ id, r, c, special, color, cells, combo?, targetColor? }`. Gli `activate` di un'eliminazione arrivano prima del relativo `clear`, nell'ordine della reazione a catena. Ogni speciale si attiva una volta sola.
- **Fase 3** — Le combinazioni partono dalla **casella di arrivo** dello scambio. Dopo una combinazione le cascate continuano dal numero 2.
- **Fase 3** — Arcobaleno + Razzo: le caramelle di quel colore diventano Razzi con orientamento casuale (passi `createSpecial` con `converted: true`, stesso id). Arcobaleno + Bomba: uguale, con le Bombe.
- **Fase 3** — Un Arcobaleno colpito da un'esplosione (cioè non scambiato dal giocatore) elimina il colore più presente sul tabellone in quel momento.
- **Fase 3** — Un Razzo o una Bomba scambiati con una caramella normale seguono la regola solita: serve un match. Entrano nei match con il loro colore e si attivano quando vengono eliminati.
- **Fase 3** — Vibrazione: 10 ms quando nasce uno speciale, 18 ms quando si attiva, una breve sequenza alla vittoria. L'interruttore nelle impostazioni arriva con la Fase 4.
- **Fase 4** — Ghiaccio: una caramella ghiacciata colpita perde uno strato e resta dov'è (passo `iceHit` `{ cells: [{ r, c, ice }] }`). Tre caramelle ghiacciate allineate si liberano alla prima eliminazione e vengono tolte a quella dopo. Uno speciale ghiacciato non si attiva finché è nel ghiaccio. Uno speciale non nasce mai sopra una caramella ghiacciata: nasce in un'altra casella liberata del gruppo.
- **Fase 4** — Gelatina: passo `jellyHit` `{ cells: [{ r, c, jelly }] }`, subito dopo il `clear`. Nel layout una casella è o gelatina o ghiaccio, non tutte e due.
- **Fase 4** — Gravità con il ghiaccio: la caramella ghiacciata non cade e blocca la colonna. Le caselle vuote sotto si riempiono in diagonale dalla casella in alto a sinistra o in alto a destra (passo `fall` con `diagonal: true`); se non c'è nessuna caramella libera vicino, la casella resta vuota finché il ghiaccio non si rompe.
- **Fase 4** — Mosse avanzate: per gli obiettivi diversi dal punteggio, alla vittoria diventano 150 punti l'una (passo `bonus` `{ moves, points }`). Per l'obiettivo "punteggio" si giocano sempre tutte le mosse.
- **Fase 4** — "Obiettivi misti" (livelli 21–25) significa che i livelli alternano i quattro tipi di obiettivo; ogni livello ne ha uno solo. I contatori di gelatina e ghiaccio contano gli strati rimasti.
- **Fase 4** — Se nemmeno il rimescolo trova una mossa (caso estremo, mai visto nelle simulazioni) il livello finisce come perso invece di bloccarsi.
- **Fase 4** — Prima di ogni livello compare una scheda con l'obiettivo e, se c'è, il consiglio (`tip`). La mappa va dall'alto (livello 1) verso il basso.
- **Fase 4** — Azzerare i progressi cancella stelle e livelli sbloccati ma lascia le impostazioni.
- **Fase 4** — Mosse e soglie delle stelle dei 30 livelli sono una prima taratura fatta con un bot; la messa a punto vera è la Fase 5.
- **Fase 5** — Mosse, obiettivi e stelle sono stati calcolati dalle simulazioni: per ogni livello si è scelta la percentuale di vittorie voluta (dal 97% del livello 1 al 41% del livello 30, in discesa graduale) e da lì il numero di mosse o il punteggio da raggiungere. Le stelle: la prima coincide con il minimo per vincere, la seconda con il punteggio di una partita vinta "media", la terza con quello delle partite migliori (circa una su sei).
- **Fase 5** — Alcuni livelli con ostacoli sono stati alleggeriti (meno gelatina doppia o ghiaccio) perché richiedevano troppe mosse: nessun livello supera le 38 mosse.
- **Fase 5** — Con 200 partite la percentuale di un livello oscilla di 3–4 punti: per questo le percentuali volute stanno lontane dai bordi delle fasce.
