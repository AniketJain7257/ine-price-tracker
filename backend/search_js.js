const fs = require('fs');
const content = fs.readFileSync('js_bundle.js', 'utf8');

const regex = /.{0,200}move\([a-zA-Z0-9_,]{1,10}\)\{.{0,300}/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log('Found:', match[0]);
}
