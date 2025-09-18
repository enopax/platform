import { EmailTemplate } from '@/lib/constants/email';

export default async function EmailPreview() {
  const htmlTemplate = EmailTemplate(`
    <div class="text-center">
      Template preview
    </div>
  `);

  return (
    <div>
      <iframe
        srcDoc={htmlTemplate}
        className="w-full h-screen border-0"
        sandbox="allow-same-origin"
      />
    </div>
  );
}
