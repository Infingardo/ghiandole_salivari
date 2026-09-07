// ─────────────────────────────────────────────────────────────────────────────
//  MOTORE — ghiandole salivari, modello a due cancelli. Logica pura, niente DOM.
//  Estratto da index.html nella v5.1.0.
//
//  Gate 1 esclude su incompatibilita' morfologiche dure; Gate 2 ordina i sopravvissuti
//  con un punteggio grezzo (nessuna percentuale: LOW / MODERATE / HIGH su soglie fisse).
//  Ogni funzione riceve lo stato del form (`fd`) invece di leggere una variabile globale.
// ─────────────────────────────────────────────────────────────────────────────

// v5.1.0 — Un reperto ha TRE stati: presente, assente, NON VALUTATO. I cancelli ne
// conoscevano due: `fd.x !== 'atteso'` era vero anche per i campi mai compilati, e su
// un form completamente vuoto MSA e Warthin uscivano gia' escluse ("No microcystic AND
// no duality", "Warthin requires BOTH...") mentre MEC guidava la classifica con 3 punti
// per una mucina che nessuno aveva guardato.
const isSet   = v => v !== undefined && v !== null && v !== '' && v !== 'not_done';
const is      = (v, ...vals) => isSet(v) && vals.includes(v);
// isNot esige il dato: un campo non compilato non contraddice nulla.
const isNot   = (v, ...vals) => isSet(v) && !vals.includes(v);

// Criteri che una core biopsy o un agoaspirato non permettono di valutare: su quei
// campioni un deal-breaker che vi si appoggia diventa "non determinabile", non un'esclusione.
const ARCHITECTURAL_FIELDS = ['cribriform','duality','microcystic','solid_nests','stromal_type','neural_invasion'];
const LIMITED_SPECIMENS = ['trucut','fnab'];

// Campi raccolti dal form e non ancora usati da nessuna regola. Elencati qui di
// proposito: un test verifica che la lista corrisponda alla realta', cosi' restano
// visibili invece di sparire in fondo a un wizard.
const UNSCORED_FIELDS = ['solid_nests','myoepithelial_invasive'];

function evaluateDealBreaker(entity, fd){
  switch(entity){
    case 'PA':
      if(fd.nuclear_grade==='high') return {hit:true,msg:'Nuclear grade high. Reconsider.'};
      if(fd.necrosis==='yes') return {hit:true,msg:'Coagulative necrosis suggests malignancy.'};
      if(fd.neural_invasion==='extensive') return {hit:true,msg:'Extensive PNI: PA is benign. Reconsider.'};
      return {hit:false,needs:['nuclear_grade','necrosis','neural_invasion']};
      
    case 'ACC':
      if(fd.cribriform==='no' && fd.duality==='absent') 
        return {hit:true,msg:'Both cribriform AND duality absent: ACC less likely.',
                needs:['cribriform','duality'],absence:true};
      if(fd.mucin_production==='abundant') 
        return {hit:true,msg:'Abundant mucin suggests MEC.'};
      return {hit:false,needs:['cribriform','duality','mucin_production']};
      
    case 'SC':
      if(fd.mammaglobin==='neg' && fd.etv6==='neg') 
        return {hit:true,msg:'No mammaglobin AND no ETV6 fusion: SC unlikely.'};
      return {hit:false,needs:['mammaglobin','etv6']};
      
    case 'MEC':
      if(fd.mucin_production==='absent') 
        return {hit:true,msg:'No mucinous cells: MEC unlikely.'};
      return {hit:false,needs:['mucin_production']};
      
    case 'AciCC':
      if(fd.serous_acinar==='absent') 
        return {hit:true,msg:'No serous acinar: AciCC unlikely.'};
      if(fd.cribriform==='yes' && fd.duality==='clear') 
        return {hit:true,msg:'Cribriform+duality pattern suggests ACC.'};
      return {hit:false,needs:['serous_acinar']};
      
    case 'MSA':
      if(isNot(fd.microcystic,'yes') && isNot(fd.duality,'clear'))
        return {hit:true,msg:'Né pattern microcistico né dualità documentati come presenti: MSA meno probabile.',
                needs:['microcystic','duality'],absence:true};
      return {hit:false,needs:['microcystic','duality']};
      
    case 'CaExPA':
      // v5.1.0: non e' un motivo di esclusione — gateOne lo mostrava come "reason" di
      // un'entita' PASSATA, dove per tutte le altre quel campo spiega perche' e' fuori.
      return {hit:false,needs:['priorPA','residualPA'],
              note: (fd.residualPA==='no' && fd.priorPA!=='yes') ? 'Nessuna storia né PA residuo: potrebbe essere un carcinoma primitivo.' : null};
      
    case 'Warthin':
      // v5.1.0: esclude solo se un campo COMPILATO contraddice; se mancano, resta indeterminata.
      if(isNot(fd.oncocytic,'prominent') || isNot(fd.lymphoid_stroma,'abundant'))
        return {hit:true,msg:'Warthin richiede oncociti prominenti E stroma linfoide abbondante: uno dei due è documentato come assente.',needs:['oncocytic','lymphoid_stroma']};
      return {hit:false,needs:['oncocytic','lymphoid_stroma']};
      
    case 'EMC':
      return {hit:false};
      
    case 'PolymorphousAC':
      return {hit:false};
      
    case 'HCCC':
      return {hit:false};
      
    default: return {hit:false};
  }
}

