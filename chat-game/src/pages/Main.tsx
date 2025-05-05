import { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import "../styles/Main.scss";

function Main() {
  const selectedTime = 260;
  const [time, setTime] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [arrowsLeft, setArrowsLeft] = useState(4);
  const [isArrowInBow, setIsArrowInBow] = useState(false);
  const [angle, setAngle] = useState(0);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [stoppedCloud, setStoppedCloud] = useState<number | null>(null);
  const arrowControls = useAnimation();
  const cloudRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && time && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => (prevTime !== null ? prevTime - 1 : null));
      }, 1000);
    } else if (time === 0) {
      setIsActive(false);
      setTime(null);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, time]);

  const handleStart = () => {
    setTime(selectedTime);
    setIsActive(true);

    if (arrowsLeft > 0 && !isArrowInBow) {
      setIsArrowInBow(true);
    }
  };

  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const radians = Math.atan2(dy, dx);
      var degrees = radians * (180 / Math.PI);
      degrees += 90;
      console.log("degree======", degrees);

      setAngle(degrees);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [time !== null]);

  const handleMouseDown = () => {
    setIsMouseDown(true);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    if (isArrowInBow) {
      fireArrow();
    }
  };

  const fireArrow = async () => {
    const audio = new Audio("/arrow-impact-87260.mp3");
    if (!isArrowInBow) return;

    const radians = (angle * Math.PI) / 309;
    const velocity = 1000;
    const targetX = Math.cos(radians) * velocity;
    const targetY = Math.sin(radians) * velocity;
    audio.play();
    await arrowControls.start({
      x: targetX,
      y: targetY,
      transition: { duration: 0.3, ease: "easeInOut" },
      opacity: 0,
    });

    setIsArrowInBow(false);
    setArrowsLeft((prevArrows) => prevArrows - 1);
    arrowControls.set({ x: 0, y: 0, opacity: 1 });
    audio.pause();
    setIsActive(true);
    if (arrowsLeft > 0 && !isArrowInBow) {
      setIsArrowInBow(true);
    }
  };

  // Reset the stopped cloud
  const handleCloudResume = (index: number) => {
    setStoppedCloud(null);
    console.log(index);
  };

  const handleCloudStop = (index: number) => {
    const cloud = cloudRefs.current[index];
    if (cloud) {
      // Get the cloud's center position
      const cloudRect = cloud.getBoundingClientRect();
      const cloudCenterX = cloudRect.left + cloudRect.width / 2;
      const cloudCenterY = cloudRect.top + cloudRect.height / 2;

      // Get the arrow's position
      const arrow = document.querySelector(".arrow");
      const arrowRect = arrow?.getBoundingClientRect();
      const arrowCenterX = arrowRect ? arrowRect.left + arrowRect.width / 2 : 0;
      const arrowCenterY = arrowRect ? arrowRect.bottom : 0;

      // Calculate the difference between the arrow and the cloud
      const dx = cloudCenterX - arrowCenterX;
      const dy = cloudCenterY - arrowCenterY;

      // Calculate the angle in radians and convert to degrees
      const radians = Math.atan2(-dy, dx);
      let degrees = radians * (180 / Math.PI);
      degrees += 90;
      // Update the state with the new angle
      setStoppedCloud(index);
      setAngle(degrees);

      console.log("Arrow to Cloud Angle:", degrees);
    }
  };

  useEffect(() => {
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    console.log(isMouseDown);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isArrowInBow]);

  return (
    <div className="Page_Wrapper">
      <div className="start_game_wrapper">
        <div className="timer">
          {time !== null
            ? `${Math.floor(time / 60)
                .toString()
                .padStart(2, "0")}:${(time % 60).toString().padStart(2, "0")}`
            : "00:00"}
        </div>
        <button className="btn_start" onClick={handleStart}>
          Start
        </button>
      </div>
      <div className="">
        <div className="cloud_wrapper">
          {[1, 2, 3, 4].map((index: number) => (
            <motion.div
              key={index}
              className="frame-1"
              ref={(el: any) => (cloudRefs.current[index] = el)}
              animate={{ x: [0, window.innerWidth] }}
              transition={{
                duration: 10,
                loop: Infinity,
                ease: "linear",
                playState: stoppedCloud === index ? "paused" : "running",
              }}
              onMouseEnter={() => handleCloudStop(index)}
              onMouseLeave={() => handleCloudResume(index)}
            >
              <img src="/cloud.svg" alt="" className="" />
            </motion.div>
          ))}
        </div>
        <div className="arrow_group">
          {Array(arrowsLeft)
            .fill(null)
            .map((_, index) => (
              <img key={index} src="/arrow.svg" alt="arrow" />
            ))}
        </div>
        <motion.div
          className="bow_prototype"
          style={{ rotate: `${angle}deg` }}
          animate={{ rotate: `${angle}deg` }}
          // transition={{ type: "spring", stiffness: 100 }}
        >
          <div className="bow">
            <img src="/bow.svg" alt="bow" />
          </div>
          {/* <div className="bow_aim_line"></div> */}

          {isArrowInBow && (
            <motion.div className="arrow" animate={arrowControls}>
              <img src="/arrow.svg" alt="arrow" />
            </motion.div>
          )}
          <div className="thread"></div>
        </motion.div>
      </div>
    </div>
  );
}

export default Main;
