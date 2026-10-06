// Runner dei test del motore — nessun framework.
// Esecuzione:  node tests/run.mjs   (oppure: npm test)   Exit code 0 = tutto verde.
//
// Perche' esiste: fino alla v5.0.3 i due cancelli conoscevano due stati (presente /
// assente) per un dato che ne ha tre. Su un form completamente vuoto uscivano gia'
// escluse MSA ("No microcystic AND no duality") e Warthin ("requires BOTH..."), e il
// MEC guidava la classifica con tre punti per una mucina che nessuno aveva guardato.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const E = require('../engine.js');
const { isSet, is, isNot, ARCHITECTURAL_FIELDS, LIMITED_SPECIMENS, UNSCORED_FIELDS,
        evaluateDealBreaker, getProConMissing, gateOne, gateTwo, checkDataQuality,
        recommendNextTests, checkOutsideModel, managementBucket,
        phenotypeOf, phenotypeAdjust, phenotypeProCon, PHENOTYPE_OF_P40, ENTITY_FAMILY } = E;

let pass = 0, fail = 0; const failures = [];
const check = (n, c, d = '') => c ? pass++ : (fail++, failures.push(n + (d ? ` — ${d}` : '')));
const eq = (n, a, b) => check(n, a === b, `atteso ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`);
const section = t => console.log(`\n• ${t}`);

const ENTITIES = ['PA','ACC','MEC','AciCC','SC','MSA','CaExPA','Warthin','EMC','PolymorphousAC','HCCC','BasalCell'];
const run = fd => { const g1 = gateOne(fd); return { g1, g2: gateTwo(g1, fd) }; };
const escluse = g1 => Object.keys(g1).filter(k => !g1[k].passed);
const classifica = g2 => Object.entries(g2).sort((a,b) => b[1].score - a[1].score);
const score = (fd, e) => run(fd).g2[e]?.score;

// ══════════════════════════════════════════════════════════════════════════
section('tre stati: presente, assente, non valutato');
{
  eq('stringa vuota non e un dato', isSet(''), false);
  eq('undefined non e un dato', isSet(undefined), false);
  eq('null non e un dato', isSet(null), false);
  eq('"not_done" non e un dato', isSet('not_done'), false);
  eq('"no" e un dato (assenza documentata)', isSet('no'), true);
  eq('0 e un dato', isSet(0), true);

  eq('is() richiede il dato', is(undefined, 'yes'), false);
  eq('is() confronta il valore', is('yes', 'yes', 'no'), true);
  // il punto della v5.1.0: un campo mai compilato non contraddice nulla
  eq('isNot() su campo vuoto e falso', isNot(undefined, 'yes'), false);
  eq('isNot() su campo compilato che contraddice', isNot('no', 'yes'), true);
  eq('isNot() su campo compilato che concorda', isNot('yes', 'yes'), false);
}

section('form vuoto: nessuna esclusione, nessun punteggio');
{
  const { g1, g2 } = run({});
  eq('nessuna entita esclusa', escluse(g1).length, 0);
  ENTITIES.forEach(e => eq(`${e} a zero punti`, g2[e].score, 0));
  // regressione diretta sulla 5.0.3
  check('MSA non e piu esclusa a form vuoto', g1.MSA.passed);
  check('Warthin non e piu esclusa a form vuoto', g1.Warthin.passed);
  check('il MEC non guida piu la classifica di un caso non guardato',
    classifica(g2)[0][1].score === 0, JSON.stringify(classifica(g2)[0]));
  // e cio che passa senza dati e dichiarato indeterminato, non "superato"
  ['PA','ACC','MEC','AciCC','SC','MSA','CaExPA','Warthin'].forEach(e =>
    check(`${e} marcata come non verificata`, g1[e].undetermined === true));
  check('la ragione dice cosa manca', /manca/.test(g1.MEC.reason), g1.MEC.reason);
}

section('i deal-breaker esigono il dato');
{
  eq('Warthin: oncociti assenti → esclusa',
    evaluateDealBreaker('Warthin', { oncocytic:'absent', lymphoid_stroma:'abundant' }).hit, true);
  eq('Warthin: stroma scarso → esclusa',
    evaluateDealBreaker('Warthin', { oncocytic:'prominent', lymphoid_stroma:'none' }).hit, true);
  eq('Warthin: entrambi mancanti → non esclusa',
    evaluateDealBreaker('Warthin', {}).hit, false);
  eq('Warthin: solo uno compilato e concorde → non esclusa',
    evaluateDealBreaker('Warthin', { oncocytic:'prominent' }).hit, false);
  eq('Warthin: entrambi presenti → non esclusa',
    evaluateDealBreaker('Warthin', { oncocytic:'prominent', lymphoid_stroma:'abundant' }).hit, false);

  eq('MSA: microcistico e dualita documentati assenti → esclusa',
    evaluateDealBreaker('MSA', { microcystic:'no', duality:'absent' }).hit, true);
  eq('MSA: campi vuoti → non esclusa', evaluateDealBreaker('MSA', {}).hit, false);
  eq('MSA: uno solo assente → non esclusa',
    evaluateDealBreaker('MSA', { microcystic:'no' }).hit, false);

  // CaExPA: nella 5.0.3 usciva "PASSATA" con la motivazione di un'esclusione
  const cax = evaluateDealBreaker('CaExPA', { residualPA:'no' });
  eq('CaExPA non e mai esclusa da Gate 1', cax.hit, false);
  check('assenza di PA residuo resta una nota, non una ragione di esclusione', !!cax.note);
  check('senza dati non c e nemmeno la nota', !evaluateDealBreaker('CaExPA', {}).note);
}

