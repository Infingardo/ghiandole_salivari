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
      // v5.2.0: l'alto grado nucleare ISOLATO non esclude piu' il PA. Higgins & Cipriani
      // 2026: l'atipia bizzarra senza necrosi/mitosi non basta per la malignita' sui
      // campioni limitati (PA mioepiteliali con guadagno del cromosoma 12). Esclude solo
      // se corroborato da un secondo segno di alto grado.
      if(fd.nuclear_grade==='high' && fd.mitotic_rate==='high') return {hit:true,msg:'Nuclear grade high + mitotic rate high. Reconsider.'};
      if(fd.necrosis==='yes') return {hit:true,msg:'Coagulative necrosis suggests malignancy.'};
      if(fd.neural_invasion==='extensive') return {hit:true,msg:'Extensive PNI: PA is benign. Reconsider.'};
      return {hit:false,needs:['nuclear_grade','necrosis','neural_invasion'],
              note: fd.nuclear_grade==='high' ? 'Atipia nucleare alta isolata: nel PA non basta per la malignità (atipia bizzarra, guadagno 12q); cercare necrosi, mitosi, invasione.' : null};
      
    case 'ACC':
      if(fd.cribriform==='no' && fd.duality==='absent') 
        return {hit:true,msg:'Both cribriform AND duality absent: ACC less likely.',
                needs:['cribriform','duality'],absence:true};
      if(fd.mucin_production==='abundant') 
        return {hit:true,msg:'Abundant mucin suggests MEC.'};
      return {hit:false,needs:['cribriform','duality','mucin_production']};
      
    case 'SC':
      if(fd.mammaglobin==='neg' && fd.etv6==='neg') 
        return {hit:true,msg:'No mammaglobin AND no ETV6-NTRK3: SC unlikely (altri partner ETV6 non esclusi: MUC4, pan-TRK, break-apart ETV6).'};
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

    case 'MucinousAC':
      // v5.5.0: la mucina e' il carattere definitorio: esclude solo se documentata assente.
      // NKX3.1 e AKT1 negativi non escludono (NKX3.1 "comune", AKT1 p.E17K conferma ma non in tutti).
      if(fd.mucin_production==='absent') return {hit:true,msg:'No mucin: mucinous adenocarcinoma unlikely.'};
      return {hit:false,needs:['mucin_production']};

    case 'SDC':
      // v5.4.0: carcinoma di alto grado per definizione. Esclude solo un grado nucleare
      // DOCUMENTATO basso. AR/HER2 negativi non escludono: la co-espressione e' "usuale",
      // non obbligatoria, e l'espressione isolata compare anche in altri carcinomi salivari.
      if(fd.nuclear_grade==='low') return {hit:true,msg:'Grado nucleare basso: il carcinoma duttale salivare è di alto grado per definizione.'};
      return {hit:false,needs:['nuclear_grade']};

    case 'BasalCell':
      // v5.3.0: nessun deal-breaker. La β-catenina nucleare e' presente solo in una quota
      // (CTNNB1 ~60% dei BCA) e va cercata a chiazze nelle cellule abluminali/stromali:
      // un reperto negativo non esclude. Adenoma e adenocarcinoma si distinguono solo per
      // l'invasione, non valutabile su biopsia: qui sono una sola entita'.
      return {hit:false};

    default: return {hit:false};
  }
}

// ── v5.2.0 — livello fenotipico (Higgins & Cipriani, AIMM 2026, Fig. 2) ───────────────
// Il pannello di primo livello p40 / CD117 / S100 smista in tre famiglie. E' un cancello
// MORBIDO: p40 e' a mosaico e il campionamento e' limitato, quindi il fenotipo sposta il
// punteggio (+2 se coerente, -3 se incoerente) ma non esclude nessuna entita'. Un p40 non
// eseguito non sposta nulla (tre stati).
const PHENOTYPE_OF_P40 = { abluminal:'biphasic', neg:'glandular', diffuse:'squamoid' };
const PHENOTYPE_LABEL = {
  biphasic:'bifasico (p40 abluminale)',
  glandular:'monofasico ghiandolare (p40 negativo)',
  squamoid:'monofasico squamoide (p40 diffuso)' };
