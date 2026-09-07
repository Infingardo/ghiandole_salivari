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
        recommendNextTests, checkOutsideModel } = E;

let pass = 0, fail = 0; const failures = [];
const check = (n, c, d = '') => c ? pass++ : (fail++, failures.push(n + (d ? ` — ${d}` : '')));
const eq = (n, a, b) => check(n, a === b, `atteso ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`);
const section = t => console.log(`\n• ${t}`);

const ENTITIES = ['PA','ACC','MEC','AciCC','SC','MSA','CaExPA','Warthin','EMC','PolymorphousAC','HCCC'];
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
  eq('PA resta esclusa su core biopsy per alto grado nucleare',
    run({ specimen_type:'trucut', nuclear_grade:'high' }).g1.PA.passed, false);

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
    dog1:'pos', maml2:'pos', myb:'pos', etv6:'pos', mammaglobin:'pos', mef2c:'pos',
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
   'getProConMissing','UNSCORED_FIELDS'].forEach(n => {
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