section('campioni limitati: architettura non valutabile');
{
  // il caso che nella 5.0.3 escludeva l ACC su una core biopsy dove nessuno
  // puo' affermare che il pattern cribriforme non ci sia
  const fd = { specimen_type:'trucut', cribriform:'no', duality:'absent' };
  const { g1 } = run(fd);
  check('ACC non esclusa su core biopsy', g1.ACC.passed);
  check('ACC dichiarata non determinabile', g1.ACC.undetermined === true);
  check('la ragione nomina il tipo di campione', /core biopsy/.test(g1.ACC.reason), g1.ACC.reason);
  eq('su agoaspirato vale lo stesso',
    run({ ...fd, specimen_type:'fnab' }).g1.ACC.passed, true);
  check('su agoaspirato la ragione lo dice',
    /agoaspirato/.test(run({ ...fd, specimen_type:'fnab' }).g1.ACC.reason));
  eq('su pezzo operatorio l esclusione resta',
    run({ ...fd, specimen_type:'resection' }).g1.ACC.passed, false);

  // la sospensione e' mirata: i criteri NON architetturali continuano a valere
  const nonArch = { specimen_type:'trucut', mucin_production:'absent' };
  eq('MEC resta escluso su core biopsy (la mucina si vede)', run(nonArch).g1.MEC.passed, false);
  eq('SC resta escluso su core biopsy (i marcatori si fanno)',
    run({ specimen_type:'fnab', mammaglobin:'neg', etv6:'neg' }).g1.SC.passed, false);
  // v5.2.0: l'alto grado nucleare isolato non esclude piu' il PA; serve un secondo segno
  eq('PA resta esclusa su core biopsy per alto grado nucleare + mitosi alte',
    run({ specimen_type:'trucut', nuclear_grade:'high', mitotic_rate:'high' }).g1.PA.passed, false);

  // la sospensione e' mirata anche nell'altro verso: un reperto architetturale
  // VISTO su core biopsy resta un dato, e l'esclusione che ne nasce vale
  eq('AciCC resta esclusa su core biopsy se cribriforme+dualita sono presenti',
    run({ specimen_type:'trucut', cribriform:'yes', duality:'clear' }).g1.AciCC.passed, false);
  eq('PA resta esclusa su core biopsy per PNI estesa vista',
    run({ specimen_type:'trucut', neural_invasion:'extensive' }).g1.PA.passed, false);

  check('la lista dei campi architetturali contiene i pattern, non i marcatori',
    ARCHITECTURAL_FIELDS.every(f => !['myb','maml2','etv6','mammaglobin','dog1','hras'].includes(f)));
  eq('i campioni limitati sono core biopsy e agoaspirato',
    LIMITED_SPECIMENS.join(','), 'trucut,fnab');
  eq('su pezzo operatorio nessuna sospensione',
    run({ specimen_type:'resection', cribriform:'no', duality:'absent' }).g1.ACC.passed, false);
}

section('Gate 2: ogni entita ha criteri propri');
{
  // nessuna deve cadere nel ramo generico score=1
  ENTITIES.forEach(e => {
    const fd = {};
    eq(`${e} parte da zero, non da 1`, score(fd, e), 0);
  });

  eq('MEC: mucina scarsa conta', score({ mucin_production:'scant' }, 'MEC'), 3);
  eq('MEC: mucina abbondante conta', score({ mucin_production:'moderate' }, 'MEC'), 3);
  eq('MEC: mucina non guardata non conta', score({}, 'MEC'), 0);
  eq('MEC: MAML2+ somma', score({ mucin_production:'scant', maml2:'pos' }, 'MEC'), 6);

  eq('ACC: MYB::NFIB da punti', score({ myb:'pos' }, 'ACC'), 2);
  eq('AciCC: DOG1 da punti', score({ dog1:'pos' }, 'AciCC'), 3);
  // MSA aveva un deal-breaker e un test raccomandato ma nessun criterio di punteggio
  eq('MSA: MEF2C::SS18 da punti', score({ mef2c:'pos' }, 'MSA'), 4);
  eq('MSA: pattern microcistico da punti', score({ microcystic:'yes' }, 'MSA'), 2);
  eq('MSA con fusione e pattern arriva a MODERATE',
    run({ mef2c:'pos', microcystic:'yes' }).g2.MSA.conf, 'MODERATE');
  eq('carcinoma polimorfo: pattern multipli danno punti',
    score({ varied_patterns:'yes' }, 'PolymorphousAC'), 3);
  eq('HCCC: cellule chiare + stroma ialino', score({ clear_cell:'yes', stromal_type:'hyaline' }, 'HCCC'), 5);

  eq('soglia MODERATE a 5', run({ oncocytic:'prominent', lymphoid_stroma:'abundant' }).g2.Warthin.conf, 'MODERATE');
  eq('soglia HIGH a 8',
    run({ cribriform:'yes', duality:'clear', neural_invasion:'extensive', myb:'pos' }).g2.ACC.conf, 'HIGH');
}

section('casi interi');
{
  const acc = { specimen_type:'resection', cribriform:'yes', duality:'clear',
                neural_invasion:'extensive', myb:'pos' };
  const r = run(acc);
  eq('ACC classico in testa', classifica(r.g2)[0][0], 'ACC');
  check('PA esclusa per PNI estesa', !r.g1.PA.passed);
  check('AciCC esclusa dal pattern cribriforme+dualita', !r.g1.AciCC.passed);

  const mec = { specimen_type:'resection', mucin_production:'abundant', maml2:'pos' };
  eq('MEC classico in testa', classifica(run(mec).g2)[0][0], 'MEC');
  check('ACC esclusa dalla mucina abbondante', !run(mec).g1.ACC.passed);

  const caxpa = { specimen_type:'resection', priorPA:'yes', residualPA:'yes',
                  nuclear_grade:'high', hras:'pos', pik3ca:'dual', ck:'neg' };
  const rc = run(caxpa);
  eq('CaExPA con HRAS+dual PIK3CA in testa', classifica(rc.g2)[0][0], 'CaExPA');
  eq('e in classe HIGH', rc.g2.CaExPA.conf, 'HIGH');
  check('l alert NUT/SMARCA4 arriva al pro-con', !!getProConMissing('CaExPA', caxpa).hrasAlert);
}

