import React, { useState, useEffect } from "react";
const characterUp = "/character-up.svg";
const characterDown = "/character-down.svg";
const characterLeft = "/character-left.svg";
const characterRight = "/character-right.svg";

const TopDownCharacter = () => {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [direction, setDirection] = useState("down");

  const getSprite = () => {
    switch (direction) {
      case "up":
        return characterUp;
      case "down":
        return characterDown;
      case "left":
        return characterLeft;
      case "right":
        return characterRight;
      default:
        return characterDown;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const moveAmount = 5;

      switch (e.key) {
        case "ArrowUp":
          setPosition((prev) => ({ ...prev, y: prev.y - moveAmount }));
          setDirection("up");
          break;
        case "ArrowDown":
          setPosition((prev) => ({ ...prev, y: prev.y + moveAmount }));
          setDirection("down");
          break;
        case "ArrowLeft":
          setPosition((prev) => ({ ...prev, x: prev.x - moveAmount }));
          setDirection("left");
          break;
        case "ArrowRight":
          setPosition((prev) => ({ ...prev, x: prev.x + moveAmount }));
          setDirection("right");
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (

      <img
        src={getSprite()}
        alt="Character"
        style={{
          position: "absolute",
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: "40px",
          height: "40px",
          transition: "left 0.1s, top 0.1s",
        }}
      />
  );
};

export default TopDownCharacter;