// PRO/CON/MISSING — v5.0.3: aggiunto HRAS+PIK3CA per CaExPA e EMC
function getProConMissing(entity, fd){
  const procon={};
  
  // Helper: dual PIK3CA pattern
  const dualPIK3CA = fd.pik3ca === 'dual';
  const hrasPos = fd.hras === 'pos';
  const hrasDualPIK = hrasPos && dualPIK3CA;
  
  switch(entity){
    case 'ACC':
      procon.pro=[
        fd.cribriform==='yes' ? '✓ Cribriform' : null,
        fd.duality==='clear' ? '✓ Duality' : null,
        fd.neural_invasion==='extensive' ? '✓ Extensive PNI' : null,
        fd.myb==='pos' ? '✓ MYB+' : null,
        fd.p63==='pos' ? '✓ p63/SMA+ (strato mioepiteliale conservato)' : null
      ].filter(Boolean);
      procon.con=[
        fd.mucin_production==='abundant' ? '✗ Abundant mucin' : null,
        fd.serous_acinar==='prominent' ? '✗ Prominent serous' : null,
        hrasPos ? '✗ HRAS Q61+ (non tipico di ACC)' : null,
        fd.p63==='neg' ? '✗ p63/SMA negativo: senza componente mioepiteliale l ACC è difficile da sostenere' : null
      ].filter(Boolean);
      procon.missing=[
        !fd.myb ? '? MYB status' : null,
        !fd.maml2 ? '? MAML2 status' : null
      ].filter(Boolean);
      break;
      
    case 'MEC':
      procon.pro=[
        is(fd.mucin_production,'scant','moderate','abundant') ? '✓ Mucinous cells' : null,
        fd.maml2==='pos' ? '✓ MAML2+' : null,
        fd.neural_invasion==='focal' ? '✓ Focal PNI' : null
      ].filter(Boolean);
      procon.con=[
        fd.cribriform==='yes' ? '✗ Cribriform pattern' : null,
        hrasPos ? '✗ HRAS Q61+ (inusuale in MEC convenzionale)' : null
      ].filter(Boolean);
      procon.missing=[
        !fd.maml2 ? '? MAML2 fusion' : null
      ].filter(Boolean);
      break;
      
    case 'SC':
      procon.pro=[
        fd.mammaglobin==='pos' ? '✓ Mammaglobin+' : null,
        fd.etv6==='pos' ? '✓ ETV6-NTRK3+' : null,
        fd.serous_acinar==='moderate' ? '✓ Serous differentiation' : null
      ].filter(Boolean);
      procon.con=[
        fd.serous_acinar==='absent' ? '✗ No serous' : null,
        hrasPos ? '✗ HRAS Q61+ (non tipico di SC)' : null
      ].filter(Boolean);
      procon.missing=[
        !fd.mammaglobin ? '? Mammaglobin (KEY marker)' : null,
        !fd.etv6 ? '? ETV6-NTRK3 fusion' : null
      ].filter(Boolean);
      break;
      
    case 'PA':
      procon.pro=[
        fd.stromal_type==='myxoid' ? '✓ Myxoid stroma' : null,
        fd.nuclear_grade==='low' ? '✓ Low nuclear grade' : null,
        fd.necrosis==='no' ? '✓ No necrosis' : null,
        fd.p63==='pos' ? '✓ p63/SMA+ (componente mioepiteliale)' : null
      ].filter(Boolean);
      procon.con=[
        fd.mitotic_rate==='high' ? '✗ High mitotic' : null,
        fd.neural_invasion==='extensive' ? '✗ Extensive PNI' : null,
        hrasPos ? '✗ HRAS Q61+ (suggerisce trasformazione maligna)' : null
      ].filter(Boolean);
      procon.missing=[
        !fd.lef1 ? '? LEF1 (supportive)' : null,
        !fd.plag1 ? '? PLAG1 (supportive)' : null
      ].filter(Boolean);
      break;

    case 'CaExPA':
      procon.pro=[
        fd.priorPA==='yes' ? '✓ Storia di PA' : null,
        fd.residualPA==='yes' ? '✓ PA residuo visibile' : null,
        fd.nuclear_grade==='high' ? '✓ High grade' : null,
        fd.necrosis==='yes' ? '✓ Necrosi presente' : null,
        hrasPos ? '✓ HRAS Q61+ (frequente in CaExPA, componente mioepiteliale)' : null,
        dualPIK3CA ? '✓ Dual PIK3CA (attivazione PI3K/AKT ridondante — pattern aggressivo)' : null,
        hrasDualPIK ? '⚠️ HRAS+dual PIK3CA: profilo ad alto rischio biologico. Fenotipo aggressivo atteso.' : null
      ].filter(Boolean);
      procon.con=[
        fd.priorPA==='no' && fd.residualPA==='no' ? '✗ Nessun PA residuo/storia (diagnosi meno certa)' : null
      ].filter(Boolean);
      procon.missing=[
        !fd.hras ? '? HRAS Q61 (marker rilevante per CaExPA/MioepitelialCA)' : null,
        !fd.pik3ca ? '? PIK3CA (co-mutazione con HRAS = profilo aggressivo)' : null,
        hrasDualPIK && !fd.smarca4 ? '? SMARCA4/BRG1 IHC (DD NUT carcinoma / SMARCA4-deficient)' : null,
        hrasDualPIK && !fd.nut ? '? NUT IHC/FISH (DD NUT carcinoma se CK-neg)' : null
      ].filter(Boolean);
      // Alert speciale se CK-neg + PAX8-pos + HRAS+dualPIK3CA
      if(hrasDualPIK && fd.ck === 'neg'){
        procon.hrasAlert = '🔴 ATTENZIONE: CK-neg + HRAS Q61 + dual PIK3CA → escludere NUT carcinoma (IHC NUT clone C52B1 + FISH NUT1) e SMARCA4-deficient carcinoma (IHC BRG1/SMARCA4, perdita = positivo per diagnosi) prima di concludere per carcinoma mioepiteliale poco differenziato. PAX8+ in questo contesto può essere aspecifico (falso positivo in tumori indifferenziati ad alta instabilità genomica).';
      }
      break;

    case 'EMC':
      procon.pro=[
        fd.clear_cell==='yes' ? '✓ Clear cells' : null,
        fd.duality==='clear' ? '✓ Duality' : null,
        hrasPos && !dualPIK3CA ? '✓ HRAS+ senza dual PIK3CA (compatibile con EMC)' : null,
        fd.p63==='pos' ? '✓ p63/SMA+ (strato mioepiteliale esterno)' : null
      ].filter(Boolean);
      procon.con=[
        hrasDualPIK ? '✗ Dual PIK3CA (più tipico di CaExPA aggressivo che EMC)' : null
      ].filter(Boolean);
      procon.missing=[
        !fd.hras ? '? HRAS (presente in ~40% EMC)' : null,
        !isSet(fd.p63) ? '? p63/SMA (dimostra il doppio strato)' : null
      ].filter(Boolean);
      break;

    case 'MSA':
      procon.pro=[
        fd.microcystic==='yes' ? '✓ Microcystic' : null,
        fd.duality==='clear' ? '✓ Duality' : null,
        fd.mammaglobin==='neg' ? '✓ Mammaglobin neg' : null
      ].filter(Boolean);
      procon.con=[
        fd.duality==='absent' ? '✗ No duality' : null,
        hrasPos ? '✗ HRAS Q61+ (non tipico di MSA benigna)' : null
      ].filter(Boolean);
      procon.missing=[
        !fd.mef2c ? '? MEF2C::SS18 fusion' : null
      ].filter(Boolean);
      break;
      
    case 'AciCC':
      procon.pro=[
        fd.serous_acinar==='prominent' ? '✓ Acini sierosi prominenti' : null,
        fd.serous_acinar==='moderate' ? '✓ Differenziazione sierosa' : null,
        fd.dog1==='pos' ? '✓ DOG1+ (pattern apicale/canalicolare)' : null,
        fd.microcystic==='yes' ? '✓ Pattern microcistico' : null
      ].filter(Boolean);
      procon.con=[
        fd.cribriform==='yes' ? '✗ Cribriforme (orienta su ACC)' : null,
        fd.mucin_production==='abundant' ? '✗ Mucina abbondante (orienta su MEC)' : null,
        fd.mammaglobin==='pos' ? '✗ Mammaglobina+ (orienta su carcinoma secretorio)' : null
      ].filter(Boolean);
      procon.missing=[
        !fd.dog1 ? '? DOG1 IHC (marker di riferimento)' : null,
        !fd.mammaglobin ? '? Mammaglobina (DD carcinoma secretorio)' : null
      ].filter(Boolean);
      break;

    case 'Warthin':
      procon.pro=[
        fd.oncocytic==='prominent' ? '✓ Oncociti prominenti' : null,
        fd.lymphoid_stroma==='abundant' ? '✓ Stroma linfoide abbondante' : null,
        fd.papillary==='yes' ? '✓ Architettura papillare/cistica' : null
      ].filter(Boolean);
      procon.con=[
        fd.nuclear_grade==='high' ? '✗ Alto grado nucleare' : null,
        fd.necrosis==='yes' ? '✗ Necrosi' : null,
        fd.mucin_production==='abundant' ? '✗ Mucina abbondante (MEC può insorgere in Warthin)' : null
      ].filter(Boolean);
      procon.missing=[
        !fd.oncocytic ? '? Citoplasma oncocitario' : null,
        !fd.lymphoid_stroma ? '? Stroma linfoide' : null
      ].filter(Boolean);
      break;

    case 'PolymorphousAC':
      procon.pro=[
        fd.varied_patterns==='yes' ? '✓ Pattern architetturali multipli (carattere eponimo)' : null,
        fd.neural_invasion==='focal' ? '✓ PNI focale / crescita a bersaglio' : null,
        fd.nuclear_grade==='low' ? '✓ Basso grado nucleare' : null
      ].filter(Boolean);
      procon.con=[
        fd.cribriform==='yes' && fd.duality==='clear' ? '✗ Cribriforme con dualità netta (orienta su ACC)' : null,
        fd.necrosis==='yes' ? '✗ Necrosi coagulativa' : null
      ].filter(Boolean);
      procon.missing=[
        !fd.varied_patterns ? '? Varietà dei pattern architetturali' : null,
        '? PRKD1 E710D / riarrangiamenti PRKD (DD con ACC cribriforme) — non raccolto dal pannello'
      ].filter(Boolean);
      break;

    case 'HCCC':
      procon.pro=[
        fd.clear_cell==='yes' ? '✓ Cellule chiare (glicogeno)' : null,
        fd.stromal_type==='hyaline' ? '✓ Stroma ialino (carattere eponimo)' : null
      ].filter(Boolean);
      procon.con=[
        fd.duality==='clear' ? '✗ Dualità mioepiteliale netta (orienta su EMC)' : null,
        fd.p63==='pos' ? '✗ p63/SMA+ diffuso: nell HCCC il mioepitelio non c è (DD EMC)' : null,
        fd.mucin_production==='abundant' ? '✗ Mucina abbondante (orienta su MEC a cellule chiare)' : null
      ].filter(Boolean);
      procon.missing=[
        !fd.clear_cell ? '? Cellule chiare' : null,
        !fd.stromal_type ? '? Tipo di stroma' : null
      ].filter(Boolean);
      break;

    default:
      procon.pro=['(entity not detailed yet)'];
      procon.con=[];
      procon.missing=[];
  }
  return procon;
}