section('pro/con: nessuna entita rimane un segnaposto');
{
  const ricco = { cribriform:'yes', duality:'clear', mucin_production:'scant',
    serous_acinar:'prominent', nuclear_grade:'low', necrosis:'no', neural_invasion:'focal',
    stromal_type:'hyaline', oncocytic:'prominent', lymphoid_stroma:'abundant',
    clear_cell:'yes', varied_patterns:'yes', microcystic:'yes', papillary:'yes',
    dog1:'pos', maml2:'pos', myb:'pos', etv6:'pos', mammaglobin:'pos', mef2c:'pos', spindle_stroma:'yes', bcatenin:'nuclear', basal_driver:'pos',
    priorPA:'yes', residualPA:'yes', hras:'pos', pik3ca:'dual' };
  ENTITIES.forEach(e => {
    const pc = getProConMissing(e, ricco);
    check(`${e} non mostra "(entity not detailed yet)"`,
      !pc.pro.includes('(entity not detailed yet)'));
    check(`${e} produce almeno un elemento su un caso completo`,
      pc.pro.length + pc.con.length > 0);
  });
  const vuoto = getProConMissing('AciCC', {});
  check('a form vuoto AciCC chiede DOG1 invece di affermare', vuoto.missing.some(m => /DOG1/.test(m)));
  eq('a form vuoto AciCC non ha punti a favore', vuoto.pro.length, 0);
}

section('qualita del dato');
{
  const w = fd => checkDataQuality(fd).join(' | ');
  check('tipo di campione mancante viene segnalato', /Tipo di campione non indicato/.test(w({})));
  check('core biopsy: la sospensione dei criteri e dichiarata',
    /sospesi/.test(w({ specimen_type:'trucut' })));
  check('agoaspirato: idem', /sospesi/.test(w({ specimen_type:'fnab' })));
  check('pezzo operatorio: nessun avviso sul campione',
    !/campione|sospesi/.test(w({ specimen_type:'resection' })));
  check('piu di tre campi vuoti', /DATI MANCANTI/.test(w({ specimen_type:'resection' })));
  check('contraddizione cribriforme/dualita',
    /CONTRADDIZIONE/.test(w({ cribriform:'yes', duality:'absent' })));
  check('HRAS+dual PIK3CA senza IHC supplementare',
    /SMARCA4/.test(w({ hras:'pos', pik3ca:'dual' })));
  check('con SMARCA4 gia fatto l avviso sparisce',
    !/eseguire IHC/.test(w({ hras:'pos', pik3ca:'dual', smarca4:'retained' })));
}

section('esami successivi e fuori modello');
{
  const rec = fd => { const { g1, g2 } = run(fd); return recommendNextTests(g1, g2, fd).join(' | '); };
  check('MSA sopravvissuta senza MEF2C → test raccomandato', /MEF2C/.test(rec({})));
  check('MEF2C gia fatto → non piu raccomandato', !/MEF2C/.test(rec({ mef2c:'neg' })));
  check('AciCC senza DOG1 → test raccomandato', /DOG1/.test(rec({})));
  check('ACC+MEC entrambe in piedi → MAML2 vs MYB', /MAML2/.test(rec({})));
  check('HRAS+dual PIK3CA porta le tre raccomandazioni molecolari',
    rec({ hras:'pos', pik3ca:'dual' }).split('|').length >= 5);
  check('"not_done" vale come non fatto', /MEF2C/.test(rec({ mef2c:'not_done' })));

  eq('con sopravvissute non e fuori modello', checkOutsideModel(run({}).g1), false);
  eq('senza sopravvissute e fuori modello', checkOutsideModel({ A:{passed:false} }), true);
}

// ══════════════════════════════════════════════════════════════════════════
section('v5.2.0 — correzioni da Higgins & Cipriani 2026');
{
  // PA: atipia isolata non basta
  const iso = { specimen_type:'resection', nuclear_grade:'high', necrosis:'no', mitotic_rate:'low', neural_invasion:'none' };
  const g = run(iso).g1.PA;
  check('PA con alto grado nucleare isolato non e esclusa', g.passed, g.reason);
  check('la ragione spiega che l atipia isolata non basta', /isolata/.test(g.reason), g.reason);
  check('anche con dati mancanti la nota non si perde',
    /isolata/.test(run({ nuclear_grade:'high' }).g1.PA.reason));
  check('il pro/con lo segnala come contro', getProConMissing('PA', iso).con.some(c => /isolato/.test(c)));
  eq('PA esclusa se alto grado + mitosi alte', run({ nuclear_grade:'high', mitotic_rate:'high' }).g1.PA.passed, false);
  eq('PA esclusa per necrosi', run({ necrosis:'yes' }).g1.PA.passed, false);

  // PLAG1 / HMGA2
  eq('PA: PLAG1+ da punti', score({ plag1:'pos' }, 'PA'), 2);
  eq('PA: HMGA2+ da punti', score({ hmga2:'pos' }, 'PA'), 2);
  eq('PA: PLAG1 e HMGA2 insieme non si sommano', score({ plag1:'pos', hmga2:'pos' }, 'PA'), 2);
  eq('PA: PLAG1 negativo non toglie punti', score({ plag1:'neg' }, 'PA'), 0);
  eq('PLAG1+ non cambia il punteggio dell ACC', score({ plag1:'pos' }, 'ACC'), 0);
  check('ACC: PLAG1+ compare tra i contro', getProConMissing('ACC', { plag1:'pos' }).con.some(c => /PLAG1/.test(c)));
  check('ACC: MYB IHC neg non la esclude ma lo dice',
    run({ myb:'neg' }).g1.ACC.passed && getProConMissing('ACC', { myb:'neg' }).con.some(c => /testare la fusione/.test(c)));
  check('PA: MYB+ compare tra i contro', getProConMissing('PA', { myb:'pos' }).con.some(c => /MYB/.test(c)));
  check('PA chiede PLAG1/HMGA2 se nessuno dei due e fatto',
    getProConMissing('PA', {}).missing.some(m => /PLAG1 \/ HMGA2/.test(m)));
  check('PA non chiede piu nulla se HMGA2 e fatto',
    !getProConMissing('PA', { hmga2:'neg' }).missing.some(m => /PLAG1/.test(m)));
  check('LEF1 non e piu chiesto', !JSON.stringify(getProConMissing('PA', {})).includes('LEF1'));

  // HCCC: p63 diffuso e atteso, non un contro
  const h = getProConMissing('HCCC', { p63:'pos', clear_cell:'yes' });
  check('HCCC: p63/SMA+ non e piu un contro', !h.con.some(c => /p63/.test(c)), JSON.stringify(h.con));
  check('HCCC: la distinzione da EMC passa per i marcatori mioepiteliali veri',
    h.missing.some(m => /SMA\/calponina/.test(m) && /EWSR1::ATF1/.test(m)));
  eq('p63+ non cambia il punteggio dell HCCC', score({ p63:'pos' }, 'HCCC'), 0);

  // SC: ETV6-NTRK3 negativo non copre gli altri partner
  check('SC: ETV6-NTRK3 neg ricorda altri partner, MUC4 e pan-TRK',
    getProConMissing('SC', { etv6:'neg' }).missing.some(m => /MUC4/.test(m) && /pan-TRK/.test(m)));
  check('SC: con ETV6 non testato non compare quel promemoria',
    !getProConMissing('SC', {}).missing.some(m => /non esclude altri partner/.test(m)));
  eq('SC resta esclusa se mammaglobina e ETV6-NTRK3 sono entrambe negative',
    run({ mammaglobin:'neg', etv6:'neg' }).g1.SC.passed, false);
  check('e il messaggio dice cosa non e stato escluso', /altri partner ETV6/.test(run({ mammaglobin:'neg', etv6:'neg' }).g1.SC.reason));
}

