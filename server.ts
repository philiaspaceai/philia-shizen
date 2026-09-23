import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
// @ts-ignore
import { EdgeTTS } from 'node-edge-tts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Disk-backed audio cache directory in temp
const AUDIO_CACHE_DIR = path.join(os.tmpdir(), 'shizen_tts_cache');
if (!fs.existsSync(AUDIO_CACHE_DIR)) {
  try {
    fs.mkdirSync(AUDIO_CACHE_DIR, { recursive: true });
  } catch (err) {
    console.warn('Could not create TTS cache dir:', err);
  }
}

// Map for active in-flight requests to avoid duplicate generation for the same phrase
const pendingAudioPromises = new Map<string, Promise<string>>();

/**
 * Helper to stream an audio file with full HTTP 206 Partial Content (Range) support.
 * This is critical for iOS Safari, WebKit, and mobile browsers.
 */
function sendAudioFileWithRange(req: express.Request, res: express.Response, filePath: string) {
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

  if (range) {
    // Parse Range header (e.g., "bytes=0-1" or "bytes=1000-")
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start > end) {
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      return res.status(416).end();
    }

    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });

    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Content-Length', chunksize);
    file.pipe(res);
  } else {
    res.status(200);
    res.setHeader('Content-Length', fileSize);
    fs.createReadStream(filePath).pipe(res);
  }
}

/**
 * High-quality Microsoft Edge Neural Japanese voice endpoint
 * Parameters:
 *   text: text to pronounce
 *   voice: (optional) default 'ja-JP-NanamiNeural'
 *   rate: (optional) default '-10%' for clear learning pace
 */
app.get('/api/tts', async (req, res) => {
  const text = (req.query.text as string || '').trim();
  const voice = (req.query.voice as string || 'ja-JP-NanamiNeural').trim();
  const rate = (req.query.rate as string || '-10%').trim();

  if (!text) {
    return res.status(400).json({ error: 'Text parameter is required' });
  }

  // Safety check on text length
  if (text.length > 200) {
    return res.status(400).json({ error: 'Text is too long' });
  }

  // Create unique cache key for text + voice + rate
  const hash = crypto.createHash('md5').update(`${text}_${voice}_${rate}`).digest('hex');
  const cacheFile = path.join(AUDIO_CACHE_DIR, `${hash}.mp3`);

  // If already synthesized and cached on disk, stream with Range support immediately
  if (fs.existsSync(cacheFile) && fs.statSync(cacheFile).size > 0) {
    return sendAudioFileWithRange(req, res, cacheFile);
  }

  try {
    // If generation is already in progress, wait for it
    let promise = pendingAudioPromises.get(hash);
    if (!promise) {
      promise = (async () => {
        const tts = new EdgeTTS({
          voice,
          lang: 'ja-JP',
          rate,
          timeout: 10000,
        });
        const tempPath = path.join(AUDIO_CACHE_DIR, `tmp_${hash}_${Date.now()}.mp3`);
        await tts.ttsPromise(text, tempPath);
        fs.renameSync(tempPath, cacheFile);
        return cacheFile;
      })();

      pendingAudioPromises.set(hash, promise);
    }

    const generatedFile = await promise;
    pendingAudioPromises.delete(hash);

    if (fs.existsSync(generatedFile) && fs.statSync(generatedFile).size > 0) {
      sendAudioFileWithRange(req, res, generatedFile);
    } else {
      throw new Error('TTS generated an empty file');
    }
  } catch (error) {
    pendingAudioPromises.delete(hash);
    console.error('Edge TTS generation failed for:', text, error);
    res.status(500).json({ error: 'Failed to generate audio' });
  }
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built static assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Shizen Server running at http://localhost:${PORT} in ${isDev ? 'dev' : 'production'} mode`);
  });
}

startServer();
