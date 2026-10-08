const currentAnswers = {'EJR.koneksi.koneksi': 'Welded', 'EJR.dimensi.bentuk': 'Bulat'};
const f = {};
Object.keys(currentAnswers).forEach(k => {
   const shortKey = k.split('.').pop();
   f[shortKey] = currentAnswers[k];
});
const isKotak = (fObj) => /Kotak|Rectangular/.test(fObj.bentuk || '');
const jsStr = 'f => f.koneksi === \'Flange\'';
let expr = jsStr.replace(/^f\s*=>\s*/, '').trim();
const parts = expr.split('&&').map(p => p.trim());
const res = parts.every(part => {
    let isNot = false;
    if (part.startsWith('!')) {
       isNot = true;
       part = part.substring(1).trim();
    }
    const eqMatch = part.match(/^f\.([a-zA-Z0-9_]+)\s*===\s*(.+)$/);
    if (eqMatch) {
      const fieldName = eqMatch[1];
      let val = eqMatch[2].replace(/['"]/g, '').trim();
      const result = (f[fieldName] === val);
      return isNot ? !result : result;
    }
    return true;
});
console.log('Result:', res, 'f:', f);