section('v5.2.0 — orientamento gestionale (Fig. 1)');
{
  const bucket = fd => { const { g1, g2 } = run(fd); return managementBucket(g1, g2, fd); };

  eq('form vuoto: non determinabile', bucket({}).id, 'indeterminato');
  check('form vuoto: dice che manca il grado', /manca/.test(bucket({}).rationale.join(' ')), bucket({}).rationale.join(' '));
  eq('form vuoto: nessun test inventato', bucket({}).tests.length, 0);
  eq('"not_done" vale come non valutato',
    bucket({ nuclear_grade:'not_done', necrosis:'not_done' }).id, 'indeterminato');

  eq('necrosi + grado nucleare alto → alto grado',
    bucket({ necrosis:'yes', nuclear_grade:'high' }).id, 'alto_grado');
  eq('grado nucleare alto + mitosi alte → alto grado',
    bucket({ nuclear_grade:'high', mitotic_rate:'high', necrosis:'no' }).id, 'alto_grado');
  check('alto grado: margini ampi e dissezione', /dissezione laterocervicale/.test(bucket({ necrosis:'yes', nuclear_grade:'high' }).implicazione));
  eq('un solo segno + HRAS/dual PIK3CA → alto grado',
    bucket({ nuclear_grade:'high', hras:'pos', pik3ca:'dual' }).id, 'alto_grado');
  eq('HRAS/dual PIK3CA senza segni di grado non basta', bucket({ hras:'pos', pik3ca:'dual' }).id, 'indeterminato');

  const uno = bucket({ nuclear_grade:'high', necrosis:'no', mitotic_rate:'low' });
  eq('un solo segno → indeterminato', uno.id, 'indeterminato');
  check('lo dice', /Non basta/.test(uno.rationale.join(' ')), uno.rationale.join(' '));

  eq('grado basso e necrosi assente → benigno/basso grado',
    bucket({ nuclear_grade:'low', necrosis:'no' }).id, 'basso_grado');
  check('basso grado: niente dissezione', /senza dissezione/.test(bucket({ nuclear_grade:'low', necrosis:'no' }).implicazione));
  eq('grado basso senza dato sulla necrosi → non determinabile',
    bucket({ nuclear_grade:'low' }).id, 'indeterminato');
  eq('grado nucleare intermedio → non determinabile',
    bucket({ nuclear_grade:'intermediate', necrosis:'no' }).id, 'indeterminato');
  check('su core biopsy il grado e dichiarato non definitivo',
    /non è definitivo/.test(bucket({ specimen_type:'trucut', nuclear_grade:'low', necrosis:'no' }).implicazione));
  check('su pezzo operatorio nessun avviso',
    !/non è definitivo/.test(bucket({ specimen_type:'resection', nuclear_grade:'low', necrosis:'no' }).implicazione));

  const acc = bucket({ specimen_type:'resection', nuclear_grade:'low', necrosis:'no', cribriform:'yes' });
  eq('basaloide cribriforme a basso grado → ACC da escludere', acc.id, 'basaloide_acc');
  check('chiede MYB IHC e fusione', acc.tests.some(t => /fusione MYB\/MYBL1::NFIB/.test(t)), acc.tests.join(' | '));
  check('MYB IHC negativa: non esclude, testare la fusione',
    bucket({ cribriform:'yes', nuclear_grade:'low', necrosis:'no', myb:'neg' }).tests.some(t => /non esclude ACC/.test(t)));
  check('MYB IHC positiva: non e specifica',
    bucket({ cribriform:'yes', nuclear_grade:'low', necrosis:'no', myb:'pos' }).tests.some(t => /non è specifica/.test(t)));
  check('su core biopsy: diagnosi descrittiva',
    bucket({ specimen_type:'trucut', cribriform:'yes', nuclear_grade:'low', necrosis:'no' }).tests.some(t => /descrittiva/.test(t)));
  check('su pezzo operatorio nessun suggerimento di diagnosi descrittiva',
    !acc.tests.some(t => /descrittiva/.test(t)));
  eq('un segno isolato non toglie lo status di ACC da escludere',
    bucket({ cribriform:'yes', nuclear_grade:'high', necrosis:'no' }).id, 'basaloide_acc');
  check('ma il segno e riportato', /Segno isolato/.test(bucket({ cribriform:'yes', nuclear_grade:'high', necrosis:'no' }).rationale.join(' ')));
  eq('con due segni prevale l alto grado anche su un ACC cribriforme',
    bucket({ cribriform:'yes', necrosis:'yes', nuclear_grade:'high' }).id, 'alto_grado');
  eq('MEC con mucina e MAML2+ → basso grado, non basaloide',
    bucket({ mucin_production:'abundant', maml2:'pos', nuclear_grade:'low', necrosis:'no' }).id, 'basso_grado');

  eq('nessuna sopravvissuta → non determinabile', managementBucket({ A:{passed:false} }, {}, {}).id, 'indeterminato');

  const fd = { cribriform:'yes', nuclear_grade:'low', necrosis:'no' };
  const snap = JSON.stringify(fd);
  bucket(fd);
  eq('managementBucket non muta il form', JSON.stringify(fd), snap);
}