function gateOne(fd){
  fd = fd || formData;
  const entities=['PA','ACC','MEC','AciCC','SC','MSA','CaExPA','Warthin','EMC','PolymorphousAC','HCCC'];
  const limited = LIMITED_SPECIMENS.includes(fd.specimen_type);
  const result={};
  for(let e of entities){
    const db=evaluateDealBreaker(e,fd);
    const needs = db.needs || [];
    // v5.1.0: su core biopsy / FNAB un'esclusione fondata sull'ASSENZA di un reperto
    // architetturale diventa "non determinabile" — su quei campioni nessuno puo'
    // affermare che un pattern non ci sia. Un pattern VISTO invece resta un dato,
    // e le esclusioni che nascono da un reperto positivo continuano a valere.
    const architetturale = db.absence === true && needs.some(f => ARCHITECTURAL_FIELDS.includes(f));
    if(db.hit && limited && architetturale){
      result[e]={passed:true, undetermined:true,
        reason:`Non determinabile su ${fd.specimen_type==='fnab'?'agoaspirato':'core biopsy'}: il criterio di esclusione si appoggia a reperti architetturali.`};
      continue;
    }
    const mancanti = needs.filter(f => !isSet(fd[f]));
    result[e]={
      passed:!db.hit,
      undetermined: !db.hit && mancanti.length>0,
      reason: db.hit ? db.msg
            : mancanti.length>0 ? `Non verificato: manca ${mancanti.join(', ')}.`
            : (db.note || 'Gate 1 superato')
    };
  }
  return result;
}