// CaExPA non ha famiglia: il fenotipo dipende dalle componenti.
const ENTITY_FAMILY = { PA:'biphasic', ACC:'biphasic', EMC:'biphasic', Warthin:'biphasic', BasalCell:'biphasic', SDC:'glandular', MucinousAC:'glandular',
  SC:'glandular', MSA:'glandular', PolymorphousAC:'glandular', AciCC:'glandular',
  MEC:'squamoid', HCCC:'squamoid' };
const S100_POS_GLANDULAR = ['SC','MSA','PolymorphousAC'];

function phenotypeOf(fd){
  fd = fd || {};
  if(!isSet(fd.p40))
    return { id:'non_valutato', label:'Fenotipo non valutato (p40 non eseguito)', notes:[] };
  const id = PHENOTYPE_OF_P40[fd.p40];
  const notes = [];
  if(id === 'biphasic'){
    if(is(fd.cd117,'luminal')) notes.push('CD117 luminale conferma il fenotipo bifasico.');
    else if(isSet(fd.cd117)) notes.push('CD117 non luminale: bifasico non confermato. Cercare dotti veri (il carcinoma mioepiteliale esprime p40 senza dotti CD117+).');
  }
  if(id === 'glandular'){
    if(is(fd.s100,'pos')) notes.push('S100 diffusamente positivo: secretorio, polimorfo/cribriforme, microsecretorio (canalicolare e dotto striato non coperti).');
    else if(is(fd.s100,'neg')) notes.push('S100 negativo: acinico (DOG1+, SOX10+) o mucinoso (NKX3.1, AKT1).');
    else notes.push('S100 non valutato: serve per suddividere il monofasico ghiandolare.');
    if(is(fd.p63,'pos')) notes.push('p63+ con p40 negativo: p63 è aspecifico nei monofasici ghiandolari, non va letto come strato mioepiteliale.');
  }
  if(id === 'squamoid' && (is(fd.s100,'pos') || is(fd.sox10,'pos')))
    notes.push('S100/SOX10+ in fenotipo squamoide: orienta su carcinoma mioepiteliale (non coperto dal modello); il SCC metastatico e il MEC li negano.');
  return { id, label:'Fenotipo ' + PHENOTYPE_LABEL[id], notes };
}

function phenotypeAdjust(e, fd){
  fd = fd || {};
  const fam = ENTITY_FAMILY[e];
  if(!fam || !isSet(fd.p40)) return 0;
  const obs = PHENOTYPE_OF_P40[fd.p40];
  let d = 0;
  if(fam === obs){ d += 2; if(obs === 'biphasic' && is(fd.cd117,'luminal')) d += 1; }
  else d -= (e === 'MEC' && obs === 'glandular') ? 1 : 3;   // MEC p40-negativo: minoranza descritta
  // S100 suddivide il solo monofasico ghiandolare
  if(obs === 'glandular'){
    if(is(fd.s100,'pos')){
      if(S100_POS_GLANDULAR.includes(e)) d += 1;
      if(e === 'AciCC' || e === 'MucinousAC') d -= 2;
    }else if(is(fd.s100,'neg')){
      if(e === 'AciCC'){ d += 2; if(is(fd.sox10,'pos')) d += 1; }
      if(S100_POS_GLANDULAR.includes(e)) d -= 2;
      if(e === 'MucinousAC') d += 1;   // l'altro monofasico ghiandolare S100-negativo
    }
  }
  if(obs === 'squamoid' && (is(fd.s100,'pos') || is(fd.sox10,'pos')) && (e === 'MEC' || e === 'HCCC')) d -= 2;
  return d;
}

