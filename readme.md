# Salivary Gland Tool — v5.7.0

**Tool di orientamento diagnostico per le neoplasie delle ghiandole salivari.**

*This tool orients diagnostic reasoning — it does not replace diagnostic judgment.*

Il dettaglio di ogni versione è nel [CHANGELOG](CHANGELOG.md): in caso di dubbio fa fede quello.

---

## Cos'è

Uno strumento di triage morfologico. Prende in input i reperti istologici, IHC e molecolari di una lesione salivare e restituisce:

- **Orientamento gestionale**: basso grado / alto grado / basaloide con ACC da escludere / non determinabile
- **Fenotipo** (p40 / CD117 / S100): bifasico, monofasico ghiandolare, monofasico squamoide
- Entità compatibili, ordinate per punteggio, con **a favore / contro / mancante** per ciascuna
- Entità escluse, con la ragione
- Esami successivi mirati e avvisi di qualità del dato

Non è un oracolo: è un framework di ragionamento esplicito. Un reperto non compilato non conta mai come reperto assente.

---

## Filosofia

**Morphology-first.** La morfologia guida, i marcatori confermano.

**Un reperto ha tre stati:** presente, assente, *non valutato*. I cancelli escludono solo su un dato compilato che contraddice; il silenzio non è una negazione. "Non eseguito" vale come non compilato.

**Cancelli duri solo dove la biologia li giustifica.** Dove un reperto è variabile o il campione può non rappresentarlo (p40, β-catenina, RET, AR/HER2, …) il tool sposta il punteggio ma non esclude.

**Il campione conta.** Su core biopsy e FNAB i criteri che si appoggiano all'*assenza* di un reperto architetturale sono sospesi ("non determinabile"): nessuno può affermare che un pattern non ci sia.

**Onesto sui propri limiti.** Dichiara cosa non copre, e che i pesi sono euristici.

*"Automating prudence, not diagnosis."*

---

## Entità coperte (16)

| Sigla | Entità | Gate 1 esclude se… |
|-------|--------|--------------------|
| PA | Adenoma pleomorfo | necrosi; grado nucleare alto **e** mitosi alte; PNI estesa |
| ACC | Carcinoma adenoido-cistico | cribriforme assente **e** dualità assente; mucina abbondante |
| MEC | Carcinoma mucoepidermoide | mucina assente |
| AciCC | Carcinoma a cellule acinari | acini sierosi assenti; cribriforme **con** dualità netta |
| SC | Carcinoma secretorio | mammaglobina **e** ETV6-NTRK3 negativi |
| MSA | Adenocarcinoma microsecretorio | né pattern microcistico né dualità presenti |
| CaExPA | Carcinoma ex adenoma pleomorfo | mai (solo una nota) |
| Warthin | Tumore di Warthin | oncociti o stroma linfoide documentati assenti |
| EMC | Carcinoma epiteliale-mioepiteliale | mai |
| PolymorphousAC | Adenocarcinoma polimorfo / cribriforme | mai |
| HCCC | Carcinoma a cellule chiare ialinizzante | mai |
| BasalCell | Neoplasia basocellulare (adenoma + adenocarcinoma) | mai |
| SDC | Carcinoma duttale salivare | grado nucleare **basso** documentato |
| MucinousAC | Adenocarcinoma mucinoso | mucina assente |
| MyoCa | Carcinoma mioepiteliale | p40, SMA/calponina, S100 e SOX10 tutti negativi |
| IntraductalCa | Carcinoma intraduttale | mai |

Basal cell: adenoma e adenocarcinoma sono una sola entità perché li separa solo l'invasione, non valutabile su biopsia.

**Non copre bene:**
- lesioni cistiche benigne (cisti di ritenzione, mucoceli)
- adenoma canalicolare, adenoma del dotto striato, oncocitoma (citati come S100+ o oncocitici, non trattati)
- carcinoma squamocellulare metastatico e keratocistoma
- mimici non salivari (melanoma, linfoma, metastasi)
- NUT carcinoma e carcinoma SMARCA4-deficient: il tool segnala di considerarli se HRAS + dual PIK3CA + CK negativo
- lesioni fuori da parotide e sottomandibolare

