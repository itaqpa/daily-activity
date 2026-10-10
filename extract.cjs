const fs = require('fs');
let js = fs.readFileSync('temp_js.js', 'utf8');
js = js.replace('(function(){\n"use strict";', 'export function generateReportHTML(s, photoMap) {');
js = js.replace(/\/\* =========================================================\n   EVENTS[\s\S]*/, 'return reportBody(s, photoMap);\n}');
js = js.replace(/function toast\(msg\)\{[^\}]+\}/g, 'function toast(){}');
js = js.replace(/function keepScroll\(fn\)\{[^\}]+\}/g, 'function keepScroll(fn){ fn(); }');
js = js.replace(/function setStatus\(kind,msg\)\{[^\}]+\}/g, 'function setStatus(){}');

fs.writeFileSync('src/survey-product/components/format/LegacyReportLogic.js', js);
