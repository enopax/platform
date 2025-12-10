import { ResourceApiDebugPanel } from '@/components/debug/ResourceApiDebugPanel';

export const metadata = {
  title: 'Resource API Test | Enopax',
  description: 'Debug and test Platform ↔ Resource API communication',
};

export default function TestResourceApiPage() {
  return <ResourceApiDebugPanel />;
}
