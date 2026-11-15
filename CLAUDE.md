# CLAUDE.md — Tris di Dolci

## Il progetto
Gioco puzzle match-3 a tema caramelle per browser mobile (PWA). Appartiene al genere di Candy Crush, ma grafica, nomi e testi sono **completamente originali**.

Il proprietario è Marco. Non è uno sviluppatore web: spiegagli le cose in italiano semplice.

Lingua dell'interfaccia: **italiano**.

## Regole non negoziabili
1. **Niente pubblicità, niente musica, niente audio di alcun tipo**: nessun file audio, nessuna Web Audio API, nessun elemento `<audio>`. Il feedback è solo visivo, più una vibrazione facoltativa.
2. **Niente vite, timer d'attesa, valute, acquisti, login o notifiche push.** Si gioca e basta.
3. **Nessuna risorsa caricata da indirizzi esterni**: niente CDN, Google Fonts, analytics, SDK o iframe. Tutto arriva dal repository e si usano i font di sistema. Il namespace SVG `http://www.w3.org/2000/svg` va bene.
4. **Nessuna dipendenza nel gioco**: niente `npm install`, framework o bundler. HTML, CSS e JavaScript (moduli ES) che GitHub Pages serve così come sono. Se pensi che serva una dipendenza, **chiedi prima**.
5. **Nessun asset, nome, logo o testo di Candy Crush/King** o di altri giochi. La grafica è disegnata in codice (SVG/CSS) ed è originale. Usa i nomi del gioco definiti qui sotto.
6. **Logica separata dalla grafica**: `src/engine/` non tocca mai il DOM e si testa con Node.
7. **Mobile-first, in verticale**: deve essere fluido su un telefono di fascia media.
8. **Percorsi sempre relativi** (`./...`), mai con `/` iniziale. Il sito vive nel sottopercorso `/tris-di-dolci/` di GitHub Pages, quindi la regola vale anche per import, manifest e service worker.
9. **Non modificare `KIT-CLAUDE-CODE.md`**: è il documento di partenza di Marco.

## Struttura delle cartelle
```
index.html                 una sola pagina, carica src/main.js come modulo
styles.css
manifest.webmanifest       PWA (Fase 6)
sw.js                      service worker per l'offline (Fase 6)
icons/                     icone PWA
package.json               solo "type": "module" e lo script "test", nessuna dipendenza
src/
  main.js                  avvio, collega motore e interfaccia
  config.js                costanti: punteggi, tempi delle animazioni, dimensioni
  strings.js               tutti i testi dell'interfaccia (italiano)
  storage.js               salvataggio progressi (localStorage, sempre in try/catch)
  engine/                  LOGICA PURA, senza DOM
    rng.js                 generatore casuale con seed (partite riproducibili nei test)
    board.js               griglia, celle, generazione senza match iniziali
    match.js               ricerca dei match: linee da 3/4/5+, forme L e T
    resolve.js             ciclo elimina → gravità → riempi → ricontrolla (cascate)
    specials.js            caramelle speciali e loro combinazioni
    moves.js               mosse valide, suggerimento, rimescolo
    game.js                stato partita: mosse, punteggio, obiettivi, stelle, vittoria e sconfitta
  levels/levels.js         definizione dei livelli (solo dati)
  ui/
    pieces.js              SVG delle caramelle
    render.js              disegno e animazioni del tabellone
    input.js               swipe e tocca-tocca (Pointer Events)
    hud.js                 mosse, punteggio, obiettivo, stelle
    screens.js             menu, mappa dei livelli, fine livello, impostazioni
tests/                     test per il test runner integrato di Node (*.test.js)
tools/simulate.js          bot che gioca i livelli per il bilanciamento (Fase 5)
ROADMAP.md                 fasi con checklist + registro delle decisioni
README.md                  per Marco: cos'è, come si gioca, come si pubblica
```

## Modello dei dati
**Cella**: `{ candy: Candy|null, hole: boolean, jelly: 0|1|2, ice: 0|1|2 }`
- `hole`: la casella non fa parte del tabellone (serve per le forme non rettangolari).
- `jelly`: strati di gelatina sotto la caramella. Ne sparisce uno ogni volta che la caramella sopra viene eliminata.
- `ice`: strati di ghiaccio sopra la caramella. Una caramella ghiacciata:
  - non si può scambiare e non cade;
  - perde uno strato quando fa parte di un match o viene colpita da uno speciale, e viene eliminata solo quando il ghiaccio è finito;
  - fa da appoggio alle caramelle sopra. Le caselle vuote sotto di lei si riempiono con caramelle che scivolano in diagonale dalle colonne vicine.

**Caramella**: `{ id: number, color: 0..5, special: null|'rocketH'|'rocketV'|'bomb'|'rainbow' }`
- `id` è univoco e stabile: l'interfaccia lo usa per sapere quale elemento animare.