function gateTwo(survivors, fd){
  const formData = fd || {};
  const scores={};
  for(let e of Object.keys(survivors)){
    if(!survivors[e].passed) continue;
    let score=0;
    const hrasPos = formData.hras === 'pos';
    const dualPIK3CA = formData.pik3ca === 'dual';
    const singlePIK3CA = formData.pik3ca === 'single';

    if(e==='ACC'){
      if(formData.cribriform==='yes') score+=2;
      if(formData.duality==='clear') score+=3;
      if(formData.neural_invasion==='extensive') score+=3;
      if(formData.myb==='pos') score+=2;    // MYB::NFIB
      if(hrasPos) score-=2; // HRAS non tipico di ACC
    }else if(e==='PA'){
      if(formData.stromal_type==='myxoid') score+=2;
      if(formData.nuclear_grade==='low') score+=2;
      if(hrasPos) score-=2; // HRAS suggerisce trasformazione
    }else if(e==='SC'){
      if(formData.mammaglobin==='pos') score+=4;
      if(formData.etv6==='pos') score+=3;
    }else if(e==='MEC'){
      // v5.1.0: serve il dato. Prima `!=='absent'` dava 3 punti anche a form vuoto,
      // mettendo il MEC in testa alla classifica di un caso in cui non si era guardato nulla.
      if(is(formData.mucin_production,'scant','moderate','abundant')) score+=3;
      if(formData.maml2==='pos') score+=3;
    }else if(e==='AciCC'){
      if(formData.serous_acinar==='prominent') score+=3;
      if(formData.dog1==='pos') score+=3;   // DOG1: marker di riferimento dell'AciCC
    }else if(e==='Warthin'){
      if(formData.oncocytic==='prominent' && formData.lymphoid_stroma==='abundant') score+=5;
    }else if(e==='CaExPA'){
      if(formData.priorPA==='yes') score+=2;
      if(formData.residualPA==='yes') score+=2;
      if(formData.nuclear_grade==='high') score+=1;
      if(hrasPos) score+=3;          // HRAS Q61 frequente in CaExPA mioepiteliale
      if(dualPIK3CA) score+=3;       // dual PIK3CA = pattern aggressivo tipico
      if(hrasPos && dualPIK3CA) score+=2; // bonus combinazione
      if(singlePIK3CA) score+=1;
    }else if(e==='EMC'){
      if(formData.clear_cell==='yes') score+=2;
      if(formData.duality==='clear') score+=2;
      if(hrasPos && !dualPIK3CA) score+=1;
    }else if(e==='MSA'){
      // v5.1.0: MSA aveva un deal-breaker e una raccomandazione di test dedicata
      // (MEF2C::SS18) ma nessun criterio che le desse punti: restava a 1 anche con
      // la fusione positiva, cioe' in fondo a qualunque classifica.
      if(formData.mef2c==='pos') score+=4;
      if(formData.microcystic==='yes') score+=2;
    }else if(e==='PolymorphousAC'){
      if(formData.varied_patterns==='yes') score+=3;   // pattern architetturali multipli: il carattere eponimo
    }else if(e==='HCCC'){
      if(formData.clear_cell==='yes') score+=3;
      if(formData.stromal_type==='hyaline') score+=2;  // stroma ialino: il carattere eponimo
    }else{
      score=1;
    }
    scores[e]={score,conf:score>=8?'HIGH':score>=5?'MODERATE':'LOW'};
  }
  return scores;
}

