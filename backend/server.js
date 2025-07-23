const express = require('express');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const app = express();
const port = 3001; // Backend on 3001 to avoid conflict with frontend
require('dotenv').config();
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || 'your-access-token-here';

const urls = {};
const clicks = {};

//these are allowed
const stacks = ['backend'];
const levels = ['debug', 'info', 'warn', 'error', 'fatal'];
const packages = ['handler', 'route', 'middleware', 'service'];

// Logger
async function log(stack, level, pkg, message) {
  if(!stacks.includes(stack) || !levels.includes(level) || !packages.includes(pkg)) {
    console.log('Bad log values!');
    return;
  }
  try{
    const res = await fetch('http://20.244.56.144/evaluation-service/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify({ stack, level, package: pkg, message })
    });
    if(res.ok) {
      const data = await res.json();
      console.log(`Log sent: ${data.logId}`);
    }else {
      console.log(`Log failed: HTTP ${res.status}`);
    }
  }catch(error) {
    console.log(`Log error: ${error.message}`);
  }
}

// Handle middleware
app.use(express.json());

app.use(async (req, res, next) => {
  await log('backend', 'info', 'middleware', `Got ${req.method} request to ${req.url}`);
  next();
});

// API endpoints
app.post('/logs', async (req, res) => {
  const { stack, level, package: pkg, message } = req.body;
  if(!stack || !level || !pkg || !message) {
    await log('backend', 'error', 'handler', 'Missing log fields');
    return res.status(400).json({ error: 'Need all fields' });
  }
  if(!stacks.includes(stack) || !levels.includes(level) || !packages.includes(pkg)) {
    await log('backend', 'error', 'handler', `Bad log values: ${stack}, ${level}, ${pkg}`);
    return res.status(400).json({ error: 'Bad values' });
  }
  const logId = uuidv4();
  await log('backend', 'info', 'handler', `New log ${logId}: ${message}`);
  res.json({ logId, message: 'log created successfully' });
});


// ShortURL route
app.post('/shorturls', async (req, res) => {
  const { url, validity = 30, shortcode } = req.body;
  if(!url || !url.startsWith('http')) {
    await log('backend', 'error', 'handler', `Bad URL: ${url}`);
    return res.status(400).json({ error: 'Bad URL' });
  }
  let code = shortcode || uuidv4().slice(0, 6);
  if(urls[code]) {
    await log('backend', 'error', 'handler', `Code ${code} already used`);
    return res.status(400).json({ error: 'Code taken' });
  }
  const expiry = new Date(Date.now() + validity * 60 * 1000);
  urls[code] = {
    url,
    created: new Date().toISOString(),
    expiry: expiry.toISOString(),
    clicks: 0
  };
  clicks[code] = [];
  await log('backend', 'info', 'handler', `Made short URL ${code} for ${url}`);
  res.status(201).json({
    shortLink: `http://localhost:${port}/${code}`,
    expiry: expiry.toISOString()
  });
});

// Redirect to here
app.get('/:code', async (req, res) => {
  const code = req.params.code;
  const data = urls[code];
  if(!data) {
    await log('backend', 'error', 'route', `No URL for code ${code}`);
    return res.status(404).json({ error: 'Not found' });
  }
  if(new Date() > new Date(data.expiry)) {
    await log('backend', 'error', 'route', `Code ${code} expired`);
    return res.status(410).json({ error: 'Link expired' });
  }
  data.clicks++;
  clicks[code].push({
    time: new Date().toISOString(),
    referrer: req.get('Referrer') || 'None'
  });
  await log('backend', 'info', 'route', `Redirecting ${code} to ${data.url}`);
  res.redirect(data.url);
});

// Get statistics
app.get('/shorturls/:code', async (req, res) => {
  const code = req.params.code;
  const data = urls[code];
  if (!data) {
    await log('backend', 'error', 'handler', `No stats for code ${code}`);
    return res.status(404).json({ error: 'Not found' });
  }
  const stats = {
    code,
    url: data.url,
    created: data.created,
    expiry: data.expiry,
    totalClicks: data.clicks,
    clicks: clicks[code]
  };
  await log('backend', 'info', 'handler', `Sent stats for ${code}`);
  res.json(stats);
});



// Server running code here
app.listen(port, async () => {
  await log('backend', 'info', 'service', `Server running on port ${port}`);
});