Per ogni mossa il motore restituisce una **lista di passi** (`steps`) che l'interfaccia anima in ordine:
`swap`, `swapBack`, `clear`, `createSpecial`, `activate`, `fall`, `spawn`, `jellyHit`, `iceHit`, `shuffle`, `cascade` (con il numero della cascata).
L'interfaccia non ricalcola mai la logica: si limita ad animare i passi.

API indicativa del motore:
```js
createGame(levelDef, seed)        // → state
trySwap(state, from, to)          // → { valid, steps }  (modifica state solo se valid)
findValidMoves(state)             // → [{ from, to, score }]
getHint(state)                    // → una mossa valida
getStatus(state)                  // → 'playing' | 'won' | 'lost'
getStars(state)                   // → 0..3
```

## Regole di gioco
- Tabellone fino a 9×9 (di solito 8×8), con 4–6 colori a seconda del livello.
- Si scambiano due caselle **adiacenti** (niente diagonali). Se lo scambio non crea un match, le caramelle tornano al loro posto e **la mossa non viene consumata**.
  - Eccezione: scambiare due speciali tra loro, o un Arcobaleno con qualsiasi caramella, è sempre valido.
- Un match è fatto da 3 o più caramelle dello stesso colore in riga o in colonna.

**Caramelle speciali** (nomi di questo gioco):

| Si crea con | Nome | Effetto |
|---|---|---|
| 4 in fila | **Razzo**: orizzontale se la fila è orizzontale, verticale se è verticale | elimina tutta la riga o tutta la colonna |
| forma a L o a T | **Bomba** | esplode in un'area 3×3 |
| 5 in fila | **Arcobaleno** | scambiato con una caramella, elimina tutte quelle di quel colore |

- Se un gruppo soddisfa più forme, vale questa priorità: Arcobaleno, poi Bomba, poi Razzo.
- Lo speciale nasce nella casella mossa dal giocatore, se fa parte del match; altrimenti al centro del gruppo.
- Uno speciale coinvolto in un'eliminazione si attiva (le reazioni a catena sono ammesse).

**Combinazioni** (scambiando due speciali tra loro):

| Combinazione | Effetto |
|---|---|
| Razzo + Razzo | croce: riga e colonna |
| Razzo + Bomba | 3 righe e 3 colonne |
| Bomba + Bomba | area 5×5 |
| Arcobaleno + Razzo | tutte le caramelle di quel colore diventano Razzi e si attivano |
| Arcobaleno + Bomba | tutte le caramelle di quel colore diventano Bombe e si attivano |
| Arcobaleno + Arcobaleno | svuota tutto il tabellone |

**Cascate**: dopo ogni eliminazione le caramelle cadono, ne arrivano di nuove dall'alto e si ricontrollano i match. Ogni cascata fa salire il moltiplicatore.

**Punteggio** (i valori stanno in `config.js` e vanno bilanciati):
- 10 punti per caramella, moltiplicati per il numero della cascata;
- bonus per la creazione di uno speciale: Razzo 60, Bomba 120, Arcobaleno 200;
- a livello vinto, ogni mossa avanzata vale 150 punti.

**Vittoria**:
- Obiettivo "punteggio": si giocano tutte le mosse e si vince se il punteggio finale raggiunge il target.
- Altri obiettivi: si vince appena l'obiettivo è completato, e le mosse avanzate diventano punti.
- Le stelle (1–3) dipendono dal punteggio finale. Un livello vinto dà sempre almeno 1 stella.

**Tabellone sempre giocabile**: il tabellone iniziale non ha match e ha almeno una mossa valida. Se le mosse finiscono, parte un **rimescolo** automatico (con la scritta "Rimescolo!") che garantisce almeno una mossa e nessun match.

**Suggerimento**: dopo 5 secondi senza toccare lo schermo, una mossa valida pulsa leggermente.

**Testi di incoraggiamento** (originali) per le cascate lunghe:

| Cascata | Testo |
|---|---|
| 2 | "Bene!" |
| 3 | "Gustoso!" |
| 4 | "Che bontà!" |
| 5 e oltre | "Spettacolo!" |

## Livelli
Formato in `src/levels/levels.js`:
```js
{
  id: 1,
  moves: 20,
  colors: 5,
  goal: { type: 'score', target: 3000 },
  // altri tipi: { type: 'collect', items: [{ color: 0, count: 20 }] }
  //             { type: 'jelly' }   → togliere tutta la gelatina
  //             { type: 'ice' }     → rompere tutto il ghiaccio
  stars: [3000, 5000, 7500],        // soglie di punteggio per 1/2/3 stelle (crescenti)
  layout: [                          // facoltativo; senza layout = 8×8 pieno
    '........',                      // .  casella normale     x  buco
    '..jjjj..',                      // j  gelatina            J  gelatina doppia
    '.jJJJJj.',                      // i  ghiaccio            I  ghiaccio doppio
    // ...
  ],
  tip: 'Fai 4 in fila per creare un Razzo!'  // facoltativo, mostrato all'inizio del livello
}
```