function checkDataQuality(fd){
  fd = fd || formData;
  const required=['cribriform','duality','mucin_production','serous_acinar','nuclear_grade','necrosis','neural_invasion'];
  const missing=required.filter(v=>!isSet(fd[v])).length;
  const warnings=[];
  // v5.1.0: il tipo di campione era chiesto per primo (con l'asterisco di obbligatorio)
  // e poi scartato — non entrava nemmeno in save(). Su core biopsy e agoaspirato
  // l'architettura non e' valutabile e i criteri che vi si appoggiano vengono sospesi.
  if(!isSet(fd.specimen_type))
    warnings.push('⚠️ Tipo di campione non indicato: i criteri architetturali vengono applicati come su pezzo operatorio.');
  else if(LIMITED_SPECIMENS.includes(fd.specimen_type))
    warnings.push(`⚠️ ${fd.specimen_type==='fnab'?'Agoaspirato':'Core biopsy'}: architettura non valutabile. I criteri di esclusione architetturali sono sospesi — nessuna entità viene esclusa su quella base.`);
  if(missing>3) warnings.push('⚠️ DATI MANCANTI: più di 3 campi non compilati. Risultati poco affidabili.');
  if(fd.cribriform==='yes' && fd.duality==='absent')
    warnings.push('🔴 CONTRADDIZIONE: cribriforme presente ma dualità assente. Ricontrollare.');
  // Nuovo: warning HRAS+PIK3CA senza IHC supplementare
  if(fd.hras==='pos' && fd.pik3ca==='dual' && !isSet(fd.smarca4) && !isSet(fd.nut))
    warnings.push('⚠️ HRAS Q61 + dual PIK3CA: eseguire IHC SMARCA4/BRG1 e NUT prima di concludere la diagnosi.');
  return warnings;
}

