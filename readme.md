# 🔬 Salivary Gland Diagnostic Tool v4.1

**Supporto decisionale per la diagnosi differenziale di neoplasie epiteliali delle ghiandole salivari**

> **"Questo tool non fornisce diagnosi. Rende esplicito il ragionamento diagnostico."**

---

## 📋 Novità v4.1 (Aggiornamento Gennaio 2026)

### 🔧 Miglioramenti allo Scoring System

**1. Ki-67: Parametro Instabile**
- ✅ **Pesi ridotti** da ±3-5 a ±1-2 per limitare overcalling
- ✅ **Cut-off aggiornati:**
  - ≤10%: compatibile con benignità
  - 10-20%: zona grigia (non discriminante)
  - >20%: sospetto malignità
- ✅ **Warning esplicito** su variabilità tecnica e hot spot selection

**2. Mantello Mioepiteliale: Sistema a 5 Livelli**
Sistema precedente (v4.0):
- Intact / Partial / Lost (troppo rigido)

Sistema nuovo (v4.1):
- **Intact** (+4): 3/3 marcatori diffusamente positivi
- **Partial-PA** (+2): 2/3 positivi, pattern PA-like
- **Indeterminate** (0): Pattern discordante/confuso
- **Partial-ACC** (-2): p63 scarso/perso, pattern ACC-like
- **Lost** (-4): Tutti negativi

**3. Ca ex-PA in Trucut: Penalty Automatico**
- Score **ridotto del 40%** se specimen type = trucut
- **Disclaimer rosso** attivato automaticamente
- Previene overdiagnosi in campioni con sampling limitato

**4. Alert Score Ravvicinati**
- Warning automatico se differenza tra 1° e 2° diagnosi **<3 punti**
- Suggerisce integrazione con IHC/molecolare

**5. Score De-Enfatizzato**
- Numero mostrato come **"indicativo ±2"** invece di valore esatto
- Font piccolo e grigio per ridurre feticizzazione del numero
- Tooltip esplicito: "non lineare, non probabilistico, non confrontabile"

**6. Warning Pattern Non Classificabile**
- Box arancione pre-risultati che avverte su entità rare non coperte
- Lista 5 entità più rilevanti (EMC, PAC, HCCC, BCA, Oncocitoma)
- Suggerimenti: WHO 2022, consulenza terziaria

**Rifinitura Esperta (post-review):**

**7. Confidence Molecular a 2 Tier**
- Tier 1 (patognomonici): ETV6, MYB, NR4A3 → confidence ≥5 score
- Tier 2 (supportivi): PLAG1, HMGA2, MAML2 → confidence ≥10 score
- Previene "nobilitazione" inappropriata da marker supportivi deboli

**8. MEC Morfologico Ribilanciato**
- Pattern mucoepidermoid: 5 → **6**
- Cellule mucose abbondanti: 3 → **4**
- p63 positivo: 2 → **3**
- CK5/6 positivo: 3 → **4**
- MEC low-grade emerge meglio senza molecolare

**9. Warning FNAB (Citologia)**
- Box rosso critico automatico se specimen = FNAB
- Elenca limitazioni: architettura, PNI, mantello, grading
- Esplicita necessità biopsia/chirurgia per diagnosi definitiva

**Bug Fix (v4.1.1 Micro-Patch):**
- BCL2 ora pesato (+1 ACC, marker addizionale debole)
- Pattern secondario rimosso (raccolto ma mai usato)
- FNAB: disclaimer "dati parziali" aggiunto sotto ogni score
- MEC grading: ora richiede pattern MEC O score ≥8 (più restrittivo)

**Epistemological Framing:**
- Frase chiave aggiunta: *"Questo output descrive la coerenza interna dei dati inseriti, non la realtà biologica del tumore"*
- Posizionamento: report TXT, footer HTML, disclaimer Step 9
- Blindatura totale contro overreliance sul tool

---

