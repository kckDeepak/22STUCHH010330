import React, { useState } from 'react';
import { TextField, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { log } from '../logger';

function ShortenerPage() {

  //State hooks
  const [url, setUrl] = useState('');
  const [validity, setValidity] = useState('');
  const [shortcode, setShortcode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const shorten = async () => {
    //some edge cases
    if(!url.startsWith('http')) {
      setError('URL needs http!');
      await log('frontend', 'error', 'component', 'Invalid URL: ' + url);
      return;
    }
    if(validity && (isNaN(validity) || validity <= 0)) {
      setError('Validity must be a number > 0');
      await log('frontend', 'error', 'component', 'Bad validity: ' + validity);
      return;
    }
    if(shortcode && !/^[a-zA-Z0-9_-]{4,}$/.test(shortcode)) {
      setError('Shortcode needs 4+ chars');
      await log('frontend', 'error', 'component', 'Invalid shortcode: ' + shortcode);
      return;
    }

    //exception logic
    try{
      await log('frontend', 'info', 'api', 'Shortening URL: ' + url);
      const res = await axios.post('http://localhost:3001/shorturls', {
        url, validity: validity || 30, shortcode
      });
      setResult(res.data);
      setError('');
      await log('frontend', 'info', 'component', 'Created short URL: ' + res.data.shortLink);
    } catch (e) {
      setError('Something went wrong!');
      await log('frontend', 'error', 'api', 'Failed to shorten: ' + e.message);
    }
  };

  //Display this
  return (
    <div>
      <TextField
        label="Long URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        fullWidth
        style={{ margin: '10px 0' }}
      />
      <TextField
        label="Validity (minutes)"
        value={validity}
        onChange={(e) => setValidity(e.target.value)}
        fullWidth
        style={{ margin: '10px 0' }}
      />
      <TextField
        label="Shortcode (optional)"
        value={shortcode}
        onChange={(e) => setShortcode(e.target.value)}
        fullWidth
        style={{ margin: '10px 0' }}
      />
      <Button variant="contained" onClick={shorten}>Shorten</Button>
      <Button onClick={() => navigate('/stats')}>View Stats</Button>
      {error && <Typography color="red">{error}</Typography>}
      {result && (
        <div>
          <Typography>Short Link: {result.shortLink}</Typography>
          <Typography>Expires: {result.expiry}</Typography>
          <Button onClick={() => navigate('/stats?code=' + result.shortLink.split('/').pop())}>
            Show Stats
          </Button>
        </div>
      )}
    </div>
  );
}

export default ShortenerPage;