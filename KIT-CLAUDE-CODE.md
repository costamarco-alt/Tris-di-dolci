# 🍬 Tris di Dolci — Kit completo per Claude Code

> Gioco puzzle "match-3" a tema caramelle (il genere di Candy Crush), **senza pubblicità, senza musica, senza vite, senza acquisti, senza tracciamento**.
> Si gioca dal browser del telefono e si installa sulla schermata Home come un'app.
> Nome provvisorio: **Tris di Dolci** (puoi cambiarlo quando vuoi: basta chiederlo a Claude Code).

| Parte | Cosa contiene | Per chi |
|---|---|---|
| **A** | Preparazione di GitHub e Claude Code (una volta sola) | Te |
| **B** | Il `CLAUDE.md`: specifica del gioco e regole del progetto | Claude Code |
| **C** | I prompt da incollare, fase per fase | Da te a Claude Code |
| **D** | Provare il gioco, pubblicarlo, problemi comuni | Te |

### Scelte tecniche (già decise)
- **HTML + CSS + JavaScript puro**, senza framework, senza compilazione e senza librerie esterne. Perché:
  - si pubblica gratis su **GitHub Pages** così com'è;
  - senza librerie di terzi non può entrare di nascosto pubblicità o tracciamento;
  - Claude Code lo può provare e testare da solo.
- **Test automatici** con il motore di test già incluso in Node.js, quindi non c'è niente da installare.
- **PWA**: si installa su Android e iPhone e funziona anche offline.
- **App Android vera** (APK o Play Store): facoltativa, alla fine (Fase 7).

---

# PARTE A — Preparazione (circa 10 minuti, una volta sola)

### A1. Crea il repository su GitHub
1. Vai su **https://github.com/new**
2. **Repository name**: `tris-di-dolci`
3. Visibilità **Public**. GitHub Pages è gratis solo per i repository pubblici; il codice sarà visibile a tutti, e per un gioco va benissimo.
4. Spunta **Add a README file**: Claude Code lavora solo su repository che contengono già almeno un file.
5. Tocca **Create repository**.

### A2. Metti questo file nel repository
- **Opzione 1, caricamento**: nel repository tocca **Add file → Upload files**, scegli `KIT-CLAUDE-CODE.md` e poi **Commit changes**.
- **Opzione 2, copia e incolla**: tocca **Add file → Create new file**, chiamalo `KIT-CLAUDE-CODE.md`, incolla tutto il contenuto e poi **Commit changes**.

> Dal telefono: se non vedi "Add file", apri il menu del browser e attiva **Sito desktop**.

### A3. Collega Claude Code a GitHub
1. Se non l'hai già fatto, apri **https://claude.ai/code**, accedi e segui la richiesta di collegare GitHub (autorizza e torni su Claude).
2. Installa anche la **Claude GitHub App** e dalle accesso al repository:
   - apri **https://github.com/apps/claude/installations/new**
   - scegli il tuo account
   - seleziona **Only select repositories**, poi `tris-di-dolci`
   - conferma con Install o Save.

   È obbligatoria per i repository privati; su quelli pubblici evita problemi di permessi.

### A4. Avvia la prima sessione
1. Apri l'app Claude, scheda **Code** (oppure https://claude.ai/code dal browser).
2. Nel **selettore del repository** sotto il campo di testo scegli `tris-di-dolci`, branch `main`.
3. Modalità **Plan** per la Fase 0: Claude ti mostra il piano e aspetta il tuo OK prima di toccare i file.
4. Incolla il **Prompt della Fase 0** (Parte C) e invia.

### A5. Il ciclo di ogni fase
1. Apri una **nuova sessione** Code sul repository `tris-di-dolci`, branch `main`.
2. Scegli la modalità **Auto** se è disponibile, altrimenti **Accept edits**: Claude lavora senza fermarsi a chiederti conferma per ogni file.
3. Incolla il prompt della fase e invia.
4. Quando Claude ha finito, pubblica un branch. Tocca l'indicatore delle modifiche (per esempio `+420 −12`) per vedere cosa è cambiato, poi tocca **Create PR**.
5. Su GitHub apri la Pull Request, tocca **Merge pull request** e poi **Confirm merge**.
6. Passa alla fase successiva **solo dopo il merge**: così la nuova sessione parte dal lavoro già fatto.