## 📊 Sistema Multi-Diagnosi (dalla v4.0)

A differenza della v3.x (focalizzata su PA vs ACC), la v4.x implementa uno **scoring parallelo per 8 entità**:

| Entità | Abbreviazione | Comportamento |
|--------|---------------|---------------|
| Adenoma Pleomorfo | PA | Benigno |
| Carcinoma Adenoidocistico | ACC | Maligno |
| Carcinoma Mucoepidermoide | MEC | Grado-dipendente |
| Carcinoma a Cellule Acinari | AciCC | Maligno (basso grado) |
| MASC | MASC | Maligno (basso grado) |
| Carcinoma Duttale Salivare | SDC | Maligno (alto grado) |
| Tumore di Warthin | Warthin | Benigno |
| Carcinoma ex-PA | CaExPA | Maligno |

### 📊 Sistemi di Grading WHO 2022

**ACC Grading (Pattern-based)**
- Grade I: Componente solida <30% → Prognosi migliore
- Grade II: Componente solida 30-70% → Intermedia  
- Grade III: Componente solida >70% → Prognosi peggiore

**MEC Grading (AFIP/Brandwein)**
| Parametro | Punti |
|-----------|-------|
| Componente cistica <20% | +2 |
| Invasione perineurale | +2 |
| Necrosi | +3 |
| ≥4 mitosi/10 HPF | +3 |
| Anaplasia | +4 |

- 0-4 punti: Basso grado
- 5-6 punti: Grado intermedio
- ≥7 punti: Alto grado

**Ca ex-PA Invasion (WHO 2022)**
- ≤1.5mm: Minimamente invasivo (prognosi simile a PA)
- 1.5-4mm: Invasivo
- >4mm: Ampiamente invasivo

### 🧬 Marcatori Molecolari Completi

| Marcatore | Target | Note |
|-----------|--------|------|
| **PLAG1** | PA | Gold standard (~70%) |
| **HMGA2** | PA | Alternativo (~30%) |
| **MYB-NFIB** | ACC | ~80% ACC |
| **NR4A3** | AciCC | Altamente specifico |
| **ETV6-NTRK3** | MASC | Patognomonico |
| **MAML2** | MEC | 50-70%, prognosticamente favorevole |

### 🔬 Pannello IHC Completo

**Marcatori Base:**
- p63, SMA, Calponina (mioepiteliali)
- CK7, S100, DOG1, SOX10 (generali)
- Ki-67 (proliferazione)

**Marcatori Discriminanti:**
- **LEF1** - Cruciale per PA vs ACC (v4.1: sempre disponibile)
- **CD117** (c-Kit) - Marker di malignità, forte in ACC
- **AR** - Recettore androgeni (SDC ~90%)
- **HER2** - Target terapeutico in SDC
- **GCDFP-15** - Differenziazione apocrina
- **Mammaglobina** - AciCC e MASC
- **Pan-TRK** - Screening NTRK fusions (MASC)
- **CK5/6** - Componente squamoide MEC

---

## 🎯 Funzionalità

### 9 Step Strutturati

1. **Contesto Clinico** - Campione, ghiandola, red flags per Ca ex-PA
2. **Criteri di Malignità** - PNI, atipia, necrosi, mitosi
3. **Pattern Architetturale** - 10 pattern con % componente solida
4. **IHC Base** - Mioepiteliali + generali + Ki-67 (v4.1: pesi ottimizzati)
5. **IHC Discriminanti** - LEF1, AR, HER2, Mammaglobina, etc.
6. **Molecolare** - FISH/NGS per tutte le entità principali
7. **Grading** - MEC (AFIP) + Ca ex-PA invasion
8. **Informazioni Cliniche** - Sospetto referente e note
9. **Risultati** - DDx rankizzata con grading, correlazione e alert

### Sistema di Scoring (v4.1 - Ottimizzato)