section('v5.2.0 — livello fenotipico p40 / CD117 / S100 (Fig. 2)');
{
  // tre stati: p40 non eseguito non sposta nulla
  eq('p40 non eseguito: fenotipo non valutato', phenotypeOf({}).id, 'non_valutato');
  eq('p40 "not_done": idem', phenotypeOf({ p40:'not_done' }).id, 'non_valutato');
  ENTITIES.forEach(e => eq(`${e}: senza p40 nessuno spostamento`, phenotypeAdjust(e, { s100:'pos', cd117:'luminal' }), 0));
  eq('form vuoto invariato: tutto a zero', classifica(run({}).g2)[0][1].score, 0);

  eq('p40 abluminale → bifasico', phenotypeOf({ p40:'abluminal' }).id, 'biphasic');
  eq('p40 negativo → monofasico ghiandolare', phenotypeOf({ p40:'neg' }).id, 'glandular');
  eq('p40 diffuso → monofasico squamoide', phenotypeOf({ p40:'diffuse' }).id, 'squamoid');

  // cancello morbido: nessuna esclusione da p40
  ['abluminal','neg','diffuse'].forEach(v =>
    eq(`p40 ${v}: nessuna entità esclusa da Gate 1`, escluse(run({ p40:v }).g1).length, 0));

  // punteggi
  eq('PA con p40 abluminale: +2', score({ p40:'abluminal' }, 'PA'), 2);
  eq('PA con p40 abluminale e CD117 luminale: +3', score({ p40:'abluminal', cd117:'luminal' }, 'PA'), 3);
  eq('PA con p40 negativo: -3', score({ p40:'neg' }, 'PA'), -3);
  eq('ACC con p40 negativo: -3', score({ p40:'neg' }, 'ACC'), -3);
  eq('carcinoma polimorfo con p40 negativo: +2', score({ p40:'neg' }, 'PolymorphousAC'), 2);
  eq('HCCC con p40 diffuso: +2', score({ p40:'diffuse' }, 'HCCC'), 2);
  eq('MEC con p40 negativo: solo -1 (minoranza descritta)', score({ p40:'neg' }, 'MEC'), -1);
  eq('MEC con p40 abluminale: -3', score({ p40:'abluminal' }, 'MEC'), -3);
  eq('CaExPA non ha famiglia: invariata', score({ p40:'neg' }, 'CaExPA'), 0);
  eq('Warthin è bifasica: p40 negativo la penalizza', score({ p40:'neg' }, 'Warthin'), -3);
  check('CD117 luminale senza p40 non fa nulla', phenotypeAdjust('PA', { cd117:'luminal' }) === 0);

  // il caso che l'articolo mette al centro: cribriforme p40-negativo = polimorfo, non ACC
  const cribr = { specimen_type:'resection', cribriform:'yes', duality:'borderline', nuclear_grade:'low', necrosis:'no',
                  neural_invasion:'focal', varied_patterns:'yes', p40:'neg', s100:'pos' };
  const r = run(cribr);
  eq('cribriforme p40− S100+ con pattern vari: in testa il polimorfo', classifica(r.g2)[0][0], 'PolymorphousAC');
  check('ACC non è esclusa (cancello morbido) ma sotto il polimorfo',
    r.g1.ACC.passed && r.g2.ACC.score < r.g2.PolymorphousAC.score);
  // lo stesso quadro con p40 abluminale è un ACC
  const acc = run({ ...cribr, p40:'abluminal', s100:undefined, varied_patterns:undefined, duality:'clear' });
  eq('cribriforme p40 abluminale con dualità: in testa l ACC', classifica(acc.g2)[0][0], 'ACC');

  // S100 suddivide il solo monofasico ghiandolare
  eq('glandulare S100+: SC +1 oltre il fenotipo', score({ p40:'neg', s100:'pos' }, 'SC'), 3);
  eq('glandulare S100−: AciCC +2 oltre il fenotipo', score({ p40:'neg', s100:'neg' }, 'AciCC'), 4);
  eq('glandulare S100−, SOX10+: AciCC un punto in più', score({ p40:'neg', s100:'neg', sox10:'pos' }, 'AciCC'), 5);
  eq('glandulare S100+: AciCC penalizzata', score({ p40:'neg', s100:'pos' }, 'AciCC'), 0);
  eq('glandulare S100−: SC penalizzata', score({ p40:'neg', s100:'neg' }, 'SC'), 0);
  eq('S100 focale non sposta nulla', score({ p40:'neg', s100:'focal' }, 'SC'), 2);
  eq('S100 in un bifasico non sposta nulla (variabile)', score({ p40:'abluminal', s100:'pos' }, 'PA'), 2);
  eq('squamoide con S100+: MEC penalizzato', score({ p40:'diffuse', s100:'pos' }, 'MEC'), 0);
  eq('squamoide con SOX10+: HCCC penalizzato', score({ p40:'diffuse', sox10:'pos' }, 'HCCC'), 0);
  eq('squamoide con S100 negativo: nessuna penalità', score({ p40:'diffuse', s100:'neg' }, 'MEC'), 2);

  // pro/con
  check('PA p40 negativo: contro esplicito', getProConMissing('PA', { p40:'neg' }).con.some(c => /p40 negativo/.test(c)));
  check('PA p40 abluminale: pro esplicito', getProConMissing('PA', { p40:'abluminal' }).pro.some(c => /coerente/.test(c)));
  check('MEC p40 negativo: avverte che esiste in minoranza',
    getProConMissing('MEC', { p40:'neg' }).con.some(c => /minoranza/.test(c)));
  check('AciCC S100+: contro', getProConMissing('AciCC', { p40:'neg', s100:'pos' }).con.some(c => /S100\+/.test(c)));
  check('AciCC S100−/SOX10+: pro', getProConMissing('AciCC', { p40:'neg', s100:'neg', sox10:'pos' }).pro.some(c => /SOX10/.test(c)));
  check('MEC con S100+ in squamoide: rimanda al mioepiteliale',
    getProConMissing('MEC', { p40:'diffuse', s100:'pos' }).con.some(c => /mioepiteliale/.test(c)));
  check('senza p40 nessuna riga di fenotipo',
    !JSON.stringify(getProConMissing('PA', { s100:'pos' })).includes('Fenotipo'));
  // p63: con p40 negativo non è un pro
  check('p63+ con p40 negativo non è letto come mioepitelio',
    !getProConMissing('PA', { p63:'pos', p40:'neg' }).pro.some(c => /p63/.test(c)));
  check('p63+ senza p40 resta un pro (invariato)',
    getProConMissing('PA', { p63:'pos' }).pro.some(c => /p63/.test(c)));

  // note di fenotipo
  check('bifasico con CD117 non luminale: non confermato',
    phenotypeOf({ p40:'abluminal', cd117:'neg' }).notes.some(n => /non confermato/.test(n)));
  check('bifasico con CD117 luminale: confermato',
    phenotypeOf({ p40:'abluminal', cd117:'luminal' }).notes.some(n => /conferma/.test(n)));
  check('bifasico con CD117 non eseguito: nessun giudizio',
    phenotypeOf({ p40:'abluminal', cd117:'not_done' }).notes.length === 0);
  check('ghiandolare senza S100: dice che serve', phenotypeOf({ p40:'neg' }).notes.some(n => /S100 non valutato/.test(n)));
  check('ghiandolare con p63+: avverte', phenotypeOf({ p40:'neg', p63:'pos' }).notes.some(n => /aspecifico/.test(n)));
  check('squamoide con S100+: rimanda al carcinoma mioepiteliale',
    phenotypeOf({ p40:'diffuse', s100:'pos' }).notes.some(n => /mioepiteliale/.test(n)));

  // qualità del dato
  const w = fd => checkDataQuality(fd).join(' | ');
  check('p40 abluminale + dualità assente: contraddizione', /CONTRADDIZIONE.*p40/.test(w({ p40:'abluminal', duality:'absent' })));
  check('p40 negativo + dualità netta: avviso', /p40 negativo con dualità/.test(w({ p40:'neg', duality:'clear' })));
  check('p63+ con p40 negativo: avviso', /p63\+ con p40 negativo/.test(w({ p40:'neg', p63:'pos' })));
  check('senza p40 nessuno di questi avvisi', !/p40/.test(w({ duality:'absent', p63:'pos' })));

  // raccomandazioni
  const rec = fd => { const { g1, g2 } = run(fd); return recommendNextTests(g1, g2, fd).join(' | '); };
  check('p40 mancante: pannello di primo livello', /p40 \+ CD117 \+ S100/.test(rec({})));
  check('p40 fatto: il pannello non viene più chiesto', !/Pannello di primo livello/.test(rec({ p40:'neg' })));
  check('p40 negativo senza S100: chiede S100', /→ S100:/.test(rec({ p40:'neg' })));
  check('p40 negativo con S100 fatto: non lo richiede', !/→ S100:/.test(rec({ p40:'neg', s100:'pos' })));
  check('glandulare S100−: chiede SOX10', /SOX10/.test(rec({ p40:'neg', s100:'neg' })));
  check('squamoide: MAML2 per il MEC', /MAML2 \(MEC\)/.test(rec({ p40:'diffuse' })));
  check('bifasico senza CD117: lo chiede', /→ CD117/.test(rec({ p40:'abluminal' })));
  check('squamoide con S100+: carcinoma mioepiteliale', /carcinoma mioepiteliale/.test(rec({ p40:'diffuse', s100:'pos' })));

  // orientamento gestionale: p40 e ACC
  const bucket = fd => { const { g1, g2 } = run(fd); return managementBucket(g1, g2, fd); };
  eq('cribriforme con p40 negativo: ACC non è più da escludere',
    bucket({ cribriform:'yes', nuclear_grade:'low', necrosis:'no', p40:'neg' }).id, 'basso_grado');
  eq('...salvo MYB+', bucket({ cribriform:'yes', nuclear_grade:'low', necrosis:'no', p40:'neg', myb:'pos' }).id, 'basaloide_acc');
  eq('p40 abluminale è un indizio di basaloide/ACC',
    bucket({ nuclear_grade:'low', necrosis:'no', p40:'abluminal', cribriform:'partial' }).id, 'basaloide_acc');
  check('l indizio p40 abluminale è riportato',
    /p40 abluminale/.test(bucket({ nuclear_grade:'low', necrosis:'no', p40:'abluminal', cribriform:'partial' }).rationale.join(' ')));

  // coerenza delle tabelle
  ENTITIES.filter(e => e !== 'CaExPA').forEach(e => check(`${e} ha una famiglia fenotipica`, !!ENTITY_FAMILY[e]));
  check('CaExPA non ne ha una', !ENTITY_FAMILY.CaExPA);
  eq('le famiglie sono tre', [...new Set(Object.values(ENTITY_FAMILY))].sort().join(','), 'biphasic,glandular,squamoid');
  eq('p40 ha tre valori di fenotipo', Object.keys(PHENOTYPE_OF_P40).sort().join(','), 'abluminal,diffuse,neg');
  const fd = { p40:'neg', s100:'pos' }; const snap = JSON.stringify(fd);
  phenotypeOf(fd); phenotypeAdjust('SC', fd); phenotypeProCon('SC', fd);
  eq('le funzioni di fenotipo non mutano il form', JSON.stringify(fd), snap);
}

