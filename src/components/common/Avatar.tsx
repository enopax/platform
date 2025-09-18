import Image from 'next/image';

type Props = {
  name: string;
  image: string | null;
  size?: 'large' | 'medium' | 'small';
};

const getSizeClasses = (size: string): string => {
  const sizes: { [key: string]: string } = {
    large: 'w-32 h-32',
    medium: 'w-16 h-16',
    small: 'w-8 h-8',
  };

  return sizes[size] || sizes['small'];
};

const Avatar = ({ name, image, size = 'small' }: Props) => {
  const sizeStyle = getSizeClasses(size);

  return (
    <Image
      className={`${sizeStyle} rounded-full object-cover`}
      src={image || '/assets/logo.png'}
      alt={`${name || 'placeholder'} avatar`}
      width={200}
      height={200}
    />
  );
};

export default Avatar;
