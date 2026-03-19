import { signIn } from '@/lib/auth';

export default async function SignInPage() {
  await signIn('dex', { redirectTo: '/' });
}
