# 🍬 Tris di Dolci

Un gioco puzzle "match-3" a tema caramelle: scambi due caramelle vicine per allinearne tre o più uguali.

**Senza pubblicità, senza musica, senza vite, senza acquisti, senza tracciamento.** Si gioca dal browser del telefono e (a progetto finito) si installa sulla schermata Home come un'app.

## A che punto siamo

Il progetto si costruisce a fasi: l'elenco completo è in [`ROADMAP.md`](./ROADMAP.md).

- ✅ Fase 0 — impostazione del progetto
- ⏳ Fase 1 — motore di gioco (le regole, senza grafica)
- ⏳ Fase 2 — tabellone giocabile sul telefono

Per ora la pagina mostra solo il titolo: il tabellone giocabile arriva con la Fase 2.

## Come si prova

### Sul telefono (consigliato, dopo la Fase 2)
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

## Test automatici

Le regole del gioco sono controllate da test automatici. Per lanciarli serve solo [Node.js](https://nodejs.org) (versione 20 o più recente), senza installare altro:

```
npm test
```

## Com'è fatto

- Solo HTML, CSS e JavaScript: nessuna libreria esterna, niente da compilare.
- `src/engine/` contiene le regole del gioco (senza grafica), `src/ui/` conterrà la grafica.
- `CLAUDE.md` è la specifica completa del gioco; `KIT-CLAUDE-CODE.md` è il documento di partenza con i prompt di ogni fase.