section('v5.3.0 — neoplasia basocellulare (adenoma / adenocarcinoma)');
{
  // tre stati
  eq('form vuoto: basal cell a zero', score({}, 'BasalCell'), 0);
  check('form vuoto: non esclusa', run({}).g1.BasalCell.passed);
  eq('nessun deal-breaker, nemmeno con dati contrari',
    evaluateDealBreaker('BasalCell', { bcatenin:'neg', spindle_stroma:'no', necrosis:'yes', nuclear_grade:'high' }).hit, false);
  check('β-catenina negativa non esclude e non toglie punti',
    run({ bcatenin:'neg' }).g1.BasalCell.passed && score({ bcatenin:'neg' }, 'BasalCell') === 0);
  eq('"not_done" non vale come negativo', score({ bcatenin:'not_done', basal_driver:'not_done' }, 'BasalCell'), 0);

  // punteggi
  eq('stroma fusato: +3', score({ spindle_stroma:'yes' }, 'BasalCell'), 3);
  eq('stroma fusato assente: 0', score({ spindle_stroma:'no' }, 'BasalCell'), 0);
  eq('β-catenina nucleare: +3', score({ bcatenin:'nuclear' }, 'BasalCell'), 3);
  eq('CTNNB1/CYLD mutato: +3', score({ basal_driver:'pos' }, 'BasalCell'), 3);
  eq('dualità netta: +1', score({ duality:'clear' }, 'BasalCell'), 1);
  eq('i tre reperti insieme + dualità: HIGH',
    run({ spindle_stroma:'yes', bcatenin:'nuclear', basal_driver:'pos', duality:'clear' }).g2.BasalCell.conf, 'HIGH');
  eq('fenotipo bifasico: +2', score({ p40:'abluminal' }, 'BasalCell'), 2);
  eq('p40 negativo la penalizza', score({ p40:'neg' }, 'BasalCell'), -3);
  eq('la sua famiglia fenotipica e il bifasico', ENTITY_FAMILY.BasalCell, 'biphasic');

  // caso di scuola: basaloide cribriforme con stroma fusato e β-catenina nucleare
  const bc = { specimen_type:'resection', duality:'clear', cribriform:'partial', nuclear_grade:'low', necrosis:'no',
               p40:'abluminal', cd117:'luminal', spindle_stroma:'yes', bcatenin:'nuclear' };
  eq('stroma fusato + β-catenina nucleare: in testa il basal cell', classifica(run(bc).g2)[0][0], 'BasalCell');
  const acc = { ...bc, spindle_stroma:undefined, bcatenin:'neg', cribriform:'yes', myb:'pos', neural_invasion:'extensive' };
  eq('ACC classico con MYB+ e PNI resta un ACC', classifica(run(acc).g2)[0][0], 'ACC');

  // pro/con sulle altre entità
  check('ACC: β-catenina nucleare tra i contro', getProConMissing('ACC', { bcatenin:'nuclear' }).con.some(c => /basal cell/.test(c)));
  check('ACC: stroma fusato tra i contro', getProConMissing('ACC', { spindle_stroma:'yes' }).con.some(c => /basal cell/.test(c)));
  check('PA: β-catenina nucleare tra i contro', getProConMissing('PA', { bcatenin:'nuclear' }).con.some(c => /basal cell/.test(c)));
  eq('la β-catenina non sposta il punteggio di ACC', score({ bcatenin:'nuclear' }, 'ACC'), 0);
  eq('né quello del PA', score({ bcatenin:'nuclear' }, 'PA'), 0);

  const pc = getProConMissing('BasalCell', { necrosis:'yes' });
  check('necrosi è un contro', pc.con.some(c => /Necrosi/.test(c)));
  check('chiede β-catenina, stroma e driver', ['β-catenina','Stroma fusato','CTNNB1'].every(k => pc.missing.some(m => m.includes(k))));
  check('dice che adenoma e adenocarcinoma non si distinguono su biopsia',
    pc.missing.some(m => /Invasione/.test(m) && /biopsia/.test(m)));
  check('con β-catenina fatta non la richiede più',
    !getProConMissing('BasalCell', { bcatenin:'neg' }).missing.some(m => /β-catenina/.test(m)));

  // esami successivi
  const rec = fd => { const { g1, g2 } = run(fd); return recommendNextTests(g1, g2, fd).join(' | '); };
  check('basaloide bifasico senza β-catenina: la raccomanda', /β-catenina IHC/.test(rec({ p40:'abluminal' })));
  check('dualità: la raccomanda', /β-catenina IHC/.test(rec({ duality:'clear' })));
  check('cribriforme: la raccomanda', /β-catenina IHC/.test(rec({ cribriform:'yes' })));
  check('senza indizi basaloidi non la raccomanda', !/β-catenina IHC/.test(rec({ mucin_production:'abundant' })));
  check('β-catenina già fatta: non la richiede', !/β-catenina IHC/.test(rec({ p40:'abluminal', bcatenin:'neg' })));
  check('LEF1 sconsigliato nel testo', /LEF1 non raccomandato/.test(rec({ p40:'abluminal' })));

  // orientamento gestionale
  const bucket = fd => { const { g1, g2 } = run(fd); return managementBucket(g1, g2, fd); };
  const b = bucket(bc);
  eq('basaloide con basal cell in testa: resta da escludere l ACC', b.id, 'basaloide_acc');
  check('ma il basal cell è dichiarato in testa', /basocellulare in testa/.test(b.rationale.join(' ')), b.rationale.join(' '));
  check('senza basal cell in testa la riga non c è', !/basocellulare in testa/.test(bucket(acc).rationale.join(' ')));
}