> **Una sessione per fase.** Le conversazioni restano corte e precise. Tra una sessione e l'altra la "memoria" del progetto sta in `CLAUDE.md` e `ROADMAP.md`, che Claude Code legge ogni volta.

### A6. Pubblica il gioco (dopo la Fase 2)
1. Nel repository apri **Settings → Pages**.
2. In **Build and deployment**, alla voce Source, scegli **Deploy from a branch**.
3. Branch **main**, cartella **/ (root)**, poi **Save**.
4. Dopo 1–2 minuti il gioco è online su `https://TUO-UTENTE-GITHUB.github.io/tris-di-dolci/`
5. Sul telefono apri il link e installalo:
   - **Android**: menu del browser → **Aggiungi a schermata Home**
   - **iPhone**: **Condividi → Aggiungi alla schermata Home**

Da quel momento ogni merge su `main` aggiorna il gioco da solo.

---

# PARTE B — Il CLAUDE.md

> Nella Fase 0 Claude Code copia tutto il testo compreso tra i due marcatori qui sotto in un file `CLAUDE.md` nella radice del repository. Claude Code rilegge `CLAUDE.md` automaticamente all'inizio di ogni sessione.

<!-- INIZIO CLAUDE.md -->
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
<!-- FINE CLAUDE.md -->

---

# PARTE C — I prompt, fase per fase

Per ogni fase:
1. copia il blocco;
2. incollalo in una **nuova sessione** Code sul repository `tris-di-dolci` (branch `main`);
3. invia.

Passa alla fase successiva solo dopo aver fatto il merge di quella precedente (vedi A5).

### Fase 0 — Impostazione del progetto (modalità Plan)
```
Leggi per intero KIT-CLAUDE-CODE.md: è la specifica del progetto.
1. Crea CLAUDE.md nella radice copiando esattamente il testo compreso tra i marcatori "INIZIO CLAUDE.md" e "FINE CLAUDE.md" (marcatori esclusi).
2. Crea ROADMAP.md con le fasi da 1 a 7 della Parte C come checklist, più una sezione "Decisioni" vuota.
3. Crea la struttura di cartelle prevista, un package.json senza dipendenze (type module + script test), .gitignore, un index.html e uno styles.css minimi che mostrano il titolo "Tris di Dolci" su uno sfondo a gradiente, e un test di esempio che passa.
4. Scrivi README.md in italiano per Marco: cos'è il gioco, come si prova, come si pubblica.
Non scrivere ancora la logica di gioco. Mostrami prima il piano; dopo il mio OK esegui, lancia i test e fai commit.
```

### Fase 1 — Motore di gioco (solo logica e test)
```
Fase 1 della ROADMAP: il motore di gioco in src/engine/, senza grafica.
Implementa:
- RNG con seed;
- tabellone con celle e buchi;
- generazione senza match iniziali e con almeno una mossa valida;
- ricerca dei match: linee da 3, 4, 5+ e forme L/T (per ora riconosciute ma eliminate come match normali);
- scambio con annullamento se non valido (mossa non consumata);
- eliminazione, gravità, riempimento, cascate con moltiplicatore;
- ricerca delle mosse valide, suggerimento, rimescolo garantito.
trySwap deve restituire la lista di passi (steps) descritta in CLAUDE.md, con gli id stabili delle caramelle.
Scrivi test approfonditi per ogni regola, compresi i casi limite: bordi, buchi, cascate lunghe, tabellone senza mosse.
Con tutti i test verdi aggiorna ROADMAP.md e fai commit.
```

