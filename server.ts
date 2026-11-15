import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { Request, Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const MESSAGES_FILE = path.join(__dirname, 'data', 'contact-messages.json');

interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

interface StoredMessage extends ContactPayload {
  id: string;
  createdAt: string;
  emailDelivered: boolean;
}

function validateContactInput(body: unknown): {
  valid: boolean;
  data?: ContactPayload;
  fieldErrors?: Record<string, string>;
} {
  if (!body || typeof body !== 'object') {
    return { valid: false, fieldErrors: { message: 'Invalid request payload.' } };
  }

  const record = body as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  const email = typeof record.email === 'string' ? record.email.trim() : '';
  const message = typeof record.message === 'string' ? record.message.trim() : '';

  const fieldErrors: Record<string, string> = {};

  if (name.length < 2 || name.length > 120) {
    fieldErrors.name = 'Please enter your name (2–120 characters).';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 254) {
    fieldErrors.email = 'Please enter a valid email address.';
  }

  if (message.length < 10 || message.length > 4000) {
    fieldErrors.message = 'Please enter a message (10–4000 characters).';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { valid: false, fieldErrors };
  }

  return { valid: true, data: { name, email, message } };
}

async function saveMessageRecord(entry: StoredMessage): Promise<void> {
  const dir = path.dirname(MESSAGES_FILE);
  await fs.mkdir(dir, { recursive: true });

  let existing: StoredMessage[] = [];
  try {
    const raw = await fs.readFile(MESSAGES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      existing = parsed as StoredMessage[];
    }
  } catch {
    existing = [];
  }

  existing.push(entry);
  await fs.writeFile(MESSAGES_FILE, JSON.stringify(existing, null, 2), 'utf8');
}

async function sendEmailViaResend(payload: ContactPayload): Promise<{ ok: boolean; detail?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, detail: 'RESEND_API_KEY not configured' };
  }

  const toEmail = process.env.CONTACT_TO_EMAIL?.trim() || 'korashiabir@gmail.com';
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || 'Portfolio Contact <onboarding@resend.dev>';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      reply_to: payload.email,
      subject: `Portfolio Message from ${payload.name}`,
      text: `Name: ${payload.name}\nEmail: ${payload.email}\n\nMessage:\n${payload.message}`,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    return { ok: false, detail: errText || `HTTP ${response.status}` };
  }

  return { ok: true };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.post('/api/contact', async (req: Request, res: Response) => {
    const validation = validateContactInput(req.body);
    if (!validation.valid || !validation.data) {
      res.status(400).json({
        ok: false,
        error: 'Please check the highlighted fields.',
        fieldErrors: validation.fieldErrors,
      });
      return;
    }

    const { name, email, message } = validation.data;
    const hasResendKey = Boolean(process.env.RESEND_API_KEY?.trim());
    let emailDelivered = false;

    if (hasResendKey) {
      try {
        const result = await sendEmailViaResend({ name, email, message });
        emailDelivered = result.ok;
        if (!result.ok) {
          console.error('Resend API error:', result.detail);
        }
      } catch (err) {
        console.error('Email dispatch error:', err);
      }
    }

    const record: StoredMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      email,
      message,
      createdAt: new Date().toISOString(),
      emailDelivered,
    };

    try {
      await saveMessageRecord(record);
    } catch (err) {
      console.error('Failed to persist contact message:', err);
      if (!emailDelivered) {
        res.status(500).json({
          ok: false,
          emailSent: false,
          error: 'Could not store or send your message right now. Please use the direct email options below.',
        });
        return;
      }
    }

    if (hasResendKey && !emailDelivered) {
      res.status(502).json({
        ok: false,
        emailSent: false,
        saved: true,
        error:
          'Your message was recorded on the server, but automatic email delivery failed. Please send directly using Gmail or your email app below.',
      });
      return;
    }

    if (emailDelivered) {
      res.status(200).json({
        ok: true,
        emailSent: true,
        saved: true,
        message: 'Thank you! Your message has been sent directly to korashiabir@gmail.com.',
      });
      return;
    }

    res.status(200).json({
      ok: true,
      emailSent: false,
      saved: true,
      message:
        'Your inquiry was validated and saved on the server. Automatic email forwarding activates once RESEND_API_KEY is configured in environment secrets—or you can send it immediately via Gmail or your email app below.',
    });
  });

  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Portfolio server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