function recommendNextTests(g1,g2,fd){
  fd = fd || formData;
  const survivors=Object.keys(g1).filter(k=>g1[k].passed);
  const recs=[];
  if(survivors.includes('ACC') && survivors.includes('MEC'))
    recs.push('→ MAML2 (MEC+) vs MYB (ACC+) molecular testing');
  if(survivors.includes('SC') && !isSet(fd.mammaglobin))
    recs.push('→ Mammaglobin (KEY SC marker) — test immediately');
  if(survivors.includes('MSA') && !isSet(fd.mef2c))
    recs.push('→ MEF2C::SS18 fusion testing');
  if(survivors.includes('AciCC') && !isSet(fd.dog1))
    recs.push('→ DOG1 IHC (marker di riferimento AciCC)');
  // Nuovo: raccomandazioni HRAS+PIK3CA
  if(fd.hras==='pos' && fd.pik3ca==='dual'){
    recs.push('→ SMARCA4/BRG1 IHC: perdita = SMARCA4-deficient carcinoma (DD prioritaria)');
    recs.push('→ NUT IHC (clone C52B1) ± FISH NUT1: escludere NUT carcinoma (specie se CK-neg)');
    recs.push('→ Discussione MDT per terapia: binimetinib (HRAS-mut, trial) + everolimus (mTOR, trial). Nessuna approvazione specifica per salivari.');
  }
  return recs;
}

function checkOutsideModel(g1){
  return Object.values(g1).filter(v=>v.passed).length===0;
}

// index.html consuma il motore per nome. In un browser le dichiarazioni `const` di
// uno script classico vivono nell'ambiente lessicale globale e sono gia' visibili
// all'altro script, ma la cosa e' implicita e non verificabile da fuori: la si rende
// esplicita, cosi' un test puo' controllare che ogni nome usato dalla pagina esista.
if (typeof globalThis !== 'undefined') Object.assign(globalThis, {
  ARCHITECTURAL_FIELDS, LIMITED_SPECIMENS, UNSCORED_FIELDS,
  evaluateDealBreaker, getProConMissing, gateOne, gateTwo, checkDataQuality,
  recommendNextTests, checkOutsideModel });

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { isSet, is, isNot, ARCHITECTURAL_FIELDS, LIMITED_SPECIMENS, UNSCORED_FIELDS,
    evaluateDealBreaker, getProConMissing, gateOne, gateTwo, checkDataQuality,
    recommendNextTests, checkOutsideModel };
}