Ogni marcatore contribuisce con un peso specifico per ogni entità:
- Pesi **positivi**: supportano la diagnosi
- Pesi **negativi**: contraddicono la diagnosi
- Risultato molecolare positivo = **confidence "MOLECULAR"**
- **NUOVO**: Ki-67 con pesi ridotti (±1-2 invece di ±3-5)
- **NUOVO**: Mantello mioepiteliale a 5 livelli
- **NUOVO**: Penalty 40% per Ca ex-PA in trucut

### Confidence Levels

| Level | Score | Significato |
|-------|-------|-------------|
| HIGH | ≥12 | Forte supporto morfologico/IHC |
| MODERATE | 6-11 | Supporto intermedio |
| LOW | <6 | Debole supporto |
| MOLECULAR | Varia | Conferma molecolare (vedi sotto) |

**Sistema Molecular Confidence a 2 Tier (v4.1):**

| Tier | Marker | Soglia Score | Rationale |
|------|--------|--------------|-----------|
| **Tier 1: Patognomonici** | ETV6-NTRK3, MYB-NFIB, NR4A3 | **≥5** | Marker patognomonico in contesto morfologico almeno compatibile |
| **Tier 2: Supportivi** | PLAG1, HMGA2, MAML2 | **≥10** | Marker supportivo richiede morfologia solida per confidence molecular |

**Note critiche:**
- Anche marker **patognomonici** richiedono score ≥5 (non zero assoluto)
  - Razionale: evitare "MOLECULAR confidence" su pattern completamente incompatibili
  - Esempio: ETV6+ con score MASC=2 → morfologia troppo debole → confidence MODERATE
- Marker **supportivi** richiedono score ≥10
  - Razionale: MAML2/PLAG1 presenti solo in 50-70% casi → non possono "nobilitare" morfologia debole
  - Esempio: MAML2+ con score MEC=6 → confidence MODERATE (non MOLECULAR)

**Esempi:**
- MEC score 6 + MAML2+ → confidence MODERATE (marker supportivo, score basso)
- MEC score 12 + MAML2+ → confidence MOLECULAR (marker supportivo, score alto)
- MASC score 6 + ETV6+ → confidence MOLECULAR (marker patognomonico, score ≥5)
- MASC score 3 + ETV6+ → confidence LOW (marker patognomonico, ma morfologia incompatibile)

**NUOVO v4.1**: Alert automatico se score top 2 diagnosi differiscono <3 punti

---

## 🚀 Come Usare

### Online (GitHub Pages)
```
https://YOUR_USERNAME.github.io/salivary-gland-tool/
```

### Localmente
```bash
git clone https://github.com/YOUR_USERNAME/salivary-gland-tool.git
cd salivary-gland-tool
open salivary_gland_tool_v4.1.html
```

### Workflow Consigliato

1. **Step 1-3**: Dati clinici e morfologia HE
2. **Step 4-5**: Pannello IHC (base + discriminanti)
3. **Step 6**: Risultati molecolari (se disponibili)
4. **Step 7**: Grading (se pattern suggestivo MEC o Ca ex-PA)
5. **Step 8**: Sospetto clinico per correlazione
6. **Step 9**: Valutazione DDx e export report

---

## ⚠️ Disclaimer Medico-Legale

### Limitazioni
- **NON è uno strumento diagnostico definitivo**
- **NON sostituisce la valutazione patologica completa**
- I risultati sono **indicazioni probabilistiche**

### Responsabilità
L'utilizzo richiede:
- ✅ Competenza nel riconoscimento dei pattern istologici
- ✅ Familiarità con immunoistochimica
- ✅ Capacità di interpretazione dei risultati molecolari
- ✅ Correlazione clinico-radiologica appropriata

### Casi da Segnalare
Se il tool restituisce:
- Confidence LOW per tutte le diagnosi → Dati insufficienti
- Score simili per entità diverse → Caso borderline (v4.1: alert automatico)
- Discordanza con sospetto clinico → Rivalutare morfologia

