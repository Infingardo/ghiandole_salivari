# Salivary Gland Diagnostic Support Tool
**v4.4.2 — WHO Classification of Head and Neck Tumours, 5th ed. (2022)**

> Tool didattico-operativo per la diagnosi differenziale delle neoplasie delle ghiandole salivari.  
> Single-file HTML/JS — nessuna dipendenza esterna, nessun dato trasmesso.

---

## Entità coperte (8)

| Sigla | Nome completo | Alterazione molecolare chiave |
|-------|--------------|-------------------------------|
| PA | Adenoma Pleomorfo | PLAG1 / HMGA2 |
| ACC | Carcinoma Adenoidocistico | MYB-NFIB / MYBL1 (~80% aggregate) |
| MEC | Carcinoma Mucoepidermoide | MAML2 (t(11;19)) |
| AciCC | Carcinoma Acinico | NR4A3 |
| SC | Secretory Carcinoma (ex-MASC, WHO 2022) | ETV6-NTRK3 |
| SDC | Carcinoma del Dotto Salivare | HER2 (amplificazione/iperespressione) |
| Warthin | Tumore di Warthin | — |
| CaExPA | Carcinoma ex Adenoma Pleomorfo | PLAG1 / HMGA2 (componente maligna) |

---

## Flusso diagnostico (9 step)

1. **Dati generali** — sede ghiandola, tipo campione (pezzo op. / core biopsy / FNAB), età
2. **Morfologia EE** — pattern architetturale dominante, citologia, stroma
3. **Features specifiche** — PNI, necrosi, atipia nucleare, componente linfocitaria
4. **IHC base** — CK7, CK5/6, S100, p63, SMA, calponina, DOG1, AR
5. **IHC avanzata** — SOX10, CD117, mammaglobina, LEF1, HER2 (schema ASCO/CAP 0/1+/2+/3+/amplified)
6. **Molecolare** — ETV6, MYB/MYBL1, MAML2, PLAG1, HMGA2, NR4A3
7. **Grading** — MEC (AFIP/Brandwein) + Ca ex-PA (invasione mm, WHO 2022)
8. **Clinica** — sospetto iniziale, note cliniche
9. **Risultati** — score differenziale, confidence tier, warning attivi, download report

---

## Logica di scoring

### Confidence tier
- **HIGH**: score >15, entità al 1° posto con distacco ≥5 dalla 2ª
- **MODERATE**: score 8–15 o distacco 3–4
- **LOW**: score <8 o distacco <3 → completare pannello

### Molecular tier
- **Tier 1** (ETV6, MYB, NR4A3) → promozione a MOLECULAR se score ≥ 8
- **Tier 2** (PLAG1, HMGA2, MAML2) → promozione a MOLECULAR se score ≥ 10

### Warning attivi
| Warning | Trigger |
|---------|---------|
| MANTELLO DISCORDANTE | p63 e SMA/calponina in direzioni opposte |
| SCORE RAVVICINATI | Δ tra 1° e 2° classificato < soglia |
| FNAB | Limitazioni critiche messe in evidenza |
| CaExPA trcut + PA pregressa | Box rosso al primo render (v4.4.2) |
| HER2 3+ / amplified in SDC | Alert terapeutico (trastuzumab-eligibile) |

---

## Principi clinici embedded

- **DOG1**: positività forte in AciCC; SC (ex-MASC) tipicamente negativo
- **LEF1**: 91–97% ACC sono LEF1−; LEF1+ orienta verso PA/BCA (Schmitt et al.)  
  ⚠️ LEF1− *non esclude* ACC — interpretare sempre nel contesto morfologico
- **HER2 2+**: peso = 0 (equivoco, richiede ISH/FISH prima di contare)
- **MYB**: ~80% ACC per alterazioni aggregate (MYB-NFIB ~50%, MYBL1 ~10–15%, peri-MYB riarrangiamenti)
- **Ca ex-PA su trucut**: penalità −40% sullo score CaExPA (architettura residua non valutabile)

---

## Limiti noti (versione corrente)

- **Entità mancanti**: PAC (PRKD1/2/3, ghiandole minori), EMC, BCA/BCAC, HCCC (EWSR1-ATF1), Oncocitoma, Mioepitelioma maligno
- Pattern selezionabile: uno solo (no dominante + secondario)
- Ki-67, mitosi, cellule mucoidi, componente cistica: raccolti ma non completamente integrati nel calcolo
- Non validato su casistica prospettica — uso esclusivamente didattico/di supporto

---

## Sessione e persistenza

Il tool usa `sessionStorage` (dati locali al browser, non trasmessi).  
Gestione backward-compatible:

```
SESSION_KEYS = ['sgdt_v442_session', 'sgdt_v441_session', 'sgdt_v44_session']
```

Al caricamento vengono lette in ordine; la prima disponibile ripristina il caso.  
**"✕ Nuovo caso"** cancella tutte e tre le chiavi.

---

## Changelog

### v4.4.2
- `syncCaExPAWarning()` chiamata al render iniziale (warning CaExPA visibile su ripristino sessione)
- `SESSION_KEYS` array backward-compatible (v442 → v441 → v44)
- Filename report e SESSION_KEY allineati alla versione corrente
- `Molecular confidence` e changelog interni aggiornati a v4.4.2

### v4.4.1
- HER2 2+ peso ridotto a 0 (equivoco senza ISH)
- MEC pattern squamous rimosso (irraggiungibile da UI)
- `saveData()`: campo svuotato cancella `formData` (no ghost values)
- `nextStep()`/`prevStep()`: `saveSession()` spostato dopo `currentStep++`

### v4.4
- SC al posto di MASC (nomenclatura WHO 2022)
- DOG1 in SC: `pos:+3` → `pos:−2`
- HER2 UI: schema ASCO/CAP completo (0/1+/2+/3+/amplified), alert terapeutico per 3+ e amplified
- `_myoDiscordant` bug risolto (assegnazione pre-filter → variabile globale separata)
- MYB wording corretto (~80% aggregate)
- LEF1 testo UI corretto (era invertito)

---

## Uso consigliato

```
Apri il file HTML in qualsiasi browser moderno.
Nessuna installazione. Nessun server. Nessun dato inviato.
```

Report scaricabile in `.txt` dallo step 9.  
Integrabile su GitHub Pages as-is.

---

## Disclaimer

> Strumento di supporto didattico-operativo.  
> Non sostituisce il giudizio del patologo.  
> La diagnosi definitiva richiede correlazione clinico-radiologico-patologica.  
> **Il vetrino non mente. Il reagente sì.**

---

*Sviluppato con Claude (Anthropic) — revisione scientifica ChatGPT Plus — direzione clinica: Dr. F. Bianchi, SC Anatomia Patologica, ASST Fatebenefratelli-Sacco, Milano*
