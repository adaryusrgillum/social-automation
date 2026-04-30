const { exec } = require('child_process');
const http = require('http');

const BACKEND_URL = 'http://localhost:3000';

function runAdbCommand(args) {
  return new Promise((resolve, reject) => {
    exec(`adb ${args}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`ADB Error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`ADB stderr: ${stderr}`);
      }
      resolve(stdout.trim());
    });
  });
}

async function checkDevice() {
  try {
    const devices = await runAdbCommand('devices');
    console.log('Connected devices:\n' + devices);
    return devices.includes('\tdevice');
  } catch (err) {
    console.error('Failed to check ADB devices', err);
    return false;
  }
}

function pollBackend() {
  console.log('Polling backend for processing posts...');
  http.get(`${BACKEND_URL}/posts`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
      try {
        const posts = JSON.parse(data);
        const toProcess = posts.filter(p => p.status === 'processing');
        
        for (const post of toProcess) {
          console.log(`Sending post ${post.id} to Android device via ADB...`);
          // Example: trigger a deep link or broadcast intent to the Android app
          // adb shell am broadcast -a com.socialautomation.POST -e platform "instagram" -e content "Hello"
          
          try {
            await runAdbCommand(`shell am broadcast -a com.socialautomation.EXECUTE_POST -e id "${post.id}" -e platform "${post.platform}" -e content "${post.content || ''}"`);
            
            // Mark as done
            updateStatus(post.id, 'done');
          } catch (err) {
            console.error(`Failed to execute post ${post.id}:`, err);
            updateStatus(post.id, 'failed');
          }
        }
      } catch (e) {
        console.error('Error parsing backend response:', e.message);
      }
    });
  }).on('error', (err) => {
    console.error('Failed to connect to backend:', err.message);
  });
}

function updateStatus(id, status) {
  const data = JSON.stringify({ status });
  const req = http.request(`${BACKEND_URL}/posts/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }, (res) => {
    res.on('data', () => {}); // Consume data
    res.on('end', () => console.log(`Post ${id} marked as ${status}`));
  });
  req.on('error', (e) => console.error(e));
  req.write(data);
  req.end();
}

async function main() {
  console.log('Starting Desktop Controller...');
  const hasDevice = await checkDevice();
  if (!hasDevice) {
    console.log('No Android device connected via ADB. Please connect a device.');
  }

  // Poll backend every 10 seconds
  setInterval(pollBackend, 10000);
  pollBackend();
}

main();