### Fase 2 — Tabellone giocabile sul telefono
```
Fase 2 della ROADMAP: rendi il gioco giocabile.
- src/ui/pieces.js: le 6 caramelle SVG originali descritte in CLAUDE.md (forma e colore diversi).
- src/ui/render.js: tabellone che si adatta allo schermo, con animazioni guidate dalla lista di passi del motore: scambio, scambio annullato, eliminazione con particelle, caduta con rimbalzo, nuove caramelle, rimescolo, testo della cascata.
- src/ui/input.js: swipe e tocca-tocca con Pointer Events, input bloccato durante le animazioni.
- HUD con mosse, punteggio e obiettivo.
- Un livello di prova: 8×8, 5 colori, 25 mosse, 3000 punti.
- Schermata finale vinto/perso con "Riprova".
- Suggerimento dopo 5 secondi di inattività.
Deve girare fluido su un telefono di fascia media. Se puoi, verifica con screenshot a 390×844 e controlla che la console non abbia errori.
Test verdi, ROADMAP aggiornata, commit.
Alla fine spiegami in due righe come provarlo sul telefono con GitHub Pages.
```

### Fase 3 — Caramelle speciali
```
Fase 3 della ROADMAP: caramelle speciali e combinazioni, come da tabelle in CLAUDE.md.
- Creazione di Razzo (4 in fila, orientato come la fila), Bomba (L/T) e Arcobaleno (5 in fila) nella casella giusta, con la priorità prevista.
- Attivazione, reazioni a catena e tutte le 6 combinazioni speciale + speciale.
- Grafica e animazioni dedicate per ognuno (scia del razzo, onda della bomba, raggi dell'arcobaleno), punteggi bonus, vibrazione breve se attiva.
Scrivi test per ogni creazione, attivazione e combinazione.
Test verdi, ROADMAP aggiornata, commit.
```

### Fase 4 — Livelli, mappa e salvataggio
```
Fase 4 della ROADMAP: il gioco completo con i livelli.
- Ostacoli nel motore: gelatina e ghiaccio (1–2 strati), esattamente come descritti in CLAUDE.md, con test.
- Obiettivi: punteggio, raccogli colori, gelatina, ghiaccio. Regole di vittoria, mosse avanzate e stelle come da CLAUDE.md.
- 30 livelli in src/levels/levels.js con la progressione descritta in CLAUDE.md. Ognuno ha un tip quando introduce una novità; il livello 1 ha la manina che mostra lo swipe.
- Schermate: menu iniziale, mappa dei livelli verticale con stelle e lucchetti, fine livello con stelle animate e "Prossimo", impostazioni (vibrazione, animazioni ridotte, azzera progressi con conferma dentro la pagina).
- Salvataggio in localStorage come da CLAUDE.md.
Aggiungi un test che controlla che tutti i livelli siano validi: layout coerente, almeno una mossa iniziale, soglie delle stelle crescenti.
Test verdi, ROADMAP aggiornata, commit.
```

### Fase 5 — Bilanciamento della difficoltà
```
Fase 5 della ROADMAP: bilanciamento.
Crea tools/simulate.js, da lanciare con node: un bot che gioca ogni livello 200 volte con seed diversi, scegliendo sempre la mossa con il punteggio immediato più alto. Deve stampare una tabella con percentuale di vittorie, stelle medie e mosse avanzate per ogni livello.
Obiettivi indicativi per le vittorie del bot:
- livelli 1–5: oltre il 90%;
- livelli 6–15: tra il 60% e l'85%;
- livelli 16–30: tra il 35% e il 70%.
La difficoltà deve salire in modo graduale, senza picchi improvvisi.
Regola mosse, obiettivi e soglie delle stelle finché i numeri rientrano. Metti la tabella finale in ROADMAP.md.
Test verdi, commit.
```

### Fase 6 — Rifinitura e app installabile (PWA)
```
Fase 6 della ROADMAP: rifinitura e installazione.
- manifest.webmanifest: nome "Tris di Dolci", colori del tema, orientamento verticale, percorsi relativi. Icone PNG originali da 192 e 512 (una caramella stilizzata) più l'icona per iPhone (apple-touch-icon).
- sw.js: il gioco funziona offline dopo la prima apertura. Cache con numero di versione; quando esce una versione nuova compare in pagina "Nuova versione disponibile — tocca per aggiornare".
- Rifiniture: particelle, testi delle cascate, transizioni tra le schermate, prefers-reduced-motion, schermata di caricamento, nessuno zoom o selezione accidentale.
- Prestazioni: niente scatti durante le cascate lunghe.
- Verifica finale: nessuna risorsa esterna, nessun audio, nessun errore in console.
README finale per Marco: come si gioca e come si installa su Android e iPhone.
Test verdi, ROADMAP aggiornata, commit.
```

