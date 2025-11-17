const fs = require('fs');
const vm = require('vm');
const files = [
  'c:/Users/admin/Desktop/ralty/crmbackend/models/notification.js',
  'c:/Users/admin/Desktop/ralty/crmbackend/controllers/leadController.js',
  'c:/Users/admin/Desktop/ralty/crmbackend/controllers/inventrycontroller.js',
  'c:/Users/admin/Desktop/ralty/crmbackend/services/followupCronService.js'
];
let ok = true;
for (const f of files) {
  try {
    const code = fs.readFileSync(f, 'utf8');
    new vm.Script(code);
    console.log('PARSE OK', f);
  } catch (e) {
    console.error('PARSE ERROR', f, e.message);
    ok = false;
  }
}
if (ok) console.log('ALL PARSED OK');
process.exit(ok ? 0 : 1);
