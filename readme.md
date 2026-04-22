# Salivary Gland Tool — v5.1-beta

**Tool di orientamento diagnostico per patologia delle ghiandole salivari.**

*This tool orients diagnostic reasoning — it does not replace diagnostic judgment.*

---

## Cos'è

Uno strumento di triage morfologico che prende in input le caratteristiche istologiche di una lesione salivare e restituisce:

- Ipotesi diagnostiche compatibili, ordinate per pattern fit
- Elementi a favore, contro, mancanti per ciascuna ipotesi
- Soglia di abbandono ("Would abandon if...") esplicita
- Alternative diagnostiche più insidiose ("Closest dangerous alternatives")
- Suggerimenti di esami successivi mirati

Non è un oracolo. È un framework di pensiero esplicito, calibrato secondo WHO 2022 con sensibilità clinica italiana e scuola Rosai.

---

## Filosofia

**Morphology-first.** La morfologia guida la diagnosi. Marker e molecolari sono conferme, non sostituti.

**Pragmatico, non dogmatico.** I gate di esclusione sono morbidi quando la biologia lo richiede (EMC, PolymorphousAC, HCCC, CaExPA). Il peso interpretativo si sposta sui box esplicativi.

**Onesto sui propri limiti.** Il tool dichiara cosa copre bene, cosa copre male, e quando è fuori dal proprio modello.

**Il vetrino non mente. Il reagente sì.** Quando IHC e morfologia divergono, la morfologia ha l'ultima parola.

---

## Entità coperte (11)

| Sigla | Entità | Gate 1 | Densità dati |
|-------|--------|--------|--------------|
| PA | Pleomorphic Adenoma | Duro | Alta |
| ACC | Adenoid Cystic Carcinoma | Duro | Alta |
| MEC | Mucoepidermoid Carcinoma | Duro | Alta |
| AciCC | Acinic Cell Carcinoma | Duro | Alta |
| SC | Secretory Carcinoma | Morbido | Media |
| MSA | Microsecretory Adenocarcinoma | Morbido | Media |
| CaExPA | Carcinoma ex Pleomorphic Adenoma | Soft warning | Alta |
| Warthin | Warthin Tumor | Duro | Alta |
| EMC | Epithelial-Myoepithelial Carcinoma | Soft warning | Media |
| PolymorphousAC | Polymorphous Adenocarcinoma | Soft warning | Media |
| HCCC | Hyalinizing Clear Cell Carcinoma | Soft warning | Media |

**Non copre:** lesioni cistiche benigne, entità duttali (intercalated duct carcinoma), varianti rare di salivary duct carcinoma, mimici non salivari (melanoma, linfoma, metastasi).

---

## Come funziona

### Flusso

```
Step 1: Tipo ghiandola + architettura
Step 2: Citologia
Step 3: Invasione & comportamento
Step 4: Contesto clinico (anamnesi PA, stroma linfoide)
Step 5: IHC & molecolare (opzionale)
Step 6: Risultati
```

### Architettura a due gate

**Gate 1 — Validazione morfologica**
Esclude entità biologicamente incompatibili (es. Warthin senza oncocitosi + linfoide; AciCC senza acinari sierosi).
I gate morbidi producono "Soft gate notes" visibili nell'output senza escludere l'entità.

**Gate 2 — Ranking pattern fit**
Assegna score euristico alle entità sopravvissute. Gland-aware:
- PolymorphousAC, HCCC: +3 minor, −2 parotid
- Warthin: +2 parotid, −3 minor
- MEC: +1 parotid, −1 minor

Output: `Pattern fit: STRONG/INTERMEDIATE/WEAK · Score: N`

### Per ogni entità in ranking

| Box | Contenuto |
|-----|-----------|
| ✓ A favore | Feature presenti che supportano la diagnosi |
| ✗ Contro | Feature che la indeboliscono |
| ? Mancante | Test utili non ancora eseguiti, con razionale |
| 🚫 Abbandonerei se | Soglia esplicita di abbandono |
| ⚠️ Alternative insidiose | Mimici clinico-diagnostici più vicini |

---

## Campi raccolti (28)

**Morfologia (19):** tipo ghiandola, cribriforme, dualità, microcistico, produzione di mucina, acinare sierosa, grado nucleare, necrosi, invasione perineurale, tipo stromale, oncocitaria, papillare, anamnesi PA, PA residuo, stroma linfoide, cellule chiare, pattern variati, indice mitotico, ihc_status.

**IHC (7):** DOG1, MAML2, LEF1, MYB, p63/SMA, mammaglobina, PLAG1.

**Molecolare (2):** MEF2C::SS18, ETV6-NTRK3.

Tutti i marker sono a tre stati: `Positivo / Negativo / Non eseguito`.

---

## Controlli di qualità

**Contraddizioni semantiche:**
- Cribriforme + no dualità → "Reverificare"
- Microcistico + no dualità → "MSA improbabile"
- Cellule chiare senza ialino né dualità → "Considerare RCC metastatico"
- Oncocitosi senza linfoide in parotide → "Warthin meno probabile"

**IHC ghost cleanup:** se `ihc_status` torna a "pending", i valori IHC precedenti vengono cancellati dal motore. Il motore ragiona solo sui dati effettivamente dichiarati.

**Dati mancanti:** warning esplicito se >3 campi core sono vuoti.

---

## Limiti noti

**Strutturali (accettati):**
- `p63/SMA` come campo unico è un proxy pragmatico, non equivalente a interpretazione di marker singoli
- `submandibular/sublingual` accorpati per semplicità
- Ranking basato su euristiche a priori, non calibrato su casistica reale
- Gate morbidi per EMC/PolymorphousAC/HCCC/CaExPA: il peso è nei box interpretativi, non nell'esclusione

**Tecnici (monitorati):**
- CaExPA è un soft warning travestito da passaggio di gate (commentato nel codice)
- Pesi gland-aware sono correzione grossolana pre-test

---

## Persistenza

Il tool salva automaticamente in `sessionStorage` con chiave `sgdt_v5_1_beta_session`. La sessione si riapre allo stesso punto al refresh. Il pulsante **↻ Ricomincia** (o ↻ Nuovo caso a fine flusso) cancella tutto.

---

## Deploy

File singolo HTML autosufficiente. Nessuna dipendenza esterna.

```
salivary_gland_tool_v5_1_ALPHA.html
```

Aprire in qualsiasi browser moderno (Chrome, Firefox, Safari, Edge). Funziona offline. 39 KB, 635 righe.

---

## Roadmap

**v5.2 (quando ci saranno 20-30 casi reali testati):**
- Ricalibrazione pesi gateTwo su dati reali
- Separazione p63 / SMA / calponina
- Separazione submandibular / sublingual
- Tre stati espliciti: `excluded / passed / caution`
- Possibile espansione a entità duttali

---

## Crediti e attribuzioni

Sviluppato da Dr. Filippo Bianchi (SC Anatomia Patologica, FBF-Melloni, Milano) con supporto AI Claude per implementazione. Scuola morfologica di riferimento: Rosai & Ackerman. Framework nosologico: WHO Classification of Head and Neck Tumours 2022.

---

## Licenza d'uso

Strumento di supporto al ragionamento diagnostico per uso interno. Non è un dispositivo medico certificato. La responsabilità diagnostica resta del patologo refertante.

---

*"Automating prudence, not diagnosis."*