---

## Come funziona

### Flusso

```
Step 0  Tipo di campione (core biopsy / pezzo operatorio / FNAB)
Step 1  Architettura
Step 2  Citologia
Step 3  Invasione e comportamento
Step 4  Contesto clinico (anamnesi PA, PA residuo, stroma linfoide)
Step 5  IHC (opzionale)
Step 6  Molecolare (opzionale)
Step 7  Risultati
```

### Gate 1 — validazione morfologica

Esclude le entità incompatibili con un reperto *documentato* (tabella sopra). Chi passa per mancanza di dati è mostrata in ambra come **non verificata**, con l'elenco dei campi mancanti, non in verde come superata.

### Gate 2 — punteggio

Ogni sopravvissuta riceve un punteggio euristico, senza percentuali: **LOW** (< 5), **MODERATE** (≥ 5), **HIGH** (≥ 8). Un form vuoto dà zero a tutte.

**Livello fenotipico (cancello morbido).** p40 smista le entità in tre famiglie; il fenotipo coerente dà +2, quello incoerente −3, nessuna esclusione:

| p40 | Famiglia | Entità |
|-----|----------|--------|
| abluminale | bifasico | PA, ACC, EMC, Warthin, BasalCell |
| negativo | monofasico ghiandolare | SC, MSA, PolymorphousAC, AciCC, SDC, MucinousAC |
| diffuso | monofasico squamoide | MEC, HCCC |

CaExPA, MyoCa e IntraductalCa non hanno famiglia: il loro fenotipo è variabile o dipende dal campionamento. S100 suddivide il solo monofasico ghiandolare (secretorio / polimorfo / microsecretorio contro acinico / mucinoso); in fenotipo squamoide S100/SOX10+ rimanda al mioepiteliale.

### Orientamento gestionale

Dalla Fig. 1 di Higgins & Cipriani. Non è una diagnosi:

- **Alto grado:** almeno due segni (necrosi, grado nucleare alto, mitosi alte), oppure un segno più HRAS/dual PIK3CA, oppure SDC in testa con fiducia almeno MODERATE
- **Basaloide, ACC da escludere:** ACC non esclusa con un indizio (cribriforme, dualità netta, MYB+, p40 abluminale, ACC in testa)
- **Benigno / basso grado:** grado nucleare basso e necrosi assente
- **Non determinabile:** grado non valutato o intermedio, un solo segno di alto grado, fuori modello, oppure mioepiteliale in testa (un aspetto blando non rassicura)

### Per ogni entità in classifica

| Box | Contenuto |
|-----|-----------|
| ✓ A favore | Reperti presenti che la sostengono |
| ✗ Contro | Reperti che la indeboliscono (anche quando non bastano a escluderla) |
| ? Mancante | Test utili non ancora eseguiti, con il motivo |

Vengono mostrate le prime cinque.

### Controlli di qualità

- Contraddizioni: cribriforme senza dualità; p40 abluminale senza dualità; p40 negativo con dualità netta o con p63+
- Più di tre campi core vuoti: risultati poco affidabili
- S100+, mammaglobina+ e p40 abluminale insieme: più un intraduttale che un secretorio, verificare MUC4 e RET
- HRAS + dual PIK3CA: SMARCA4/BRG1 e NUT prima di concludere

---

## Campi raccolti (51)

**Campione (1):** tipo di campione.

**Morfologia e clinica (22):** cribriforme, nidi solidi, dualità, microcistico, mucina, acinare sierosa, grado nucleare, necrosi, PNI, tipo stromale, oncocitaria, papillare, componente mioepiteliale invasiva, anamnesi PA, PA residuo, stroma linfoide, cellule chiare, pattern variati, indice mitotico, stroma fusato interposto, citologia apocrina, crescita intraluminale.

