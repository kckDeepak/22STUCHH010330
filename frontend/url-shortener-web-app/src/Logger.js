import axios from 'axios';

// Log function
export async function log(stack, level, pkg, message) {
  try {
    const res = await axios.post('http://localhost:3001/logs', {
      stack, level, package: pkg, message
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_ACCESS_TOKEN}`
      }
    });
    console.log('Log sent: ' + res.data.logId);
  } catch (e) {
    console.log('Log error: ' + e.message);
  }
}