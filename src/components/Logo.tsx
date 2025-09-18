'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';


export default function Logo() {
  const [day, setDay] = useState(true);

  useEffect(() => {
    const checkDarkMode = () => {
      const darkMode = window.matchMedia('(prefers-color-scheme: dark)');
      setDay(!darkMode.matches);
    };
    const darkModeListener = (event) => {
      setDay(!event.matches);
    };
    checkDarkMode();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', darkModeListener);

    return () => {
      mediaQuery.removeEventListener('change', darkModeListener);
    };
  }, []);

  const logoSrc = day ? '/assets/logo.png' : '/assets/logo_dark.png';

  return (
    <Link href="/" className="cursor-pointer">
      <Image
        src={logoSrc}
        alt="Logo"
        width={150}
        height={150}
      />
    </Link>
  );
}
