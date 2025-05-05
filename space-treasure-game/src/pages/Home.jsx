import { useState, useEffect, useRef } from "react";
import "../styles/Home.css";

const GraphPaper = ({
  width = 800,
  height = 600,
  gridSize = 20,
  minorGridColor = "#e0e0e0",
  majorGridColor = "#b0b0b0",
  majorGridInterval = 5,
  axisNameFontSize = "18",
  axisNameFontcolor = "#ffffff",
  showAxis = true,
  axisColor = "#000000",
  dotColor = "#ff6b6b",
  arrowColor = "#ff6b6b",
  leafPositions = [
    { x: 5, y: 0, images: ["default1.png"] },
    { x: 0, y: -5, images: ["default2.png"] },
    { x: -5, y: 0, images: ["default3.png"] },
    { x: 0, y: 5, images: ["default4.png"] },
  ],
  placedItemComponent = DefaultPlacedItem,
  showResultOnLeaf = null,
  setShowResultOnLeaf,
  onLeafClick,
  timeLeft,
  score,
  gameStarted,
}) => {
  const [targetPosition, setTargetPosition] = useState({
    x: width / 2,
    y: height / 2,
  });
  const [currentPosition, setCurrentPosition] = useState({
    x: width / 2,
    y: height / 2,
  });
  const [currentGridCoords, setCurrentGridCoords] = useState({ x: 0, y: 0 });
  const [targetGridCoords, setTargetGridCoords] = useState({ x: 0, y: 0 });
  const [isJumping, setIsJumping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const animationRef = useRef();
  const startTimeRef = useRef();

  // Calculate center coordinates
  const centerX = width / 2;
  const centerY = height / 2;

  // Animation effect
  useEffect(() => {
    if (isJumping) {
      const animate = (timestamp) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const progress = Math.min((timestamp - startTimeRef.current) / 500, 1);

        // Quadratic ease-out for smooth deceleration
        const easedProgress = 1 - (1 - progress) * (1 - progress);

        const newX =
          currentPosition.x +
          (targetPosition.x - currentPosition.x) * easedProgress;
        const newY =
          currentPosition.y +
          (targetPosition.y - currentPosition.y) * easedProgress;

        setCurrentPosition({ x: newX, y: newY });

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsJumping(false);
          startTimeRef.current = null;
          // Update current grid coordinates when landing
          const gridX = Math.round((newX - centerX) / gridSize);
          const gridY = Math.round((newY - centerY) / gridSize);
          setCurrentGridCoords({ x: gridX, y: gridY });
        }
      };

      animationRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationRef.current);
    }
  }, [isJumping, targetPosition, currentPosition, centerX, centerY, gridSize]);

  // Create grid lines
  const horizontalLines = [];
  const verticalLines = [];
  const dots = [];

  for (let y = 0; y <= height; y += gridSize) {
    const isMajor = y % (gridSize * majorGridInterval) === 0;
    horizontalLines.push(
      <line
        key={`h${y}`}
        x1={0}
        y1={y}
        x2={width}
        y2={y}
        stroke={isMajor ? majorGridColor : minorGridColor}
        strokeWidth={isMajor ? 1.5 : 1}
      />
    );

    for (let x = 0; x <= width; x += gridSize) {
      if ((x / gridSize) % 2 !== 0 && (y / gridSize) % 2 !== 0) {
        dots.push(
          <circle key={`dot-${x}-${y}`} cx={x} cy={y} r={3} fill={dotColor} />
        );
      }
    }
  }

  for (let x = 0; x <= width; x += gridSize) {
    const isMajor = x % (gridSize * majorGridInterval) === 0;
    verticalLines.push(
      <line
        key={`v${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke={isMajor ? majorGridColor : minorGridColor}
        strokeWidth={isMajor ? 1.5 : 1}
      />
    );
  }

  // Axis configuration
  const axisLength = 300;
  const arrowSize = 10;
  const labelOffset = 15;

  const axesConfig = [
    {
      axis: "x",
      endX: centerX + axisLength,
      endY: centerY,
      labelX: centerX + axisLength + labelOffset,
      labelY: centerY,
      text: "X",
    },
    {
      axis: "y",
      endX: centerX,
      endY: centerY - axisLength,
      labelX: centerX,
      labelY: centerY - axisLength - labelOffset,
      text: "Y",
    },
    {
      axis: "-x",
      endX: centerX - axisLength,
      endY: centerY,
      labelX: centerX - axisLength - labelOffset,
      labelY: centerY,
      text: "-X",
    },
    {
      axis: "-y",
      endX: centerX,
      endY: centerY + axisLength,
      labelX: centerX,
      labelY: centerY + axisLength + labelOffset,
      text: "-Y",
    },
  ];

  const renderCoordinateNumbers = () => {
    if (!showCoordinates) return null;

    // Calculate how many numbers we can show based on visible graph area
    const maxXNumbers = Math.floor((width / 2 - 20) / gridSize); // Subtract 20 for padding
    const maxYNumbers = Math.floor((height / 2 - 20) / gridSize);

    const numbers = [];
    const numberOffsetX = 5; // Pixel offset for X-axis numbers
    const numberOffsetY = 5; // Pixel offset for Y-axis numbers
    const fontSize = 14;

    // X-axis numbers (positive and negative)
    for (let i = -maxXNumbers; i <= maxXNumbers; i++) {
      if (i === 0) continue; // Skip 0 since it's at the center

      const posX = centerX + i * gridSize;
      // Only show if within visible area
      if (posX > 20 && posX < width - 20) {
        // 20px padding from edges
        numbers.push(
          <text
            key={`x-${i}`}
            x={posX}
            y={centerY - numberOffsetX}
            fill="#ffffff"
            fontSize={fontSize}
            textAnchor="start"
            dominantBaseline="auto"
          >
            {i}
          </text>
        );
      }
    }

    // Y-axis numbers (positive and negative)
    for (let i = -maxYNumbers; i <= maxYNumbers; i++) {
      if (i === 0) continue; // Skip 0 since it's at the center

      const posY = centerY - i * gridSize;
      // Only show if within visible area
      if (posY > 20 && posY < height - 20) {
        // 20px padding from edges
        numbers.push(
          <text
            key={`y-${i}`}
            x={centerX + numberOffsetY}
            y={posY}
            fill="#ffffff"
            fontSize={fontSize}
            textAnchor="start"
            dominantBaseline="auto"
          >
            {i}
          </text>
        );
      }
    }

    return <g>{numbers}</g>;
  };

  const handleSpaceJump = (gridCoords) => {
    if (!gameStarted) return;

    const position = {
      x: centerX + gridCoords.x * gridSize,
      y: centerY + gridCoords.y * gridSize,
    };

    setTargetPosition(position);
    setTargetGridCoords(gridCoords);
    setIsJumping(true);

    // Find the target position in leafPositions
    const targetLeaf = leafPositions.find(
      (leaf) => leaf.x === gridCoords.x && leaf.y === gridCoords.y
    );

    // Call the callback after the jump animation completes (500ms)
    setTimeout(() => {
      if (targetLeaf) {
        // Show result based on isCorrect
        setShowResultOnLeaf({
          x: gridCoords.x,
          y: gridCoords.y,
          isCorrect: targetLeaf.isCorrect,
          point: targetLeaf.point,
        });

        // Notify parent component about the result
        if (onLeafClick) {
          onLeafClick(targetLeaf);
        }
      } else {
        // Hide any previous result if clicked position is not a leaf
        setShowResultOnLeaf(null);
      }
    }, 500);
  };

  const handleGraphClick = (e) => {
    if (!gameStarted) return;

    const svg = e.currentTarget;
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());

    // Calculate grid coordinates
    const gridX = Math.round((svgPoint.x - centerX) / gridSize);
    const gridY = Math.round((svgPoint.y - centerY) / gridSize);

    handleSpaceJump({ x: gridX, y: gridY });
  };

  // Check if current position matches any leaf position to show result
  const showResult = () => {
    if (!showResultOnLeaf) return null;

    const resultX = centerX + showResultOnLeaf.x * gridSize;
    const resultY = centerY + showResultOnLeaf.y * gridSize;

    return (
      <image
        href={showResultOnLeaf.isCorrect ? "/treasure.svg" : "/dragon.svg"}
        x={resultX - 50}
        y={resultY - 100}
        width="100"
        height="100"
        className="result-image"
      />
    );
  };

  const axes = showAxis ? (
    <g key="axes">
      <line
        x1={centerX}
        y1={0}
        x2={centerX}
        y2={height}
        stroke={axisColor}
        strokeWidth={2}
      />
      <line
        x1={0}
        y1={centerY}
        x2={width}
        y2={centerY}
        stroke={axisColor}
        strokeWidth={2}
      />

      <defs>
        <marker
          id="arrowhead"
          markerWidth={arrowSize}
          markerHeight={arrowSize}
          refX={arrowSize}
          refY={arrowSize / 2}
          orient="auto"
        >
          <polygon
            points={`0 0, ${arrowSize} ${arrowSize / 2}, 0 ${arrowSize}`}
            fill={arrowColor}
          />
        </marker>
      </defs>

      {axesConfig.map((config) => (
        <g key={`axis-${config.axis}`}>
          <line
            x1={centerX}
            y1={centerY}
            x2={config.endX}
            y2={config.endY}
            stroke={arrowColor}
            strokeWidth={2}
            markerEnd="url(#arrowhead)"
          />
          <text
            x={config.labelX}
            y={config.labelY}
            fill={axisNameFontcolor}
            fontSize={axisNameFontSize}
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {config.text}
          </text>
        </g>
      ))}
    </g>
  ) : null;

  const PlacedItemComponent = placedItemComponent;

  const handlesidebar = () => {
    setShowSidebar(!showSidebar);
    setShowCoordinates(!showCoordinates);
  };

  return (
    <div className="wrapper_Space_game">
      {/* menu */}
      <nav className="Menu_board">
        <div className="Time ms-2">Remaining Time: {timeLeft}s</div>
        <div className="location_cover">
          <div className="coordinate_display">
            <span className="coordinate_label">Current Position:</span>
            <span className="coordinate_value">
              ({currentGridCoords.x}, {currentGridCoords.y})
            </span>
          </div>
        </div>
        <div className="px-2 d-flex gap-2 align-items-center">
          <img src="/cup.png" width="30px" height="20px" alt="" className="" />
          <label htmlFor="score" className="score">
            Score: {score}
          </label>
        </div>
      </nav>
      <div className="game_withsidebar_coordinaters">
        {/* sidebar target coordinates position  */}
        <div className={`Target_coordinate_display`}>
          <div className="coordinate_label">Target</div>
          <div className="coordinate_label"> Coordinates</div>
          <div className="target_coordinate_cloud">
            <img
              src="/cloud.svg"
              alt=""
              className="target_coordinate_cloud_img"
            />
            <span className="coordinate_value">
              ({targetGridCoords.x}, {targetGridCoords.y})
            </span>
          </div>
        </div>
        {/* graph with data  */}
        <div className="graph-paper-container">
          <svg
            style={{ backgroundColor: "#5d8bff22" }}
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            xmlns="http://www.w3.org/2000/svg"
            overflow={"visible"}
            onClick={handleGraphClick}
            className="graph-svg"
          >
            <defs>
              <clipPath id="graphClip">
                <rect x="0" y="0" width={width} height={height} />
              </clipPath>
            </defs>

            {horizontalLines}
            {verticalLines}
            {dots}
            {axes}
            <g clipPath="url(#graphClip)">{renderCoordinateNumbers()}</g>
            {showResult()}
            <PlacedItemComponent
              position={currentPosition}
              isJumping={isJumping}
            />
          </svg>
        </div>
      </div>
      {/* footer for buttons */}
      <div className="footer_buttons">
        <button className="btn Show_Coordinate_Buttons" onClick={handlesidebar}>
          {showCoordinates ? "Hide Coordinates" : "Show Coordinates"}
        </button>
        <button
          className="btn"
          onClick={() => {
            // Example: Jump to position (1.5, 1.5)
            handleSpaceJump({ x: 1.5, y: 1.5 });
          }}
        >
          Jump to (1.5, 1.5)
        </button>
      </div>
    </div>
  );
};

const DefaultPlacedItem = ({ position }) => (
  <g>
    <circle cx={position.x} cy={position.y} r={15} fill="#4dabf7" />
    <line
      x1={position.x - 10}
      y1={position.y}
      x2={position.x + 10}
      y2={position.y}
      stroke="white"
      strokeWidth={2}
    />
    <line
      x1={position.x}
      y1={position.y - 10}
      x2={position.x}
      y2={position.y + 10}
      stroke="white"
      strokeWidth={2}
    />
  </g>
);

const leafPositions = [
  {
    x: 3,
    y: -2,
    isCorrect: true,
    point: 10,
  },
  {
    x: -1,
    y: 0,
    isCorrect: true,
    point: 10,
  },
  {
    x: 2,
    y: 3,
    isCorrect: false,
    point: 0,
  },
  {
    x: -3,
    y: -1,
    isCorrect: true,
    point: 10,
  },
  {
    x: 0,
    y: -5,
    isCorrect: true,
    point: 20, // Bonus treasure
  },
  {
    x: 5,
    y: 0,
    isCorrect: false,
    point: 0,
  },
  {
    x: -4,
    y: 2,
    isCorrect: true,
    point: 10,
  },
];

const HomePage = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [showResultOnLeaf, setShowResultOnLeaf] = useState(null);
  const timerRef = useRef(null);

  // Start the game when component mounts
  useEffect(() => {
    startGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startGame = () => {
    setGameStarted(true);
    setTimeLeft(30);
    setScore(0);
    setShowResultOnLeaf(null);

    // Start countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setGameStarted(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleLeafClick = (result) => {
    if (!gameStarted) return;

    if (result && result.isCorrect) {
      setScore((prev) => prev + result.point);
    }
  };

  const CustomPlacedItem = ({ position, isJumping }) => {
    const frogWidth = 100;
    const frogHeight = 100;

    return (
      <g>
        <image
          href="/astronaut.png"
          x={position.x - frogWidth / 2}
          y={position.y - frogHeight / 2 - (isJumping ? 30 : 0)}
          width={frogWidth}
          height={frogHeight}
          style={{
            transition: "all 0.3s ease",
          }}
        />
      </g>
    );
  };

  return (
    <div className="ocean">
      {timeLeft === 0 && (
        <div className="game-over-modal">
          <h2>Game Over!</h2>
          <p>Your final score: {score}</p>
          <button onClick={startGame}>Play Again</button>
        </div>
      )}
      <GraphPaper
        axisNameFontSize="24"
        axisNameFontcolor="#ffffff"
        width={600}
        height={600}
        gridSize={30}
        dotColor="#52b8d7"
        axisColor="#52b8d7"
        minorGridColor="#52b8d7"
        majorGridColor="#52b8d7"
        arrowColor="#52b8d7"
        majorGridInterval={4}
        leafPositions={leafPositions}
        placedItemComponent={CustomPlacedItem}
        showResultOnLeaf={showResultOnLeaf}
        setShowResultOnLeaf={setShowResultOnLeaf}
        onLeafClick={handleLeafClick}
        timeLeft={timeLeft}
        score={score}
        gameStarted={gameStarted}
      />
    </div>
  );
};

export default HomePage;
