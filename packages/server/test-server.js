console.log('Testing without Prisma...');
const express = require('express');
const app = express();
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.listen(3102, () => {
  console.log('Test server on 3102');
  setTimeout(() => {
    console.log('Closing...');
    process.exit(0);
  }, 3000);
});