section('purezza e invarianti di progetto');
{
  const fd = { specimen_type:'resection', cribriform:'yes', duality:'clear', myb:'pos' };
  const snap = JSON.stringify(fd);
  const g1 = gateOne(fd); gateTwo(g1, fd); checkDataQuality(fd); recommendNextTests(g1, {}, fd);
  eq('il motore non muta il form', JSON.stringify(fd), snap);

  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const eng  = fs.readFileSync(new URL('../engine.js',  import.meta.url), 'utf8');
  const pkg  = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const codice = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n')
                 .replace(/^\s*\/\/.*$/gm, '');

  check('index.html carica engine.js', /<script src="engine\.js/.test(html));
  check('il motore non tocca il DOM', !/document\.|getElementById|querySelector|window\./.test(eng));
  eq('versione allineata a package.json', html.includes(`engine.js?v=${pkg.version}`), true);
  check('titolo allineato alla versione', html.includes(`Salivary Gland Tool v${pkg.version}`), pkg.version);
  check('la chiave di sessione segue la versione',
    html.includes(`sgdt_v${pkg.version.replace(/\./g,'_')}_session`));

  // il motore non deve essere anche dentro la pagina: e' il difetto che in dermatiti
  // teneva una suite di test puntata su un file che l applicazione non caricava
  ['function gateOne','function gateTwo','function evaluateDealBreaker',
   'function getProConMissing','function checkDataQuality'].forEach(f =>
    check(`${f} non e duplicata in index.html`, !codice.includes(f)));

  // newCase() non deve piu svuotare l intera origine: gli altri strumenti
  // di infingardo.github.io condividono il dominio
  check('newCase non chiama sessionStorage.clear()', !/sessionStorage\.clear\(\)/.test(codice));

  // ogni campo raccolto dal wizard o e' letto da una regola o e' dichiarato non usato
  const raccolti = (codice.match(/for\(let n of \[([^\]]+)\]/) || [,''])[1]
                     .split(',').map(s => s.trim().replace(/^'|'$/g, '')).filter(Boolean);
  check('save() raccoglie i campi del wizard', raccolti.length > 20, String(raccolti.length));
  check('specimen_type entra nel salvataggio', raccolti.includes('specimen_type'));
  // save() raccoglieva 'prag1', ma il campo del form si chiama 'plag1': la risposta
  // PLAG1 finiva nel nulla e il tool continuava a chiederla come mancante
  const campiForm = [...new Set([...html.matchAll(/mkRad\('([A-Za-z0-9_]+)'/g)].map(m => m[1]))];
  const orfani = raccolti.filter(f => !campiForm.includes(f));
  eq('save() non raccoglie campi che il form non espone', orfani.join(','), '');
  const nonSalvati = campiForm.filter(f => !raccolti.includes(f));
  eq('nessun campo del form resta fuori dal salvataggio', nonSalvati.join(','), '');
  check('PLAG1 arriva al motore', raccolti.includes('plag1'));
  const opzioni = f => {
    const i = html.indexOf(`mkRad('${f}',[`);
    if (i < 0) return [];
    const chunk = html.slice(i, html.indexOf('])', i));
    return [...chunk.matchAll(/\['([a-z0-9_]+)'/g)].map(x => x[1]);
  };

  eq('i valori di specimen_type sono quelli usati dal codice',
    opzioni('specimen_type').join(','), 'trucut,resection,fnab');
  LIMITED_SPECIMENS.forEach(v =>
    check(`"${v}" e una risposta che il form puo produrre`, opzioni('specimen_type').includes(v)));
  eq('i valori di microcystic sono quelli attesi dal motore', opzioni('microcystic').join(','), 'yes,no');

  // L'invariante che conta: ogni valore con cui il motore confronta un campo deve
  // essere un valore che quel campo puo' davvero assumere. E' l'errore che altrove
  // aveva prodotto un confronto con 'si' dove il form scriveva 'yes', e qui teneva
  // il MEC a zero punti su una mucina 'scarsa' confrontata con 'focal'.
  const fantasmi = [];
  raccolti.forEach(f => {
    const validi = opzioni(f);
    if (!validi.length) return;
    const usati = new Set();
    [...eng.matchAll(new RegExp(`(?:fd|formData)\\.${f}\\s*===\\s*'([a-z0-9_]+)'`, 'g'))]
      .forEach(m => usati.add(m[1]));
    [...eng.matchAll(new RegExp(`is(?:Not)?\\((?:fd|formData)\\.${f}\\s*,([^)]*)\\)`, 'g'))]
      .forEach(m => [...m[1].matchAll(/'([a-z0-9_]+)'/g)].forEach(x => usati.add(x[1])));
    [...usati].filter(v => !validi.includes(v)).forEach(v => fantasmi.push(`${f}==='${v}'`));
  });
  eq('il motore non confronta con valori che il form non produce', fantasmi.join(' '), '');
  const lettiDalMotore = raccolti.filter(f => new RegExp(`(fd|formData)\\.${f}\\b`).test(eng));
  const morti = raccolti.filter(f => !lettiDalMotore.includes(f));
  eq('i campi non usati sono esattamente quelli dichiarati',
    morti.slice().sort().join(','), UNSCORED_FIELDS.slice().sort().join(','));
  check('i campi non usati sono mostrati all utente', codice.includes('UNSCORED_FIELDS'));

  // ogni nome che la pagina prende dal motore deve essere davvero esposto dal motore
  const espostiAllaPagina = (eng.match(/Object\.assign\(globalThis, \{([\s\S]*?)\}\)/) || [,''])[1]
      .split(',').map(x => x.trim()).filter(Boolean);
  ['gateOne','gateTwo','checkDataQuality','recommendNextTests','checkOutsideModel',
   'getProConMissing','UNSCORED_FIELDS','managementBucket','phenotypeOf'].forEach(n => {
    if (new RegExp(`\\b${n}\\b`).test(codice))
      check(`il motore espone ${n} alla pagina`, espostiAllaPagina.includes(n));
  });

  // ogni entita di Gate 1 arriva a Gate 2 con criteri suoi
  const dichiarate = (eng.match(/const entities=\[([^\]]+)\]/) || [,''])[1]
                       .split(',').map(s => s.trim().replace(/^'|'$/g, '')).filter(Boolean);
  eq('le entita del motore sono quelle attese', dichiarate.join(','), ENTITIES.join(','));
  dichiarate.forEach(e => check(`Gate 2 ha un ramo per ${e}`,
    new RegExp(`e==='${e}'`).test(eng)));
  check('il ramo generico score=1 e irraggiungibile',
    ENTITIES.every(e => score({}, e) === 0));
}

console.log(`\n${fail === 0 ? 'OK' : 'FALLITO'} — ${pass} pass, ${fail} fail`);
if (failures.length) { console.log('\nFallimenti:'); failures.forEach(f => console.log('  ✗ ' + f)); }
process.exit(fail === 0 ? 0 : 1);
