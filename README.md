# 🍬 Tris di Dolci

Un gioco puzzle "match-3" a tema caramelle: scambi due caramelle vicine per allinearne tre o più uguali.

**Senza pubblicità, senza musica, senza vite, senza acquisti, senza tracciamento.** Si gioca dal browser del telefono e (a progetto finito) si installa sulla schermata Home come un'app.

## A che punto siamo

Il progetto si costruisce a fasi: l'elenco completo è in [`ROADMAP.md`](./ROADMAP.md).

- ✅ Fase 0 — impostazione del progetto
- ✅ Fase 1 — motore di gioco (le regole, senza grafica)
- ✅ Fase 2 — tabellone giocabile sul telefono
- ✅ Fase 3 — caramelle speciali
- ✅ Fase 4 — 30 livelli, mappa, impostazioni e salvataggio

Ci sono 30 livelli: si sbloccano uno dopo l'altro e i progressi restano salvati sul telefono.

## Come si gioca

- **Scorri** una caramella verso quella vicina per scambiarle, oppure **tocca** una caramella e poi quella accanto.
- Allinea 3 o più caramelle uguali, in riga o in colonna, per eliminarle.
- Se lo scambio non allinea niente, le caramelle tornano al loro posto e la mossa non si consuma.
- Se resti fermo 5 secondi, una mossa possibile inizia a pulsare.

### Caramelle speciali

| Come si crea | Nome | Cosa fa |
|---|---|---|
| 4 in fila | **Razzo** (ha due frecce) | elimina tutta la riga o tutta la colonna |
| forma a L o a T | **Bomba** (ha un alone che pulsa) | esplode tutto intorno |
| 5 in fila | **Arcobaleno** (sfera a spicchi) | scambialo con una caramella: elimina tutte quelle di quel colore |

Razzi e Bombe si attivano quando fanno parte di un match o vengono colpiti. Prova anche a **scambiare due speciali tra loro**: l'effetto è molto più grande.

## Come si prova

### Sul telefono (consigliato)
1. Su GitHub apri **Settings → Pages**.
2. Alla voce **Source** scegli **Deploy from a branch**.
3. Branch **main**, cartella **/ (root)**, poi **Save**.
4. Dopo 1–2 minuti il gioco è online su **https://costamarco-alt.github.io/Tris-di-dolci/**

Da quel momento ogni merge su `main` aggiorna il gioco da solo.

### Sul PC (facoltativo)
1. Su GitHub: **Code → Download ZIP**, poi estrai lo ZIP.
2. Apri un terminale nella cartella estratta.
3. Lancia `python -m http.server 8000`.
4. Apri http://localhost:8000 nel browser.

> Aprire `index.html` con un doppio clic non funziona: serve un piccolo server, anche locale.

### Obiettivi dei livelli

| Livelli | Obiettivo |
|---|---|
| 1–5 | fare un certo punteggio |
| 6–10 | raccogliere caramelle di un colore |
| 11–15 | togliere la **gelatina** (elimina le caramelle che ci stanno sopra; quella scura va colpita due volte) |
| 16–20 | rompere il **ghiaccio** (le caramelle ghiacciate non si muovono: includile in un tris) |
| 21–25 | tabelloni con forme diverse |
| 26–30 | sei colori e ostacoli insieme |

Ogni livello vinto dà da 1 a 3 stelle, in base al punteggio. Le mosse che avanzi diventano punti.

Dal menu, in **Impostazioni**, puoi spegnere la vibrazione, ridurre le animazioni o azzerare i progressi.

## Test automatici

Le regole del gioco sono controllate da test automatici. Per lanciarli serve solo [Node.js](https://nodejs.org) (versione 20 o più recente), senza installare altro:

```
npm test
```

## Com'è fatto

- Solo HTML, CSS e JavaScript: nessuna libreria esterna, niente da compilare.
- `src/engine/` contiene le regole del gioco (senza grafica), `src/ui/` conterrà la grafica.
- `CLAUDE.md` è la specifica completa del gioco; `KIT-CLAUDE-CODE.md` è il documento di partenza con i prompt di ogni fase.