function phenotypeProCon(e, fd){
  fd = fd || {};
  const pro = [], con = [];
  const fam = ENTITY_FAMILY[e];
  if(!fam || !isSet(fd.p40)) return { pro, con };
  const obs = PHENOTYPE_OF_P40[fd.p40];
  if(fam === obs) pro.push('✓ Fenotipo ' + PHENOTYPE_LABEL[obs] + ' coerente');
  else con.push('✗ Fenotipo ' + PHENOTYPE_LABEL[obs] + ': ' + e + ' è ' + PHENOTYPE_LABEL[fam] +
    (e === 'MEC' && obs === 'glandular' ? ' (MEC p40-negativo descritto in una minoranza)' : ''));
  if(obs === 'glandular' && is(fd.s100,'pos') && e === 'AciCC') con.push('✗ S100+ (AciCC è S100-negativa, SOX10+)');
  if(obs === 'glandular' && is(fd.s100,'pos') && e === 'MucinousAC') con.push('✗ S100+ (l\'adenocarcinoma mucinoso è S100-negativo)');
  if(obs === 'glandular' && is(fd.s100,'neg') && e === 'MucinousAC') pro.push('✓ S100 negativo');
  if(obs === 'glandular' && is(fd.s100,'neg') && e === 'AciCC') pro.push('✓ S100 negativo' + (is(fd.sox10,'pos') ? ', SOX10+' : ''));
  if(obs === 'glandular' && is(fd.s100,'pos') && S100_POS_GLANDULAR.includes(e)) pro.push('✓ S100 diffusamente positivo');
  if(obs === 'glandular' && is(fd.s100,'neg') && S100_POS_GLANDULAR.includes(e)) con.push('✗ S100 negativo (atteso diffusamente positivo)');
  if(obs === 'squamoid' && (is(fd.s100,'pos') || is(fd.sox10,'pos')) && (e === 'MEC' || e === 'HCCC'))
    con.push('✗ S100/SOX10+ (orienta su carcinoma mioepiteliale, non coperto)');
  return { pro, con };
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
        fd.p63==='pos' && fd.p40!=='neg' ? '✓ p63/SMA+ (strato mioepiteliale conservato)' : null
      ].filter(Boolean);
      procon.con=[
        fd.mucin_production==='abundant' ? '✗ Abundant mucin' : null,
        fd.serous_acinar==='prominent' ? '✗ Prominent serous' : null,
        hrasPos ? '✗ HRAS Q61+ (non tipico di ACC)' : null,
        fd.p63==='neg' ? '✗ p63/SMA negativo: senza componente mioepiteliale l ACC è difficile da sostenere' : null,
        (fd.plag1==='pos' || fd.hmga2==='pos') ? '✗ PLAG1/HMGA2+ (orienta su PA; non sensibile né specifico al 100%)' : null,
        fd.ar==='pos' && fd.her2==='pos' ? '✗ AR + HER2 co-espressi (orienta su SDC)' : null,
        fd.bcatenin==='nuclear' ? '✗ β-catenina nucleare (orienta su basal cell)' : null,
        fd.spindle_stroma==='yes' ? '✗ Stroma fusato interposto (orienta su basal cell)' : null,
        fd.myb==='neg' ? '✗ MYB IHC negativa (non esclude: >80% degli ACC la esprime, ma una quota no; testare la fusione)' : null
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
        fd.nkx31==='pos' ? '✗ NKX3.1+ (orienta su adenocarcinoma mucinoso)' : null,
        fd.akt1==='pos' ? '✗ AKT1 p.E17K (orienta su adenocarcinoma mucinoso)' : null,
        fd.ar==='pos' && fd.her2==='pos' ? '✗ AR + HER2 co-espressi (orienta su SDC)' : null,
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
        !fd.etv6 ? '? ETV6-NTRK3 fusion' : null,
        fd.etv6==='neg' ? '? ETV6-NTRK3 negativo non esclude altri partner ETV6: break-apart ETV6, MUC4, pan-TRK' : null
      ].filter(Boolean);
      break;
      
    case 'PA':
      procon.pro=[
        fd.stromal_type==='myxoid' ? '✓ Myxoid stroma' : null,
        fd.nuclear_grade==='low' ? '✓ Low nuclear grade' : null,
        fd.necrosis==='no' ? '✓ No necrosis' : null,
        fd.p63==='pos' && fd.p40!=='neg' ? '✓ p63/SMA+ (componente mioepiteliale)' : null,
        (fd.plag1==='pos' || fd.hmga2==='pos') ? '✓ PLAG1/HMGA2+' : null
      ].filter(Boolean);
      procon.con=[
        fd.mitotic_rate==='high' ? '✗ High mitotic' : null,
        fd.nuclear_grade==='high' ? '✗ Alto grado nucleare (isolato non esclude il PA: atipia bizzarra possibile)' : null,
        fd.neural_invasion==='extensive' ? '✗ Extensive PNI' : null,
        fd.myb==='pos' ? '✗ MYB+ (orienta su ACC; non specifico)' : null,
        fd.ar==='pos' && fd.her2==='pos' ? '✗ AR + HER2 co-espressi (orienta su SDC)' : null,
        fd.bcatenin==='nuclear' ? '✗ β-catenina nucleare (orienta su basal cell)' : null,
        fd.spindle_stroma==='yes' ? '✗ Stroma fusato interposto (orienta su basal cell, specie se PA cellulare)' : null,
        hrasPos ? '✗ HRAS Q61+ (suggerisce trasformazione maligna)' : null
      ].filter(Boolean);
      // v5.2.0: LEF1 tolto (aspecifico, sconsigliato); PLAG1 e HMGA2 insieme (fusioni in ~70% dei PA).
      procon.missing=[
        !isSet(fd.plag1) && !isSet(fd.hmga2) ? '? PLAG1 / HMGA2 (IHC o fusione; supportive, non specifici al 100%)' : null
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
        fd.p63==='pos' && fd.p40!=='neg' ? '✓ p63/SMA+ (strato mioepiteliale esterno)' : null
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
        fd.mammaglobin==='pos' ? '✗ Mammaglobina+ (orienta su carcinoma secretorio)' : null,
        fd.ar==='pos' && fd.her2==='pos' ? '✗ AR + HER2 co-espressi (orienta su SDC)' : null
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
        fd.mucin_production==='abundant' ? '✗ Mucina abbondante (orienta su MEC a cellule chiare)' : null
      ].filter(Boolean);
      procon.missing=[
        !fd.clear_cell ? '? Cellule chiare' : null,
        !fd.stromal_type ? '? Tipo di stroma' : null,
        // v5.2.0: p63/p40 diffusi sono ATTESI in HCCC (fenotipo squamoide): non lo distinguono dall'EMC.
        '? SMA/calponina e S100/SOX10 (devono essere negativi) ed EWSR1::ATF1 — p63/SMA+ non esclude HCCC, la distingue dall EMC solo la negatività dei marcatori mioepiteliali veri'
      ].filter(Boolean);
      break;

    case 'MucinousAC':
      procon.pro=[
        fd.mucin_production==='abundant' ? '✓ Mucina abbondante (pozze mucinose)' : null,
        fd.papillary==='yes' ? '✓ Architettura papillare / cistica' : null,
        fd.nkx31==='pos' ? '✓ NKX3.1+' : null,
        fd.akt1==='pos' ? '✓ AKT1 p.E17K (conferma)' : null
      ].filter(Boolean);
      procon.con=[
        fd.mucin_production==='scant' ? '✗ Mucina scarsa (nel mucinoso le pozze sono il reperto principale)' : null,
        fd.maml2==='pos' ? '✗ MAML2+ (orienta su MEC)' : null,
        fd.duality==='clear' ? '✗ Dualità netta (non descritti marcatori mioepiteliali nel mucinoso, salvo coinvolgimento intraduttale)' : null,
        fd.p40==='diffuse' ? '✗ p40 diffuso (il mucinoso non esprime p63/p40)' : null,
        fd.myb==='pos' ? '✗ MYB+ (orienta su ACC; non specifico)' : null
      ].filter(Boolean);
      procon.missing=[
        !isSet(fd.nkx31) ? '? NKX3.1 IHC (comune, ma mima il carcinoma prostatico: correlare con la clinica)' : null,
        !isSet(fd.akt1) ? '? AKT1 p.E17K (conferma di origine salivare)' : null,
        !isSet(fd.s100) ? '? S100 (atteso negativo; con p63/p40/SMA/calponina negativi)' : null
      ].filter(Boolean);
      break;

    case 'SDC':
      procon.pro=[
        fd.apocrine==='yes' ? '✓ Citologia apocrina (cellule grandi, nucleoli prominenti, citoplasma eosinofilo, snouts)' : null,
        fd.ar==='pos' && fd.her2==='pos' ? '✓ AR + HER2 co-espressi (usuale nell SDC; bersagli terapeutici)' : null,
        fd.ar==='pos' && fd.her2!=='pos' ? '✓ AR+' : null,
        fd.her2==='pos' && fd.ar!=='pos' ? '✓ HER2+' : null,
        fd.nuclear_grade==='high' ? '✓ Alto grado nucleare' : null,
        fd.necrosis==='yes' ? '✓ Necrosi (centrale nei nidi cribriformi)' : null,
        fd.cribriform==='yes' ? '✓ Crescita cribriforme' : null
      ].filter(Boolean);
      procon.con=[
        fd.ar==='neg' && fd.her2==='neg' ? '✗ AR e HER2 negativi (co-espressione attesa; non esclude)' : null,
        (fd.ar==='pos') !== (fd.her2==='pos') && (fd.ar==='pos' || fd.her2==='pos') && (fd.ar==='neg' || fd.her2==='neg')
          ? '✗ Espressione isolata di AR o HER2: compare anche in altri carcinomi salivari, non basta per SDC' : null,
        fd.apocrine==='no' ? '✗ Citologia non apocrina (la distinzione apocrino/oncocitario è soggettiva: non esclude)' : null,
        fd.mucin_production==='abundant' ? '✗ Mucina abbondante (orienta su MEC)' : null
      ].filter(Boolean);
      procon.missing=[
        !isSet(fd.ar) ? '? AR IHC (marker terapeutico: antiandrogeni)' : null,
        !isSet(fd.her2) ? '? HER2 IHC (± ISH se 2+): bersaglio terapeutico' : null,
        !isSet(fd.apocrine) ? '? Citologia apocrina' : null
      ].filter(Boolean);
      break;

    case 'BasalCell':
      procon.pro=[
        fd.spindle_stroma==='yes' ? '✓ Stroma fusato tra le isole (quasi patognomonico)' : null,
        fd.bcatenin==='nuclear' ? '✓ β-catenina nucleare (cellule abluminali / stroma fusato)' : null,
        fd.basal_driver==='pos' ? '✓ CTNNB1 / CYLD mutato' : null,
        fd.duality==='clear' ? '✓ Dualità' : null
      ].filter(Boolean);
      procon.con=[
        fd.necrosis==='yes' ? '✗ Necrosi (inusuale: considerare BCAC ad alto grado o altra neoplasia)' : null,
        fd.nuclear_grade==='high' ? '✗ Alto grado nucleare (inusuale nei basal cell)' : null,
        fd.mucin_production==='abundant' ? '✗ Mucina abbondante (orienta su MEC)' : null
      ].filter(Boolean);
      procon.missing=[
        !isSet(fd.bcatenin) ? '? β-catenina IHC (nucleare, anche a chiazze, nelle cellule abluminali/stromali; negativa non esclude)' : null,
        !isSet(fd.spindle_stroma) ? '? Stroma fusato interposto tra le isole' : null,
        !isSet(fd.basal_driver) ? '? CTNNB1 (~60% dei BCA) / CYLD (fino al 30% dei BCAC)' : null,
        '? Invasione: è l\'unico criterio tra adenoma e adenocarcinoma, non valutabile su biopsia (descrivere, non forzare)'
      ].filter(Boolean);
      break;

    default:
      procon.pro=['(entity not detailed yet)'];
      procon.con=[];
      procon.missing=[];
  }
  const fen = phenotypeProCon(entity, fd);
  procon.pro.push(...fen.pro);
  procon.con.push(...fen.con);
  return procon;
}

