import * as motion from "motion/react-client";

export default function Circle({
  color = "#dd00ee",
  children,
}: {
  color?: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{
        duration: 0.4,
        scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
      }}
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
  width: 100,
  height: 100,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};
