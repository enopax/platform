import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import fs from 'fs';
import path from 'path';

interface GuestRequest {
  userId: string;
  email: string;
  name: string;
  message: string;
  createdAt: string;
}

export default async function RequestsAdminPage() {
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  const requestsDir = path.join(dataDir, 'guest-requests');

  let requests: GuestRequest[] = [];

  if (fs.existsSync(requestsDir)) {
    const files = fs.readdirSync(requestsDir).filter(f => f.endsWith('.json')).sort().reverse();
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(requestsDir, file), 'utf-8'));
        requests.push(data);
      } catch {}
    }
  }

  return (
    <main className="mt-4">
      <Container>
        <Headline>Guest Requests ({requests.length})</Headline>

        {requests.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No requests yet</p>
        ) : (
          <div className="space-y-4 mt-6">
            {requests.map((req, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">{req.name || 'Anonymous'}</span>
                    <span className="ml-2 text-sm text-gray-500">{req.email}</span>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleString('en-GB')}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{req.message}</p>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
