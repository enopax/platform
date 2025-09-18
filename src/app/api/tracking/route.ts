import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { writeFile, appendFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json();
  const { url, event, referrer, userAgent, sessionId } = body;

  const payload = {
    timestamp: new Date().toISOString(),
    url: url,
    event: event || '',
    referrer: referrer || '',
    user_agent: userAgent || '',
    user_id: session?.user?.id || '',
    user_role: session?.user?.role || 'GUEST',
  };

  if (process.env.ANALYTICS_DATA !== 'true') {
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics event ->', event);
    }
    return NextResponse.json({ success: true });
  }

  try {
    const today = new Date();
    const dateString = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${today.getFullYear()}`;

    const logDir = path.join(process.cwd(), 'logs');
    const dailyLogPath = path.join(logDir, `${dateString}.log`);
    const overviewPath = path.join(logDir, 'overview.log');

    // Ensure log directory exists
    if (!existsSync(logDir)) {
      await mkdir(logDir, { recursive: true });
    }

    // Append event JSON line to daily log
    const logLine = JSON.stringify(payload) + '\n';
    await appendFile(dailyLogPath, logLine, 'utf8');

    // Update overview file (format: "dd.mm.yyyy -> count events")
    let overviewContent = '';
    let overviewLines: string[] = [];
    if (existsSync(overviewPath)) {
      overviewContent = await readFile(overviewPath, 'utf8');
      overviewLines = overviewContent.split('\n').filter(Boolean);
    }

    // Parse overview lines into a map
    const overviewMap = new Map<string, number>();
    for (const line of overviewLines) {
      const [datePart, countPart] = line.split('->').map((s) => s.trim());
      const count = parseInt(countPart.split(' ')[0], 10) || 0;
      overviewMap.set(datePart, count);
    }

    // Increment count for today's date
    const overviewDateFormat = `${dateString.split('-').reverse().join('.')}`; // Convert dd-mm-yyyy to yyyy.mm.dd then reverse to dd.mm.yyyy
    const currentCount = overviewMap.get(overviewDateFormat) || 0;
    overviewMap.set(overviewDateFormat, currentCount + 1);

    // Rebuild overview content
    const newOverviewContent = Array.from(overviewMap.entries())
      .map(([date, count]) => `${date} -> ${count} events`)
      .join('\n') + '\n';

    await writeFile(overviewPath, newOverviewContent, 'utf8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing analytics log file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