**IHC (19):** DOG1, MAML2, CK, AR, HER2, mammaglobina, p63/SMA, SMARCA4, p40, CD117, S100, SOX10, PLAG1, HMGA2, β-catenina, NKX3.1, SMA/calponina, MUC4, NUT.

**Molecolare (9):** MYB, MEF2C::SS18, ETV6-NTRK3, HRAS Q61, PIK3CA, CTNNB1/CYLD, EWSR1, AKT1 p.E17K, RET.

I marcatori sono a tre stati: `Positivo / Negativo / Non eseguito` (con qualche valore specifico, es. p40 abluminale/diffuso/negativo). Ogni campo raccolto entra in almeno una regola; un test lo verifica.

---

## Limiti noti

- **I pesi sono euristici**, non calibrati su casistica. Nascono da una lettura della letteratura (WHO 2022 e la review di Higgins & Cipriani, AIMM 2026), che è narrativa e non validata.
- `p63/SMA` come campo unico è un proxy; SMA/calponina e p40 sono campi a parte, ma il campo p63 resta aspecifico nei monofasici ghiandolari.
- Sottomandibolare e sottolinguale non sono distinti, e il tipo di ghiandola non è un campo: il tool non applica correzioni per sede.
- Il modello non vede l'invasione: adenoma e adenocarcinoma basocellulare, e il comportamento del mioepiteliale, restano al patologo.
- Il pattern HRAS Q61 + dual PIK3CA (CaExPA / mioepiteliale, avviso NUT e SMARCA4) viene dall'esperienza clinica diretta dell'autore (caso parotide 2025-26), non da una fonte di letteratura.

---

## Persistenza

Salva in `sessionStorage` con chiave `sgdt_v5_7_0_session`: la sessione si riapre allo stesso punto al refresh. **↻ Ricomincia** cancella solo la chiave del tool, non l'intera origine.

---

## Struttura e deploy

```
index.html     interfaccia (wizard a 8 passi)
engine.js      logica pura, senza DOM: cancelli, punteggio, orientamento
tests/run.mjs  test del motore, senza framework
CHANGELOG.md   storia delle versioni
```

L'applicazione è **`index.html` più `engine.js`**, da servire dalla stessa cartella (la pagina carica `engine.js?v=…`). Nessuna dipendenza esterna, funziona offline in un browser moderno.

```
npm test        # node tests/run.mjs — 633 asserzioni, exit code 0 = tutto verde
```

I test non controllano solo il comportamento: verificano che il motore non sia duplicato nella pagina, che ogni campo del form venga salvato e letto da una regola, che ogni valore con cui il motore confronta un campo sia un valore che il form può produrre, e che versione, titolo e chiave di sessione siano allineati a `package.json`.

---

## Roadmap

- Ricalibrazione dei pesi su 20-30 casi reali testati
- Separazione p63 / SMA / calponina, e sottomandibolare / sottolinguale
- Possibile estensione: canalicolare, dotto striato, carcinoma squamocellulare metastatico (oggi fuori modello)

---

## Crediti e attribuzioni

Sviluppato da Dr. Filippo Bianchi (SC Anatomia Patologica, FBF-Melloni, Milano) con supporto AI Claude per implementazione. Scuola morfologica di riferimento: Rosai & Ackerman. Framework nosologico: WHO Classification of Head and Neck Tumours 2022. Livello fenotipico, orientamento gestionale e le entità basocellulare, SDC, mucinoso, mioepiteliale e intraduttale: Higgins KE, Cipriani NA. *Algorithmic Approach to Diagnosis of Salivary Gland Neoplasms Based on Morphology and Select Immunostains.* Appl Immunohistochem Mol Morphol 2026.

---

## Licenza d'uso

Strumento di supporto al ragionamento diagnostico per uso interno. Non è un dispositivo medico certificato. La responsabilità diagnostica resta del patologo refertante.
