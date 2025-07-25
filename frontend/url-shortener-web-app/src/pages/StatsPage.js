import React, { useState, useEffect } from 'react';
import { List, ListItem, ListItemText, Paper, Button } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { log } from '../logger';

function StatsPage() {

  //Use State hook
  const [stats, setStats] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  //Use Effect hook with location as dependency
  useEffect(() => {
    const code = new URLSearchParams(location.search).get('code');
    if (code) {
      loadStats(code);
    }
  },[location]);

  const loadStats = async (code) => {
    try{
      await log('frontend', 'info', 'api', 'Fetching stats for code: ' + code);
      const res = await axios.get('http://localhost:3001/shorturls/' + code);
      setStats([res.data]);
      await log('frontend', 'info', 'component', 'Got stats for ' + code);
    }catch (e) {
      await log('frontend', 'error', 'api', 'Stats load failed: ' + e.message);
    }
  };

  return(
    <div>
      <Button onClick={() => navigate('/')}>Back to Shortener</Button>
      <List>
        {stats.map((item) => (
          <Paper key={item.code} style={{ margin: '10px 0' }}>
            <ListItem>
              <ListItemText
                primary={`Short URL: ${item.code}`}
                secondary={
                  <>
                    Original: {item.url}<br />
                    Created: {item.created}<br />
                    Expires: {item.expiry}<br />
                    Clicks: {item.totalClicks}<br />
                    Click Details: {item.clicks.map(c => c.time + ' (' + c.referrer + ')').join(', ')}
                  </>
                }
              />
            </ListItem>
          </Paper>
        ))}
      </List>
    </div>
  );
}

export default StatsPage;