function gateOne(fd){
  fd = fd || formData;
  const entities=['PA','ACC','MEC','AciCC','SC','MSA','CaExPA','Warthin','EMC','PolymorphousAC','HCCC','BasalCell','SDC','MucinousAC'];
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
            : mancanti.length>0 ? `Non verificato: manca ${mancanti.join(', ')}.` + (db.note ? ' ' + db.note : '')
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
      // v5.2.0: PLAG1 era raccolto e non dava punti. ~70% dei PA ha fusione PLAG1 o HMGA2.
      if(is(formData.plag1,'pos') || is(formData.hmga2,'pos')) score+=2;
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
    }else if(e==='MucinousAC'){
      if(formData.mucin_production==='abundant') score+=3;
      else if(formData.mucin_production==='moderate') score+=1;
      if(formData.nkx31==='pos') score+=3;
      if(formData.akt1==='pos') score+=3;               // p.E17K: conferma
      if(formData.papillary==='yes') score+=1;
    }else if(e==='SDC'){
      if(formData.apocrine==='yes') score+=3;          // il carattere eponimo
      if(formData.ar==='pos') score+=2;
      if(formData.her2==='pos') score+=2;
      if(formData.ar==='pos' && formData.her2==='pos') score+=2;   // co-espressione
      if(formData.nuclear_grade==='high') score+=2;
      if(formData.necrosis==='yes') score+=1;
      if(formData.cribriform==='yes') score+=1;
    }else if(e==='BasalCell'){
      if(formData.spindle_stroma==='yes') score+=3;   // stroma fusato tra le isole: quasi patognomonico
      if(formData.bcatenin==='nuclear') score+=3;     // anche a chiazze
      if(formData.basal_driver==='pos') score+=3;     // CTNNB1 / CYLD
      if(formData.duality==='clear') score+=1;
    }else if(e==='HCCC'){
      if(formData.clear_cell==='yes') score+=3;
      if(formData.stromal_type==='hyaline') score+=2;  // stroma ialino: il carattere eponimo
    }else{
      score=1;
    }
    score += phenotypeAdjust(e, formData);
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
  if(fd.p40==='abluminal' && fd.duality==='absent')
    warnings.push('🔴 CONTRADDIZIONE: p40 abluminale (strato mioepiteliale presente) ma dualità assente. Ricontrollare.');
  if(fd.p40==='neg' && fd.duality==='clear')
    warnings.push('⚠️ p40 negativo con dualità netta: p40 può essere a mosaico o il campione non rappresentativo. Verificare.');
  if(fd.p40==='neg' && fd.p63==='pos')
    warnings.push('⚠️ p63+ con p40 negativo: p63 è aspecifico nei monofasici ghiandolari (polimorfo/cribriforme, MSA); non leggerlo come mioepitelio.');
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
  // v5.5.0: adenocarcinoma mucinoso — NKX3.1 (con la cautela prostatica) e AKT1 p.E17K
  if(survivors.includes('MucinousAC') && !isSet(fd.nkx31) &&
     (fd.mucin_production==='abundant' || (is(fd.p40,'neg') && is(fd.s100,'neg'))))
    recs.push('→ NKX3.1 IHC (nel mucinoso è comune ma mima il carcinoma prostatico: correlare con la clinica); AKT1 p.E17K per conferma');
  // v5.4.0: SDC — AR e HER2 sono diagnostici e terapeutici insieme
  if(survivors.includes('SDC') && (!isSet(fd.ar) || !isSet(fd.her2)) &&
     (fd.apocrine==='yes' || fd.nuclear_grade==='high' || fd.necrosis==='yes'))
    recs.push('→ AR + HER2 (IHC; ISH se HER2 2+): la co-espressione sostiene SDC e apre a terapie mirate (antiandrogeni, anti-HER2) da discutere con l\'oncologo');
  // v5.3.0: basal cell vs ACC / PA cellulare nel basaloide bifasico
  if(survivors.includes('BasalCell') && !isSet(fd.bcatenin) &&
     (is(fd.p40,'abluminal') || is(fd.duality,'clear','borderline') || is(fd.cribriform,'yes','partial')))
    recs.push('→ β-catenina IHC (nucleare, anche a chiazze, in cellule abluminali/stroma fusato): sostiene basal cell contro ACC e PA cellulare; LEF1 non raccomandato');
  // v5.2.0: pannello di primo livello dell'articolo (p40, CD117, S100)
  if(!isSet(fd.p40))
    recs.push('→ Pannello di primo livello: p40 + CD117 + S100 (smista in bifasico / monofasico ghiandolare / squamoide)');
  else{
    const ph = PHENOTYPE_OF_P40[fd.p40];
    if(ph==='glandular' && !isSet(fd.s100))
      recs.push('→ S100: nel monofasico ghiandolare separa secretorio/polimorfo/microsecretorio (S100+) da acinico/mucinoso (S100−)');
    if(ph==='glandular' && is(fd.s100,'neg') && survivors.includes('AciCC') && !isSet(fd.sox10))
      recs.push('→ SOX10 (positivo in AciCC anche con S100 negativo) + DOG1');
    if(ph==='squamoid' && survivors.includes('MEC') && !isSet(fd.maml2))
      recs.push('→ MAML2 (MEC) · EWSR1::ATF1 (HCCC); mucicarminio/PAS-D per la mucina');
    if(ph==='squamoid' && (is(fd.s100,'pos') || is(fd.sox10,'pos')))
      recs.push('→ S100/SOX10+ in fenotipo squamoide: considerare carcinoma mioepiteliale (SMA, calponina, EWSR1) — non coperto dal modello');
    if(ph==='biphasic' && !isSet(fd.cd117))
      recs.push('→ CD117: conferma la componente luminale del bifasico');
  }
  // Nuovo: raccomandazioni HRAS+PIK3CA
  if(fd.hras==='pos' && fd.pik3ca==='dual'){
    recs.push('→ SMARCA4/BRG1 IHC: perdita = SMARCA4-deficient carcinoma (DD prioritaria)');
    recs.push('→ NUT IHC (clone C52B1) ± FISH NUT1: escludere NUT carcinoma (specie se CK-neg)');
    recs.push('→ Discussione MDT per terapia: binimetinib (HRAS-mut, trial) + everolimus (mTOR, trial). Nessuna approvazione specifica per salivari.');
  }
  return recs;
}

