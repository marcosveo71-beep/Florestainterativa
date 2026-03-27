import fs from 'fs';
import https from 'https';

https.get('https://raw.githubusercontent.com/dgreenheck/ez-tree/main/README.md', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => fs.writeFileSync('readme.md', data));
});