### Fase 7 (facoltativa) — App Android vera
```
Fase 7 della ROADMAP: preparami il necessario per trasformare il gioco in un'app Android (APK) con Capacitor, senza cambiare il gioco.
Metti tutto in una cartella separata android-app/ con il suo package.json: il gioco nella radice deve restare senza dipendenze.
Scrivi in docs/ANDROID.md una guida passo passo per completarlo sul mio PC Windows con Android Studio, compresa la firma per il Play Store.
Non aggiungere plugin di pubblicità, analytics o notifiche.
```
> La compilazione dell'APK va fatta sul PC. La PWA della Fase 6 si installa già sul telefono senza passare dal Play Store.

### Prompt utili in qualsiasi momento

**Segnalare un bug**
```
C'è un bug: [cosa succede]. Cosa mi aspettavo: [...]. Telefono e browser: [...]. Livello: [...].
Prima scrivi un test che lo riproduce, poi correggilo. Test verdi, commit.
```

**Aggiungere livelli**
```
Aggiungi i livelli da 31 a 40, un po' più difficili del 30, con almeno una combinazione di meccaniche nuova. Validali con il test dei livelli e con tools/simulate.js. Commit.
```

**Cambiare il nome del gioco**
```
Il gioco ora si chiama "[nuovo nome]". Aggiorna titolo, manifest, testi, README e CLAUDE.md.
```

**Cambiare una regola**
```
Voglio cambiare questa regola: [...]. Aggiorna CLAUDE.md e il codice nella stessa sessione, con i test.
```

**Dove eravamo?**
```
Leggi ROADMAP.md e dimmi in 5 righe a che punto è il progetto e qual è il prossimo passo.
```

---

# PARTE D — Provare, pubblicare, problemi comuni

### Provare sul telefono
Dopo la Fase 2 attiva GitHub Pages (A6) e apri il link. Ogni merge su `main` aggiorna il gioco in 1–2 minuti. Dalla Fase 6 in poi compare anche il messaggio "Nuova versione disponibile".

### Provare sul PC (facoltativo)
1. Scarica il repository: **Code → Download ZIP**, poi estrai lo ZIP.
2. Apri un terminale nella cartella estratta.
3. Lancia `python -m http.server 8000`.
4. Apri http://localhost:8000 nel browser.

> Aprire `index.html` con un doppio clic non funziona: i moduli JavaScript hanno bisogno di un server, anche locale.

### Problemi comuni
| Problema | Soluzione |
|---|---|
| Il repository non compare nel selettore di Claude Code | Installa la Claude GitHub App con accesso a `tris-di-dolci` (A3), poi ricarica la pagina |
| GitHub Pages dà errore 404 | Aspetta 2 minuti. Controlla Settings → Pages (main, / root) e che `index.html` sia nella radice |
| Sul telefono vedo la versione vecchia | Chiudi e riapri il gioco. Dopo la Fase 6 basta toccare "aggiorna" |
| Claude Code si "perde" in una sessione lunga | Fai il merge di quello che c'è e apri una nuova sessione con il prompt "Dove eravamo?" |
| Claude propone di aggiungere librerie | Rispondi di no, salvo motivi seri: la regola 4 di CLAUDE.md tiene il gioco pulito |
| Una fase è troppo grande e Claude si ferma a metà | Scrivi "continua con la parte mancante della Fase N", poi fai merge come al solito |

### Costi
- Le sessioni di Claude Code consumano i limiti del tuo piano Claude, come le chat normali. La macchina nel cloud non ha costi a parte.
- GitHub e GitHub Pages sono gratis per i repository pubblici.

---
*Kit preparato il 15/11/2026.*
