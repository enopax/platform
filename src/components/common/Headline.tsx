type Props = {
  children?: React.ReactNode;
};

const Headline = ({ children }: Props) => {
  return (
    <h2 className="mb-2 text-2xl font-bold text-gray-800 dark:text-gray-200 md:mb-4 lg:text-3xl xl:mb-8">
      {children}
    </h2>
  );
};

export default Headline;
