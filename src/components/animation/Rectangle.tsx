import * as motion from "motion/react-client";

export default function Rectangle({
  color = '#fecaca',
  children,
}: {
  color?: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.9 }}
      transition={{
        duration: 0.4,
        scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
      }}
      className="flex flex-col justify-center items-center cursor-pointer rounded-md"
      style={{
        ...style,
        backgroundColor: color,
      }}
    >
      {children}
    </motion.div>
  );
}

const style = {
  width: 200,
  height: 300,
};