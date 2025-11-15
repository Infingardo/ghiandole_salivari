# 🔬 Salivary Gland Diagnostic Tool v3.1

**Supporto decisionale per la diagnosi differenziale di neoplasie epiteliali delle ghiandole salivari**

---

## 📋 Descrizione

Strumento web-based interattivo per l'identificazione e la diagnosis differenziale di tumori delle ghiandole salivari, basato su:
- **WHO Classification 5th Edition (2022)** - criteri diagnostici ufficiali
- **Algoritmo di scoring PA vs ACC** - le diagnosi più critiche nella pratica
- **Integrazione HE + IHC + Molecolare** - workflow diagnostico completo
- **Correlazione clinica** - confronto con il sospetto clinico del referente

---

## 🎯 Funzionalità Principali

### 8 Step Strutturati
1. **Contesto clinico** - Tipo campione (trucut/pezzo/FNAB), ghiandola, localizzazione
2. **Malignità** - Infiltrazione perineurale, citologia, necrosi
3. **Pattern HE** - Architettura (pleomorfo, basaloide, cribriforme, acinare, etc.)
4. **IHC Base** - p63, SMA, Calponina, CK7, S100, DOG1, Ki-67
5. **IHC Discriminanti** - Marcatori pattern-specifici (LEF1, CD117, etc.)
6. **Studi Molecolari** - MYB-NFIB, NR4A3, ETV6-NTRK3, MAML2 (FISH/PCR)
7. **Sospetto Clinico** - Diagnosi sospettata dal referente (opzionale)
8. **Risultati** - Diagnosi differenziale rankizzata con correlazione clinica

### Algoritmo di Scoring PA vs ACC
Discrimina le due diagnosi più critiche della pratica quotidiana:
- **Pattern** (pleomorfo=PA, basaloide/cribriforme=ACC)
- **Mantello mioepiteliale** (intatto=PA, perso=ACC)
- **Infiltrazione perineurale** (parametro CRITICO)
- **LEF1 IHC** (positivo=PA, negativo=ACC)
- **MYB-NFIB FISH** (positivo=ACC ~80%)
- **Ki-67** (basso≤10%=PA, alto>15%=ACC)

### Gestione Campioni
- ✅ **Trucut/Ago-biopsia** - Avviso su margini non valutatibili
- ✅ **Pezzo operatorio** - Campione completo
- ✅ **FNAB** - Citologia con limitazioni architetturali

### Matching Sinonimi
Riconosce automaticamente i nomi alternativi:
- "Cistoadenolinfoma" = "Tumore di Warthin"
- "Pleomorfo" = "Adenoma pleomorfo"
- "ACC" = "Adenoidocistico"
- "MEC" = "Mucoepidermoide"
- E molti altri...

---

## 🚀 Come Usare

### Online (GitHub Pages)
Visita: `https://YOUR_USERNAME.github.io/ghiandolesalivari/`

### Localmente
1. Clone il repo:
```bash
git clone https://github.com/YOUR_USERNAME/ghiandolesalivari.git
cd ghiandolesalivari
```

2. Apri `index.html` nel browser
```bash
open index.html
# o semplicemente doppio-click su index.html
```

### Workflow Tipico
1. **Step 1-3**: Inserisci dati clinici e morfologia HE
2. **Step 4-6**: Compila IHC (base + discriminanti + molecolare)
3. **Step 7**: Inserisci il sospetto clinico (opzionale)
4. **Step 8**: Visualizza la DDx rankizzata con:
   - Score per ogni diagnosi (0-20)
   - Confidence level (HIGH/MODERATE/LOW)
   - Rationale diagnostico
   - Correlazione con sospetto clinico
5. **Esporta PDF**: Report clinico pronto per allegare al referto

---

## ⚠️ Disclaimer Medico-Legale

### Limitazioni Critiche
- **NON è uno strumento decisionale definitivo**
- **NON sostituisce la valutazione clinica diretta e l'expertise del patologo**
- I risultati devono sempre essere **integrati con**:
  - Revisione autonoma della morfologia HE
  - Correlazione clinica appropriata
  - Comunicazione col clinico referente
  - Eventuale second opinion per casi dubbi

### Responsabilità dell'Operatore
L'utilizzo di questo tool implica:
- ✅ Competenza nel riconoscere i pattern istologici
- ✅ Familiarità con le colorazioni IHC
- ✅ Consapevolezza dei limiti diagnostici
- ✅ Responsabilità legale dei risultati finali

