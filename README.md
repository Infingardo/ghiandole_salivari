# 🔬 Salivary Gland Diagnostic Tool v4.0

**Supporto decisionale per la diagnosi differenziale di neoplasie epiteliali delle ghiandole salivari**

---

## 📋 Novità v4.0

### 🎯 Sistema Multi-Diagnosi
A differenza della v3.x (focalizzata su PA vs ACC), la v4.0 implementa uno **scoring parallelo per 8 entità**:

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
| **PLAG1** | PA | Gold standard (~70%), aggiunto in v4 |
| **HMGA2** | PA | Alternativo (~30%) |
| **MYB-NFIB** | ACC | ~80% ACC |
| **NR4A3** | AciCC | Altamente specifico |
| **ETV6-NTRK3** | MASC | Patognomonico |
| **MAML2** | MEC | 50-70%, prognosticamente favorevole |

### 🔬 Nuovi Marcatori IHC

**Aggiunti in v4.0:**
- **SOX10** - Cruciale per ACC e tumori mioepiteliali
- **CD117** (c-Kit) - Marker di malignità, forte in ACC
- **AR** - Recettore androgeni (SDC ~90%)
- **HER2** - Target terapeutico in SDC
- **GCDFP-15** - Differenziazione apocrina
- **Mammaglobina** - AciCC e MASC
- **Pan-TRK** - Screening NTRK fusions (MASC)
- **CK5/6** - Componente squamoide MEC

### ⚠️ Fix Critici

1. **LEF1 sempre disponibile** - Non più limitato al pattern pleomorfo
2. **Mantello mioepiteliale tripartito** - Intact/Partial/Lost invece di binario
3. **Gestione Ca ex-PA** - Step dedicato con storia clinica e misurazione invasione
4. **Evidence quality tags** - Distinzione tra criteri morfologici, IHC e molecolari

---

## 🎯 Funzionalità

### 9 Step Strutturati

1. **Contesto Clinico** - Campione, ghiandola, red flags per Ca ex-PA
2. **Criteri di Malignità** - PNI, atipia, necrosi, mitosi
3. **Pattern Architetturale** - 10 pattern con % componente solida
4. **IHC Base** - Mioepiteliali + generali + Ki-67
5. **IHC Discriminanti** - LEF1, AR, HER2, Mammaglobina, etc.
6. **Molecolare** - FISH/NGS per tutte le entità principali
7. **Grading** - MEC (AFIP) + Ca ex-PA invasion
8. **Informazioni Cliniche** - Sospetto referente e note
9. **Risultati** - DDx rankizzata con grading e correlazione

### Sistema di Scoring

Ogni marcatore contribuisce con un peso specifico per ogni entità:
- Pesi **positivi**: supportano la diagnosi
- Pesi **negativi**: contraddicono la diagnosi
- Risultato molecolare positivo = **confidence "MOLECULAR"**

### Confidence Levels

| Level | Score | Significato |
|-------|-------|-------------|
| HIGH | ≥12 | Forte supporto morfologico/IHC |
| MODERATE | 6-11 | Supporto intermedio |
| LOW | <6 | Debole supporto |
| MOLECULAR | Qualsiasi + mol+ | Conferma molecolare |

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
open index.html
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
- Score simili per entità diverse → Caso borderline
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

## 💡 Tips Pratici

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

---

## 🔧 Tecnologia

- **HTML5 + JavaScript vanilla** (zero dependencies)
- **Fully client-side** - nessun dato trasmesso
- **Responsive design** - desktop e tablet
- **Export TXT** - report strutturato

---

## 📧 Feedback

Bug, errori scientifici o suggerimenti:
- Issue su GitHub
- Email: [inserire]

---

## 📄 Licenza

**CC BY 4.0** - Uso libero con attribuzione

---

## 👨‍⚕️ Autore

**Dr. Filippo**  
Direttore SC Anatomia Patologica  
ASST Fatebenefratelli-Sacco, Milano

---

**Versione**: 4.0  
**Data**: Dicembre 2025  
**Status**: Production-ready

---

*"La diagnosi è del patologo, il tool è solo un supporto."*