// v5.2.0 — Orientamento gestionale (Higgins & Cipriani, AIMM 2026, Fig. 1). Non e' una
// diagnosi: dice quale delle tre domande che contano per il chirurgo ha risposta —
// benigno/basso grado, alto grado, basaloide con ACC da escludere. Anche qui tre stati:
// un grado non valutato non e' un grado basso, e un solo segno di alto grado non basta.
function managementBucket(g1, g2, fd){
  fd = fd || {};
  const limited = LIMITED_SPECIMENS.includes(fd.specimen_type);
  const sopravvissute = Object.keys(g1 || {}).filter(k => g1[k].passed);
  const out = (id, label, rationale, implicazione, tests) =>
    ({ id, label, rationale, implicazione, tests: tests || [], limited });

  if(sopravvissute.length === 0)
    return out('indeterminato', 'Non determinabile (fuori modello)',
      ['Nessuna entità sopravvissuta a Gate 1.'],
      'Nessun orientamento gestionale dal modello.');

  const segni = [];
  if(is(fd.necrosis,'yes','focal')) segni.push('necrosi');
  if(is(fd.nuclear_grade,'high')) segni.push('grado nucleare alto');
  if(is(fd.mitotic_rate,'high')) segni.push('indice mitotico alto');
  const hrasDual = fd.hras==='pos' && fd.pik3ca==='dual';

  // ACC da escludere: basta un indizio di basaloide/ACC e che Gate 1 non l'abbia esclusa
  const punteggi = Object.values(g2 || {}).map(x => x.score);
  const maxScore = Math.max(0, ...punteggi);
  const accTop = !!(g2 && g2.ACC && g2.ACC.score > 0 && g2.ACC.score === maxScore);
  const indiziACC = [];
  if(is(fd.cribriform,'yes','partial')) indiziACC.push('pattern cribriforme');
  if(is(fd.duality,'clear')) indiziACC.push('dualità netta');
  if(is(fd.myb,'pos')) indiziACC.push('MYB+');
  if(is(fd.p40,'abluminal')) indiziACC.push('p40 abluminale');
  if(accTop) indiziACC.push('ACC in testa al ranking');
  // p40 negativo allontana l'ACC (polimorfo/cribriforme): resta in gioco solo con MYB+
  const accInGioco = g1.ACC && g1.ACC.passed && (!is(fd.p40,'neg') || is(fd.myb,'pos'));

  const sdcTop = !!(g2 && g2.SDC && g2.SDC.score > 0 && g2.SDC.score === maxScore);
  // un solo segno di grado non basta a far "vincere" l'SDC: serve evidenza propria (MODERATE o più)
  const sdcAlto = sdcTop && g2.SDC.conf !== 'LOW';
  if(segni.length >= 2 || (segni.length >= 1 && hrasDual) || sdcAlto)
    return out('alto_grado', 'ALTO GRADO',
      [(segni.length ? 'Segni di alto grado: ' + segni.join(', ') + (hrasDual ? ' + HRAS Q61 / dual PIK3CA' : '') + '.' : '') +
       (sdcAlto && !(segni.length >= 2 || (segni.length >= 1 && hrasDual)) ? ' Carcinoma duttale salivare in testa al ranking: alto grado per definizione.' : '')].map(x => x.trim()),
      'Orientamento (Fig. 1): resezione con margini ampi e dissezione laterocervicale; sacrificio di strutture adiacenti se necessario. Discutere con il clinico eventuali bersagli terapeutici (es. NTRK, AR/HER2).');

  if(accInGioco && indiziACC.length > 0){
    const rat = ['Morfologia basaloide non apertamente di alto grado: ACC non esclusa (' + indiziACC.join(', ') + ').'];
    if(segni.length === 1) rat.push('Segno isolato di alto grado: ' + segni[0] + '.');
    const basalTop = !!(g2 && g2.BasalCell && g2.BasalCell.score > 0 && g2.BasalCell.score === maxScore);
    if(basalTop) rat.push('Neoplasia basocellulare in testa al ranking (stroma fusato / β-catenina / CTNNB1-CYLD): ACC meno probabile, ma non esclusa senza MYB/MYBL1::NFIB.');
    const tests = [];
    if(is(fd.myb,'neg')) tests.push('MYB IHC negativa non esclude ACC (>80% positivi): testare la fusione MYB/MYBL1::NFIB (FISH/NGS)');
    else if(is(fd.myb,'pos')) tests.push('MYB IHC non è specifica (~15% dei non-ACC è positivo): confermare la fusione MYB/MYBL1::NFIB se la morfologia non è tipica');
    else tests.push('MYB IHC e fusione MYB/MYBL1::NFIB (FISH/NGS)');
    if(limited) tests.push('Campione limitato: diagnosi descrittiva ("neoplasia basaloide, ACC da escludere") e conferma sul pezzo operatorio');
    return out('basaloide_acc', 'BASALOIDE — ACC DA ESCLUDERE', rat,
      'Orientamento (Fig. 1): se ACC, resezione con margini ampi ± dissezione laterocervicale; se PA cellulare o neoplasia basocellulare, margini negativi. Il trattamento dipende da questa distinzione.',
      tests);
  }

  if(segni.length === 1)
    return out('indeterminato', 'Segno isolato di alto grado',
      ['Un solo segno: ' + segni[0] + '. Non basta per assegnare alto grado.'],
      'Grado non assegnabile: rivalutare sul pezzo operatorio o ricampionare; riportare in forma descrittiva.');

  if(is(fd.nuclear_grade,'low') && is(fd.necrosis,'no'))
    return out('basso_grado', 'BENIGNO / BASSO GRADO',
      ['Grado nucleare basso, necrosi assente' + (is(fd.mitotic_rate,'low','moderate') ? ', mitosi non elevate' : '') + '.'],
      'Orientamento (Fig. 1): resezione con margini negativi, senza dissezione laterocervicale.' +
      (limited ? ' Su campione limitato il grado non è definitivo: riportare il grado in forma descrittiva.' : ''));

  const mancano = ['nuclear_grade','necrosis'].filter(f => !isSet(fd[f]));
  return out('indeterminato', 'Non determinabile',
    [mancano.length ? 'Grado non valutabile: manca ' + mancano.join(', ') + '.' : 'Grado nucleare intermedio: né basso né alto grado.'],
    'Nessun orientamento gestionale con i dati compilati.');
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
  recommendNextTests, checkOutsideModel, managementBucket,
  phenotypeOf, phenotypeAdjust, phenotypeProCon, PHENOTYPE_OF_P40, ENTITY_FAMILY });

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { isSet, is, isNot, ARCHITECTURAL_FIELDS, LIMITED_SPECIMENS, UNSCORED_FIELDS,
    evaluateDealBreaker, getProConMissing, gateOne, gateTwo, checkDataQuality,
    recommendNextTests, checkOutsideModel, managementBucket,
    phenotypeOf, phenotypeAdjust, phenotypeProCon, PHENOTYPE_OF_P40, ENTITY_FAMILY };
}
