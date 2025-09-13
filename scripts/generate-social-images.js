import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

let devServer;

async function startDevServer() {
  return new Promise((resolve, reject) => {
    devServer = spawn('npm', ['run', 'dev'], {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    devServer.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:') && output.includes('http://localhost:')) {
        const match = output.match(/http:\/\/localhost:(\d+)/);
        if (match) {
          resolve(`http://localhost:${match[1]}`);
        }
      }
    });

    devServer.on('error', reject);
    
    setTimeout(() => {
      reject(new Error('Dev server failed to start within 10 seconds'));
    }, 10000);
  });
}

function stopDevServer() {
  if (devServer) {
    devServer.kill();
  }
}

async function takeScreenshot(url, outputPath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1200, height: 630 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  
  await page.screenshot({
    path: outputPath,
    type: 'jpeg',
    quality: 90
  });
  
  await browser.close();
}

async function main() {
  try {
    console.log('Starting dev server...');
    const baseUrl = await startDevServer();
    console.log(`Dev server started at ${baseUrl}`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Taking screenshot of default route...');
    await takeScreenshot(
      `${baseUrl}/generate-social-images.html`,
      join(projectRoot, 'public/twitter-card.jpg')
    );
    console.log('Saved public/twitter-card.jpg');
    
    console.log('Taking screenshot with Japanese language...');
    await takeScreenshot(
      `${baseUrl}/generate-social-images.html?lang=ja`,
      join(projectRoot, 'public/twitter-card-ja.jpg')
    );
    console.log('Saved public/twitter-card-ja.jpg');
    
    console.log('Social media images generated successfully!');
    
  } catch (error) {
    console.error('Error generating social media images:', error);
    process.exit(1);
  } finally {
    console.log('Stopping dev server...');
    stopDevServer();
    process.exit(0);
  }
}

main();