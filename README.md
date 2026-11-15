# 🍬 Tris di Dolci

Un gioco puzzle "match-3" a tema caramelle: scambi due caramelle vicine per allinearne tre o più uguali.

**Senza pubblicità, senza musica, senza vite, senza acquisti, senza tracciamento.** Si gioca dal browser del telefono, si installa sulla schermata Home come un'app e funziona anche senza connessione.

**Gioca qui:** https://costamarco-alt.github.io/Tris-di-dolci/
(il link funziona dopo aver attivato GitHub Pages: vedi "Come si pubblica")

## Come si gioca

- **Scorri** una caramella verso quella vicina per scambiarle, oppure **tocca** una caramella e poi quella accanto.
- Allinea 3 o più caramelle uguali, in riga o in colonna, per eliminarle.
- Se lo scambio non allinea niente, le caramelle tornano al loro posto e la mossa non si consuma.
- Se resti fermo 5 secondi, una mossa possibile inizia a pulsare.
- Non ci sono vite né attese: se un livello va male, tocchi **Riprova**.

### Caramelle speciali

| Come si crea | Nome | Cosa fa |
|---|---|---|
| 4 in fila | **Razzo** (ha due frecce) | elimina tutta la riga o tutta la colonna |
| forma a L o a T | **Bomba** (ha un alone che pulsa) | esplode tutto intorno |
| 5 in fila | **Arcobaleno** (sfera a spicchi) | scambialo con una caramella: elimina tutte quelle di quel colore |

Razzi e Bombe si attivano quando fanno parte di un match o vengono colpiti. Prova anche a **scambiare due speciali tra loro**: l'effetto è molto più grande.

### I 30 livelli

| Livelli | Obiettivo |
|---|---|
| 1–5 | fare un certo punteggio |
| 6–10 | raccogliere caramelle di un colore |
| 11–15 | togliere la **gelatina** (elimina le caramelle che ci stanno sopra; quella scura va colpita due volte) |
| 16–20 | rompere il **ghiaccio** (le caramelle ghiacciate non si muovono: includile in un tris) |
| 21–25 | tabelloni con forme diverse |
| 26–30 | sei colori e ostacoli insieme |

Ogni livello vinto dà da 1 a 3 stelle, in base al punteggio. Le mosse che avanzi diventano punti. I progressi restano salvati sul telefono.

Dal menu, in **Impostazioni**, puoi spegnere la vibrazione, ridurre le animazioni o azzerare i progressi.

## Come si installa sul telefono

Prima apri il link del gioco nel browser, poi:

- **Android (Chrome)**: menu ⋮ in alto a destra → **Aggiungi a schermata Home** (oppure **Installa app**).
- **iPhone (Safari)**: pulsante **Condividi** → **Aggiungi alla schermata Home**.

Sulla schermata Home compare l'icona con il cuore. Da lì il gioco si apre a tutto schermo e funziona anche offline.

Quando pubblico una versione nuova, in basso compare la scritta **"Nuova versione disponibile — tocca per aggiornare"**: basta toccarla.

## Come si pubblica (una volta sola)

1. Su GitHub apri il repository, poi **Settings → Pages**.
2. Alla voce **Source** scegli **Deploy from a branch**.
3. Branch **main**, cartella **/ (root)**, poi **Save**.
4. Dopo 1–2 minuti il gioco è online su https://costamarco-alt.github.io/Tris-di-dolci/

Da quel momento ogni modifica che arriva su `main` aggiorna il gioco da sola.

## Provarlo sul PC (facoltativo)

1. Su GitHub: **Code → Download ZIP**, poi estrai lo ZIP.
2. Apri un terminale nella cartella estratta.
3. Lancia `python -m http.server 8000`.
4. Apri http://localhost:8000 nel browser.

> Aprire `index.html` con un doppio clic non funziona: serve un piccolo server, anche locale.

## Per chi mette mano al codice

Serve solo [Node.js](https://nodejs.org) (versione 20 o più recente); non c'è niente da installare.

| Comando | A cosa serve |
|---|---|
| `npm test` | lancia i test automatici delle regole del gioco |
| `node tools/simulate.js` | un bot gioca ogni livello 200 volte e mostra quanto è difficile |
| `node tools/versione.js` | da lanciare dopo ogni modifica al gioco: aggiorna la versione per l'avviso di aggiornamento |

- Solo HTML, CSS e JavaScript: nessuna libreria esterna, niente da compilare.
- `src/engine/` contiene le regole del gioco (senza grafica), `src/ui/` la grafica, `src/levels/` i livelli.
- `CLAUDE.md` è la specifica completa del gioco, `ROADMAP.md` lo stato dei lavori e le decisioni prese, `KIT-CLAUDE-CODE.md` il documento di partenza.
