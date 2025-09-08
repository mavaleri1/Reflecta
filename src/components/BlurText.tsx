import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface BlurTextProps {
  text: string;
  delay?: number;
  animateBy?: "words" | "letters";
  direction?: "top" | "bottom" | "left" | "right";
  onAnimationComplete?: () => void;
  className?: string;
}

export default function BlurText({
  text,
  delay = 0,
  animateBy = "words",
  direction = "top",
  onAnimationComplete,
  className = "",
}: BlurTextProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getInitialPosition = () => {
    switch (direction) {
      case "top":
        return { y: -50, opacity: 0, filter: "blur(10px)" };
      case "bottom":
        return { y: 50, opacity: 0, filter: "blur(10px)" };
      case "left":
        return { x: -50, opacity: 0, filter: "blur(10px)" };
      case "right":
        return { x: 50, opacity: 0, filter: "blur(10px)" };
      default:
        return { y: -50, opacity: 0, filter: "blur(10px)" };
    }
  };

  const getAnimatePosition = () => {
    switch (direction) {
      case "top":
        return { y: 0, opacity: 1, filter: "blur(0px)" };
      case "bottom":
        return { y: 0, opacity: 1, filter: "blur(0px)" };
      case "left":
        return { x: 0, opacity: 1, filter: "blur(0px)" };
      case "right":
        return { x: 0, opacity: 1, filter: "blur(0px)" };
      default:
        return { y: 0, opacity: 1, filter: "blur(0px)" };
    }
  };

  const splitText = () => {
    if (animateBy === "words") {
      return text.split(" ");
    }
    return text.split("");
  };

  const textElements = splitText();

  return (
    <div className={`inline-block ${className}`}>
      {textElements.map((element, index) => (
        <motion.span
          key={index}
          initial={getInitialPosition()}
          animate={isVisible ? getAnimatePosition() : getInitialPosition()}
          transition={{
            duration: 0.6,
            delay: index * 0.1,
            ease: "easeOut",
          }}
          className="inline-block"
          onAnimationComplete={() => {
            if (index === textElements.length - 1 && onAnimationComplete) {
              onAnimationComplete();
            }
          }}
        >
          {element}
          {animateBy === "words" && index < textElements.length - 1 && <span>&nbsp;</span>}
          {animateBy === "letters" && element === " " && <span>&nbsp;</span>}
        </motion.span>
      ))}
    </div>
  );
}