Progressione dei primi 30 livelli:

| Livelli | Contenuto |
|---|---|
| 1–5 | obiettivo punteggio, 5 colori, tante mosse; il livello 1 mostra una manina che fa vedere lo swipe |
| 6–10 | raccogliere caramelle di un colore |
| 11–15 | gelatina |
| 16–20 | ghiaccio |
| 21–25 | tabelloni con buchi e forme, obiettivi misti |
| 26–30 | 6 colori, meno mosse, ostacoli combinati |

Ogni nuova meccanica viene presentata con un `tip` di una riga.

## Interfaccia e grafica
**Caramelle**: SVG disegnati in codice, ognuna con **colore e forma diversi**, così si distinguono anche per chi è daltonico:
- cuore rosso
- cerchio arancio
- stella gialla
- foglia verde
- rombo blu
- luna viola

Hanno lucentezza (gradiente e riflesso) e un'ombra leggera.

**Speciali** riconoscibili a colpo d'occhio:
- Razzo: strisce e scia nella direzione in cui spara.
- Bomba: alone che pulsa.
- Arcobaleno: sfera multicolore.

**Stile generale**: sfondo a gradiente morbido, colori vivaci ma non accecanti, angoli arrotondati.

**Schermate**, nell'ordine:
1. Menu iniziale.
2. Mappa dei livelli: percorso verticale da scorrere, con le stelle ottenute e un lucchetto sui livelli bloccati.
3. Partita.
4. Fine livello. Se vinto: stelle animate e pulsante "Prossimo". Se perso: pulsante "Riprova".
5. Impostazioni: vibrazione sì/no, animazioni ridotte, azzera progressi. La conferma per azzerare si chiede dentro la pagina, mai con `alert()` o `confirm()`.

**HUD in alto**: numero del livello, mosse rimaste, punteggio con barra delle stelle, obiettivo con contatore.

**Animazioni** (tempi in `config.js`), solo con `transform` e `opacity`:
- scambio: circa 150 ms;
- eliminazione: rimpicciolimento e piccole particelle, circa 200 ms;
- caduta: accelerazione e lieve rimbalzo;
- testo della cascata: sale e svanisce.

**Input**:
- Pointer Events, con swipe (soglia circa il 30% della casella) **e** tocca-tocca.
- `touch-action: none` sul tabellone, così non partono zoom o selezioni di testo per sbaglio.
- Input bloccato mentre girano le animazioni, con una macchina a stati: `idle → swapping → resolving → idle`.

**Accessibilità e comfort**:
- Rispetta `prefers-reduced-motion` e l'impostazione "animazioni ridotte".
- Vibrazione breve (`navigator.vibrate`) su speciali e vittoria, solo se il telefono la supporta e l'impostazione è attiva.

**Adattamento allo schermo**: il tabellone è un quadrato che sta nello spazio disponibile. Funziona da 360 px di larghezza in su, e anche su PC con il mouse.

## Salvataggio
In `localStorage`, chiave `trisdidolci.v1`, si salvano:
- il livello massimo sbloccato;
- stelle e record di ogni livello;
- le impostazioni.

Tutto va in try/catch: se il salvataggio non funziona, il gioco va avanti lo stesso.

## Come lavorare
- All'inizio di ogni sessione leggi `ROADMAP.md` per sapere a che punto siamo.
- Fai commit piccoli, con messaggi in italiano.
- **I test sono obbligatori**: `npm test` (test runner integrato di Node) deve passare prima di ogni commit. Ogni bug corretto riceve un test che lo riproduce.
- Il motore usa sempre l'RNG con seed, così nei test le partite sono riproducibili.
- **Prova visiva**: se nell'ambiente ci sono già Playwright e Chromium, apri il gioco con un piccolo server locale, fai screenshot a 390×844 e a 412×915 e controlla che la console non abbia errori. Se non ci sono e la rete non permette di installarli, non forzare: segnalalo e vai avanti.
- **Prima di chiudere una fase** verifica che:
  1. i test siano verdi;
  2. non venga caricata nessuna risorsa esterna;
  3. non ci sia audio;
  4. `ROADMAP.md` sia aggiornato (casella spuntata e decisioni prese);
  5. `README.md` sia aggiornato.
- Se qualcosa nella specifica non è chiaro, scegli la soluzione più semplice e annotala in `ROADMAP.md` sotto "Decisioni".
- Alla fine di ogni fase scrivi a Marco un riassunto breve in italiano: cosa è stato fatto, cosa provare sul telefono, cosa viene dopo.
