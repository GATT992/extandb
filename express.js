const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

const GITHUB_USER = 'guaino1';
const FILES = {
  pt:    { repo: 'guaino1', path: 'pt.json' },
  resseler: { repo: 'datawa', path: 'resseler.json' },
  extan: { repo: 'Extan', path: 'extan.json' }
};
const GITHUB_TOKEN = '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'; // <- Personal Access Token (scope: repo)

app.get('/data/:file', async (req, res) => {
  const file = req.params.file;
  if (!FILES[file]) return res.status(404).json({ error: 'File not found' });

  const url = `https://raw.githubusercontent.com/${GITHUB_USER}/${FILES[file].repo}/refs/heads/main/${FILES[file].path}`;
  const result = await fetch(url).then(r => r.text());
  res.type('application/json').send(result);
});

app.post('/data/:file', async (req, res) => {
  const file = req.params.file;
  if (!FILES[file]) return res.status(404).json({ error: 'File not found' });

  // Step 1: Ambil SHA file
  const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${FILES[file].repo}/contents/${FILES[file].path}`;
  const response = await fetch(apiUrl, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });
  const fileData = await response.json();
  const sha = fileData.sha;

  // Step 2: Ambil data lama, tambahkan yang baru
  const dataOld = JSON.parse(atob(fileData.content));
  dataOld.push(req.body.nomor);

  // Step 3: Upload balik ke GitHub
  const update = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `Add nomor by API`,
      content: Buffer.from(JSON.stringify(dataOld)).toString('base64'),
      sha: sha
    })
  });
  const json = await update.json();
  res.json(json);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API berjalan di port ${PORT}`));