---

## 🔬 Base Scientifica

### Reference Principali

1. **WHO Classification of Head and Neck Tumours** (5th ed, 2022)
   - Skálová A, et al. Head Neck Pathol. 2022;16:40-53

2. **MYB-NFIB in ACC**
   - Persson M, et al. PNAS. 2009;106:18740-4

3. **PLAG1 in PA**
   - Kas K, et al. Nat Genet. 1997;15:170-4

4. **NR4A3 in AciCC**
   - Haller F, et al. Nat Commun. 2019;10:368

5. **ETV6-NTRK3 in MASC**
   - Skálová A, et al. Am J Surg Pathol. 2010;34:599-608

6. **MEC Grading**
   - Brandwein MS, et al. Am J Surg Pathol. 2001;25:835-45

7. **LEF1 in PA vs ACC**
   - Wysocki PT, et al. Am J Surg Pathol. 2015;39:1433-40

8. **IHC Practical Guide**
   - Higgins KE, Cipriani NA. Semin Diagn Pathol. 2022;39:17-28

---

## 💡 Tips Pratici (Aggiornati v4.1)

### Quando usare la molecolare

| Scenario | Test consigliato |
|----------|------------------|
| PA vs ACC dubbio, LEF1 non disponibile | FISH PLAG1 + MYB |
| Pattern acinare, DOG1+ | FISH NR4A3 vs ETV6 |
| Morfologia duttale, AR+ | Considerare SDC |
| Storia di PA, trasformazione? | FISH PLAG1/HMGA2 |

### Red Flags

- **PNI estesa** = ACC fino a prova contraria
- **Crescita rapida in PA noto** = Escludere Ca ex-PA
- **AR+/HER2+ in alto grado** = SDC (target terapeutici!)
- **ETV6-NTRK3+** = MASC (potenziale TRK inhibitor)
- **Ki-67 15-20% in PA cellulato** = NON necessariamente maligno (v4.1)
- **Ca ex-PA in trucut** = Solo sospetto, diagnosi definitiva su pezzo operatorio

### Nuove Raccomandazioni v4.1

**Ki-67:**
- Usare come **modulatore**, non discriminante assoluto
- Valutare sempre hot spot vs media complessiva
- In caso di discrepanza IHC vs morfologia → favorire morfologia

**Mantello mioepiteliale:**
- Pattern "indeterminato" → non forzare interpretazione
- PA con p63 focale esiste (non è automaticamente ACC)
- ACC tubulare può avere SMA residua (non è automaticamente PA)

**Ca ex-PA:**
- In trucut → diagnosi descrittiva: "carcinoma ad alto grado con storia di PA"
- NON diagnosticare Ca ex-PA su trucut senza componente PA visibile
- Score automaticamente ridotto 40% se trucut

---

## 🚫 Entità Non Coperte da Questo Tool

Questo strumento si focalizza sulle **8 entità più comuni e/o diagnosticamente ambigue** 
in patologia salivare. Le seguenti entità NON sono incluse nel sistema di scoring:

### Entità Benigne Escluse
- **Oncocitoma** - Pattern oncocitario puro, senza stroma linfoide (vs Warthin)
- **Basal Cell Adenoma (BCA)** - Pattern basaloide benigno, mantello intatto
- **Canalicular Adenoma** - Pattern canalicolare, tipico labbro inferiore
- **Cystadenoma** - Lesione cistica benigna, variante papillare o mucinosa

### Entità Maligne Escluse
- **Hyalinizing Clear Cell Carcinoma (HCCC)** - Cellule chiare + stroma ialino, EWSR1+
- **Epithelial-Myoepithelial Carcinoma (EMC)** - Architettura bifasica, PLAG1/HMGA2 possibili
- **Polymorphous Adenocarcinoma (PAC)** - Pattern papillare/cribriforme, PRKD1-3 fusions
- **Basal Cell Adenocarcinoma** - Raro, aspetto basaloide maligno
- **Carcinoma ex-MEC** - Trasformazione maligna di MEC (estremamente raro)
- **Squamous Cell Carcinoma** - Primitivo vs metastatico (diagnosi diretta)
- **Small Cell Carcinoma** - Alto grado neuroendocrino (diagnosi diretta)

