import Link from 'next/link';
import Image from 'next/image';

export default function Socials() {
  return (
    <div className="mt-4 flex justify-center gap-4">
      <Link href="#" target="_blank" className="group">
        <Image
          src="/icons/instagram.svg"
          alt="Instagram"
          width={24}
          height={24}
          className="h-8 w-8 transition duration-100 group-hover:brightness-150 brightness-100 grayscale"
        />
      </Link>

      <Link href="#" target="_blank" className="group">
        <Image
          src="/icons/facebook.svg"
          alt="Facebook"
          width={24}
          height={24}
          className="h-8 w-8 transition duration-100 group-hover:brightness-150 brightness-100 grayscale"
        />
      </Link>

      <Link href="#" target="_blank" className="group">
        <Image
          src="/icons/linkedin.svg"
          alt="LinkedIn"
          width={24}
          height={24}
          className="h-8 w-8 transition duration-100 group-hover:brightness-150 brightness-100 grayscale"
        />
      </Link>
    </div>
  );
}