### Accuratezza
- Algoritmo basato su **WHO 2022** e letteratura internazionale
- Validato principalmente su **PA vs ACC** (diagnosi focus)
- Altre diagnosi sono supportate ma meno robuste
- Feedback scientifico è benvenuto

---

## 🔬 Base Scientifica

### Reference Principali
- **WHO Classification of Head and Neck Tumours** (5th edition, 2022)
  - Skalova A, Hyrcza MD, Leivo I. Head Neck Pathol. 2022;16:40-53
  
- **ICGC Data Set for Salivary Carcinomas** 
  - Seethala RR, et al. Arch Pathol Lab Med. 2019;143:578-586

- **IHC Practical Guide in Salivary Gland Pathology**
  - Higgins KE, Cipriani NA. Semin Diagn Pathol. 2022;39:17-28

### Marcatori Chiave
| Marcatore | Utilità | Note |
|-----------|---------|------|
| **LEF1** | PA vs ACC | LEF1+ esclude ACC |
| **MYB-NFIB** | ACC | FISH, 80% ACC |
| **NR4A3** | Carcinoma acinare | FISH, gold standard |
| **ETV6-NTRK3** | MASC | FISH, specifico |
| **MAML2** | MEC | 50-70% MEC |
| **Mantello mio** | PA vs ACC | p63+SMA+Cal intatto = PA |
| **PNI** | Malignità | CRITICO, ACC marker |
| **DOG1** | Acinare/Oncocitario | IHC, aspecifico ma utile |
| **CD117** | ACC | Marcatore di malignità |

---

## 💡 Tips Pratici

### Consigli d'Uso
1. **Non saltare gli step** - L'ordine ha una logica (diagnosi imparziale prima del sospetto)
2. **Compila il Ki-67** - Parametro essenziale per PA vs ACC
3. **Segna "Non eseguito"** - Se manca un marcatore, indicarlo esplicitamente
4. **Pattern cribriforme = ACC** - Se vedi pseudocisti ialino-rivestite, pensa ad ACC
5. **PNI presente = RED FLAG** - Aumenta significativamente la probabilità di malignità

### Casi Dubbi
Se il tool dà **confidence MODERATE/LOW**:
- ✅ Considera molecolare aggiuntiva (FISH per MYB, LEF1, NR4A3)
- ✅ Rivaluta la morfologia HE con maggiore attenzione
- ✅ Consulta un collega specializzato
- ✅ Se persiste il dubbio, segnalare nel referto

---

## 🔧 Tecnologia

- **HTML5 + JavaScript vanilla** (no dependencies)
- **Fully client-side** - nessun dato caricato su server
- **Responsive design** - funziona su desktop e tablet
- **PDF export** (html2pdf.js)
- **GitHub Pages ready** - deploy istantaneo

---

## 📧 Feedback e Contributi

Feedback scientifico ben accetto!

Se identifichi:
- ❌ Errori diagnostici
- 🐛 Bug nel tool
- ✨ Miglioramenti suggeriti
- 📚 Riferimenti scientifici mancanti

Contatta: [Email Author] oppure apri un Issue su GitHub

---

## 📄 Licenza

**Creative Commons Attribution 4.0 International (CC BY 4.0)**
- ✅ Puoi usare, modificare, distribuire
- ✅ Devi dare credito
- ✅ NON warranty - usa a tuo rischio

---

## 👨‍⚕️ Autore

**Dr. Filippo [Cognome]**  
Direttore, Sezione Anatomia Patologica  
ASST Fatebenefratelli-Sacco, Milano  

Expertise: Patologia ghiandole salivari, Dermatopatologia, Ematopatologia  

---

## 🙏 Ringraziamenti

- WHO Classification Editorial Board (2022)
- International Collaboration on Cancer Reporting (ICGC)
- Comunità scientifica internazionale di patologi salivari

---

**Versione**: 3.1  
**Data**: Novembre 2025  
**Status**: Production-ready  

⚠️ **Disclaimer finale**: Questo strumento è un SUPPORTO decisionale, non una diagnosi definitiva. La responsabilità ultima della diagnosi rimane al patologo.

---

*"Diagnosi sapientis est, treatment is based on diagnosis"*