### Perché Queste Entità Non Sono Incluse?

1. **Diagnosi morfologica diretta** - Pattern distintivi riconoscibili all'HE senza scoring complesso
   - HCCC: cellule chiare + stroma ialino patognomonico
   - EMC: architettura bifasica epitelio + mioepitelio
   - PAC: pattern papillare/cribriforme uniforme, nuclei blandi

2. **Rarità** - Incidenza <2% delle neoplasie salivari ciascuna
   - BCA: ~1-2% delle neoplasie salivari
   - HCCC: <1%
   - EMC: ~1%

3. **Evitare overcomplication** - Il tool diventerebbe inutilizzabile con 15+ entità
   - Focus su differenziali clinicamente più frequenti
   - Priorità a PA vs ACC (differenziale più critico)

### Cosa Fare Se Sospetti Una di Queste Entità?

**Step diagnostici:**

1. **Consulta WHO Classification 2022** per criteri diagnostici definitivi
   - HCCC: Immunoprofilo CK7+/p63+/p40+, EWSR1 riarrangiamento
   - EMC: Doppia popolazione epiteliale + mioepiteliale, possibile PLAG1+
   - PAC: PRKD1/2/3 rearrangement o mutazioni

2. **Valuta pannello IHC specifico:**
   - HCCC: p63/p40 (positivi), DOG1 (negativo)
   - EMC: Pattern "a due strati" con SMA+/CK7+ segregati
   - PAC: S100+/SOX10+, bassa proliferazione

3. **Considera consulenza terziaria** presso centri di riferimento
   - Casi borderline o morfologicamente atipici
   - Necessità di conferma molecolare
   - Pianificazione terapeutica

4. **Studi molecolari mirati:**
   - EWSR1 FISH per HCCC
   - PRKD1-3 riarrangiamenti/mutazioni per PAC
   - Esclusione PLAG1/HMGA2 per EMC vs PA

### Note Importanti

- Se la morfologia suggerisce una di queste entità **non forzare** il tool a dare una diagnosi tra le 8 coperte
- Pattern clear cell diffuso → considerare HCCC, non solo clear cell variant di MEC
- Pattern papillare uniforme → considerare PAC, specialmente in palato/minor glands
- In caso di dubbio → **consulenza** sempre preferibile a overinterpretazione

---

## 🔧 Tecnologia

- **HTML5 + JavaScript vanilla** (zero dependencies)
- **Fully client-side** - nessun dato trasmesso
- **Responsive design** - desktop e tablet
- **Export TXT** - report strutturato

---

## 📊 Changelog v4.1

### Modifiche Principali

**Scoring System:**
- ⚙️ Ki-67: pesi ridotti (±1-2 vs ±3-5), cut-off aggiornati (10-20% zona grigia)
- ⚙️ Mantello mioepiteliale: da 3 a 5 livelli (intact/partialPA/indeterminate/partialACC/lost)
- ⚙️ Ca ex-PA trucut: penalty automatico -40% score
- ⚙️ Alert automatico per score differenziali <3 punti

**UX/UI:**
- 🎨 Warning box Ki-67 con disclaimer instabilità
- 🎨 Info box mantello 5 livelli con spiegazione dettagliata
- 🎨 Disclaimer rosso Ca ex-PA attivato automaticamente in trucut
- 🎨 Warning box score ravvicinati con checklist azioni
- 🎨 Score de-enfatizzato: "indicativo ±2", grigio, font piccolo
- 🎨 Warning pattern non classificabile: avviso entità rare (EMC, PAC, HCCC...)

