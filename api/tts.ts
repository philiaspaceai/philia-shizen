import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
// @ts-ignore
import { EdgeTTS } from 'node-edge-tts';

// In Vercel serverless environments, /tmp is the writable scratch space
const AUDIO_CACHE_DIR = path.join('/tmp', 'shizen_tts_cache');
if (!fs.existsSync(AUDIO_CACHE_DIR)) {
  try {
    fs.mkdirSync(AUDIO_CACHE_DIR, { recursive: true });
  } catch {
    // Ignore if directory already exists
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Only accept GET or HEAD requests
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const host = req.headers.host || 'localhost';
    const parsedUrl = new URL(req.url || '/', `http://${host}`);
    const text = (parsedUrl.searchParams.get('text') || '').trim();
    const voice = (parsedUrl.searchParams.get('voice') || 'ja-JP-NanamiNeural').trim();
    const rate = (parsedUrl.searchParams.get('rate') || '-10%').trim();

    if (!text) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Text query parameter is required' }));
      return;
    }

    if (text.length > 200) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Text exceeds maximum length of 200 characters' }));
      return;
    }

    const hash = crypto.createHash('md5').update(`${text}_${voice}_${rate}`).digest('hex');
    const cacheFile = path.join(AUDIO_CACHE_DIR, `${hash}.mp3`);

    // If cached file does not exist, synthesize it via EdgeTTS
    if (!fs.existsSync(cacheFile) || fs.statSync(cacheFile).size === 0) {
      const tts = new EdgeTTS({
        voice,
        lang: 'ja-JP',
        rate,
        timeout: 10000,
      });

      const tempFile = path.join(AUDIO_CACHE_DIR, `temp_${hash}_${Date.now()}.mp3`);
      await tts.ttsPromise(text, tempFile);
      fs.renameSync(tempFile, cacheFile);
    }

    const stat = fs.statSync(cacheFile);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Headers essential for mobile browsers (iOS Safari, Android Chrome)
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        res.statusCode = 416;
        res.setHeader('Content-Range', `bytes */${fileSize}`);
        res.end();
        return;
      }

      const chunksize = end - start + 1;
      res.statusCode = 206;
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunksize);

      if (req.method === 'HEAD') {
        res.end();
        return;
      }

      const stream = fs.createReadStream(cacheFile, { start, end });
      stream.pipe(res);
    } else {
      res.statusCode = 200;
      res.setHeader('Content-Length', fileSize);

      if (req.method === 'HEAD') {
        res.end();
        return;
      }

      const stream = fs.createReadStream(cacheFile);
      stream.pipe(res);
    }
  } catch (err: any) {
    console.error('TTS Vercel API error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to synthesize audio', message: err?.message || String(err) }));
  }
}