**Documentazione:**
- 📚 Sezione "Entità Non Coperte" con 10+ entità escluse
- 📚 Tips pratici aggiornati per v4.1
- 📚 Reference a WHO 2022 per entità rare

---

## 📧 Feedback

Bug, errori scientifici o suggerimenti:
- Issue su GitHub
- Email: [inserire]

Particolarmente gradito feedback su:
- Pesi scoring (se troppo aggressivi/conservativi)
- Nuovi marcatori IHC da integrare
- Funzionalità UX/UI

---

## 📄 Licenza

**CC BY 4.0** - Uso libero con attribuzione

---

## 👨‍⚕️ Autore

**Dr. Filippo**  
Direttore SC Anatomia Patologica  
ASST Fatebenefratelli-Sacco, Milano

---

**Versione**: 4.1  
**Data**: Gennaio 2026  
**Status**: Production-ready

---

*"La diagnosi è del patologo, il tool è solo un supporto. Ma meglio un supporto ben calibrato."*


---

## 🗺️ Roadmap Futuro

### **Polish Finale Completato (v4.1)**

✅ **Score Ultra-Neutralizzato**
- Font ridotto: 10px → 9px
- Colore ultra-chiaro: #a0aec0 → #cbd5e0
- Font-weight light: 400 → 300
- Risultato: numero quasi invisibile, focus su confidence badge

✅ **Footer Epistemologico a 2 Livelli**
- Sintesi ultra-memorabile: "Il tool modella il ragionamento, non la biologia" (6 parole)
- Spiegazione dettagliata: "coerenza interna vs realtà biologica"
- Blindatura epistemologica completa

---

### **v4.2 (Possibili Miglioramenti Opzionali)**

Considerazioni post-review da senior:

**1. FNAB Penalty Numerica (opzionale)**
- Status v4.1: warning narrativo forte, score invariato
- Opzione futura: `score * 0.85` per FNAB
- Decisione attuale: mantenere coerenza interna + warning esplicativo

**2. Teaching Mode (didattico)** 🎓
- Modalità che spiega peso di ogni criterio in tempo reale
- Esempio: "p63+ → +3 perché marker mioepiteliale affidabile"
- Impatto: fortissimo per formazione specializzandi
- **Implementazione tecnica:**
  ```javascript
  const teachingMode = true;  // Toggle
  
  // Database con campo teaching:
  PA: {
      weights: { pattern: { pleomorphic: 5 } },
      teaching: {
          pattern_pleomorphic: "Pattern pleomorfo patognomonico PA. 
                                Score +5 per alta specificità."
      }
  }
  
  // UI: pulsante toggle + spiegazioni espandibili
  if (teachingMode) {
      showTeachingExplanations(rationales);
  }
  ```
- **UI Mock-up:**
  ```
  ✓ p63 positivo → +3 punti
    [?] Perché +3? p63 è il marker mioepiteliale più affidabile.
        Peso +3 (forte) perché specifico per mantello.
        Se fosse solo SMA, sarebbe +2 (meno specifico).
  ```
- **Beneficio:** Trasforma tool da "black box" a "libro di testo interattivo"
- **Complessità:** Alta (refactoring database + UI)
- **Priorità:** Media-alta per v4.2

**3. Export PDF Formattato**
- Status: export TXT funzionale
- Futuro: PDF con tabelle, grafici, formatting professionale

### **v5.0 (Maggiori Ristrutturazioni)**

**1. Pattern Mioepiteliale Ultra-Fine**
- Distinguere: p63–/calponina+ (pattern misto raro)
- Attuale: sistema p63-centrico clinicamente difendibile

**2. Integrazione WHO vs AFIP Grading MEC**
- Comparazione WHO 2022 vs AFIP side-by-side

**3. AI-Assisted Pattern Recognition (sperimentale)**
- Upload immagini HE → suggerimento pattern automatico
- Disclaimer: "suggerimento AI, verifica umana obbligatoria"

