import React, { useState, useEffect, useRef } from "react";
import { Howl } from "howler";
import "../styles/styles.css";

// Asset paths - now with multiple hurdle images
const assets = {
  character: {
    up: "/character-up.svg",
    down: "/character-down.svg",
    left: "/character-left.svg",
    right: "/character-right.svg",
  },
  tree: "/tree_Class_PNG_Clipart.svg",
  point: "/points.svg",
  hurdles: [
    "/hurdle-stone.png", // Add your hurdle image paths
    "/hurdle-stone.png",
    "/hurdle-stone.png",
    "/hurdle-stone.png",
  ],

  cursor: "/cursor_img.svg", // Add your cursor image path
  effect: "/Target-position.gif", // Add your effect image path
  sound: {
    collect: "/collect-points-190037.mp3",
    crash: "/crash-sound.mp3",
    move: "/move-sound.mp3", // Add move sound
    treeRemove: "/tree-remove-sound.mp3",
  },
};

const GameView = () => {
  // Game constants
  const TREE_SIZE = { width: 20, height: 50 };
  const POINT_SIZE = 50;
  const HURDLE_SIZES = [
    // Different sizes for different hurdle types
    { width: 60, height: 20 },
    { width: 50, height: 30 },
    { width: 40, height: 40 },
    { width: 30, height: 50 },
  ];
  const CHARACTER_SIZE = { width: 30, height: 40 };
  const CURSOR_SIZE = { width: 60, height: 60 };
  const EFFECT_SIZE = { width: 50, height: 50 };
  const MOVE_SPEED = 2.50000;

  // Game state
  const [state, setState] = useState({
    position: { x: window.innerWidth / 2 - 20, y: window.innerHeight - 60 },
    direction: "down",
    score: 0,
    lives: 3,
    trees: [],
    points: [],
    hurdles: [],
    gameOver: false,
    cursorPosition: { x: 0, y: 0 },
    effects: [],
    isMoving: false,
    targetPosition: null,
    removedTrees: [],
  });

  // Refs
  const gameRef = useRef(null);
  const characterRef = useRef(null);
  const sounds = useRef({
    collect: new Howl({ src: [assets.sound.collect] }),
    crash: new Howl({ src: [assets.sound.crash] }),
    move: new Howl({ src: [assets.sound.move] }),
    treeRemove: new Howl({ src: [assets.sound.treeRemove] }),
  });

  // Initialize game
  useEffect(() => {
    initGame();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
    };
  }, []);

  const initGame = () => {
    // Initialize points
    const points = Array.from({ length: 10 }, (_, i) => ({
      id: `point-${i}`,
      x: Math.random() * (window.innerWidth - POINT_SIZE),
      y: Math.random() * (window.innerHeight - POINT_SIZE),
      collected: false,
    }));

    // Initialize hurdles with random types
    const hurdles = Array.from({ length: 5 }, (_, i) => {
      const hurdleType = Math.floor(Math.random() * assets.hurdles.length);
      return {
        id: `hurdle-${i}`,
        x: Math.random() * (window.innerWidth - HURDLE_SIZES[hurdleType].width),
        y:
          Math.random() *
          (window.innerHeight - HURDLE_SIZES[hurdleType].height),
        type: hurdleType, // Store the hurdle type
      };
    });

    // Initialize trees
    const trees = [];
    const treesPerRow = Math.ceil(window.innerWidth / TREE_SIZE.width);
    const rows = Math.ceil(window.innerHeight / TREE_SIZE.height);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < treesPerRow; col++) {
        const x = col * TREE_SIZE.width;
        const y = row * TREE_SIZE.height;

        const isStartingPos = checkCollision(
          x,
          y,
          TREE_SIZE.width,
          TREE_SIZE.height,
          state.position.x,
          state.position.y,
          CHARACTER_SIZE.width,
          CHARACTER_SIZE.height
        );

        const overlapsPoint = points.some(
          (point) =>
            !point.collected &&
            checkCollision(
              x,
              y,
              TREE_SIZE.width,
              TREE_SIZE.height,
              point.x,
              point.y,
              POINT_SIZE,
              POINT_SIZE
            )
        );

        const overlapsHurdle = hurdles.some((hurdle) => {
          const hurdleSize = HURDLE_SIZES[hurdle.type];
          return checkCollision(
            x,
            y,
            TREE_SIZE.width,
            TREE_SIZE.height,
            hurdle.x,
            hurdle.y,
            hurdleSize.width,
            hurdleSize.height
          );
        });

        trees.push({
          id: `${row}-${col}`,
          x,
          y,
          visible: !isStartingPos && !overlapsPoint && !overlapsHurdle,
        });
      }
    }

    setState((prev) => ({
      ...prev,
      trees,
      points,
      hurdles,
      gameOver: false,
      removedTrees: [],
      position: { x: window.innerWidth / 2 - 20, y: window.innerHeight - 60 },
    }));

    // Add mouse event listeners after game init
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);
  };

  const checkCollision = (x1, y1, w1, h1, x2, y2, w2, h2) => {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  };

  const handleMouseMove = (e) => {
    setState((prev) => ({
      ...prev,
      cursorPosition: { x: e.clientX, y: e.clientY },
    }));
  };

  const handleClick = (e) => {
    if (state.gameOver || state.isMoving) return;

    const targetX = e.clientX - CHARACTER_SIZE.width / 2;
    const targetY = e.clientY - CHARACTER_SIZE.height / 2;

    // Add click effect
    addEffect(
      e.clientX - EFFECT_SIZE.width / 2,
      e.clientY - EFFECT_SIZE.height / 2
    );

    // Start moving character
    setState((prev) => ({
      ...prev,
      targetPosition: { x: targetX, y: targetY },
      isMoving: true,
    }));

    sounds.current.move.play();
  };

  const addEffect = (x, y) => {
    const effectId = `effect-${Date.now()}`;

    setState((prev) => ({
      ...prev,
      effects: [...prev.effects, { id: effectId, x, y }],
    }));

    // Remove effect after animation
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        effects: prev.effects.filter((e) => e.id !== effectId),
      }));
    }, 1000);
  };

  const removeTreesAtPosition = (x, y) => {
    setState((prev) => {
      const treesAtTarget = prev.trees.filter(
        (tree) =>
          checkCollision(
            tree.x,
            tree.y,
            TREE_SIZE.width,
            TREE_SIZE.height,
            x,
            y,
            CHARACTER_SIZE.width,
            CHARACTER_SIZE.height
          ) && tree.visible
      );

      if (treesAtTarget.length > 0) {
        sounds.current.treeRemove.play();
      }

      return {
        ...prev,
        trees: prev.trees.map((tree) => {
          const shouldRemove = treesAtTarget.some((t) => t.id === tree.id);
          return shouldRemove ? { ...tree, visible: false } : tree;
        }),
        removedTrees: [
          ...prev.removedTrees,
          ...treesAtTarget.map((t) => ({ id: t.id, x: t.x, y: t.y })),
        ],
      };
    });
  };

  // Animation frame for smooth movement
  useEffect(() => {
    if (!state.isMoving || !state.targetPosition) return;

    const moveCharacter = () => {
      setState((prev) => {
        if (!prev.isMoving || !prev.targetPosition) return prev;

        const { position, targetPosition, direction } = prev;
        let newX = position.x;
        let newY = position.y;
        let newDir = direction;
        let reachedTarget = false;

        // Calculate direction and movement
        const dx = targetPosition.x - position.x;
        const dy = targetPosition.y - position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < MOVE_SPEED) {
          newX = targetPosition.x;
          newY = targetPosition.y;
          reachedTarget = true;
          removeTreesAtPosition(newX, newY);
        } else {
          newX += (dx / distance) * MOVE_SPEED;
          newY += (dy / distance) * MOVE_SPEED;
        }

        // Update direction based on movement
        if (Math.abs(dx) > Math.abs(dy)) {
          newDir = dx > 0 ? "right" : "left";
        } else {
          newDir = dy > 0 ? "down" : "up";
        }

        // Boundary checks
        newX = Math.max(
          0,
          Math.min(window.innerWidth - CHARACTER_SIZE.width, newX)
        );
        newY = Math.max(
          0,
          Math.min(window.innerHeight - CHARACTER_SIZE.height, newY)
        );

        const newState = {
          ...prev,
          position: { x: newX, y: newY },
          direction: newDir,
          isMoving: !reachedTarget,
          targetPosition: reachedTarget ? null : prev.targetPosition,
        };

        updateGameState(newX, newY, newState);
        return newState;
      });

      if (state.isMoving) {
        requestAnimationFrame(moveCharacter);
      }
    };

    requestAnimationFrame(moveCharacter);
  }, [state.isMoving, state.targetPosition]);

  const updateGameState = (charX, charY, prevState) => {
    // Check hurdle collision first
    const hitHurdle = prevState.hurdles.some((hurdle) => {
      const hurdleSize = HURDLE_SIZES[hurdle.type];
      return checkCollision(
        hurdle.x,
        hurdle.y,
        hurdleSize.width,
        hurdleSize.height,
        charX,
        charY,
        CHARACTER_SIZE.width,
        CHARACTER_SIZE.height
      );
    });

    if (hitHurdle) {
      sounds.current.crash.play();
      const newLives = prevState.lives - 1;

      if (newLives <= 0) {
        setState((prev) => ({ ...prev, gameOver: true, isMoving: false }));
        return;
      }

      // Reset position after hitting hurdle
      setState((prev) => ({
        ...prev,
        lives: newLives,
        position: { x: window.innerWidth / 2 - 20, y: window.innerHeight - 60 },
        isMoving: false,
        targetPosition: null,
      }));
      return;
    }

    // Clear trees under character
    const trees = prevState.trees.map((tree) => {
      const isUnderCharacter = checkCollision(
        tree.x,
        tree.y,
        TREE_SIZE.width,
        TREE_SIZE.height,
        charX,
        charY,
        CHARACTER_SIZE.width,
        CHARACTER_SIZE.height
      );

      return {
        ...tree,
        visible: tree.visible && !isUnderCharacter,
      };
    });

    // Check point collection
    let score = prevState.score;
    const points = prevState.points.map((point) => {
      if (point.collected) return point;

      const collected = checkCollision(
        point.x,
        point.y,
        POINT_SIZE,
        POINT_SIZE,
        charX,
        charY,
        CHARACTER_SIZE.width,
        CHARACTER_SIZE.height
      );

      if (collected) {
        sounds.current.collect.play();
        score++;
      }

      return { ...point, collected };
    });

    setState({ ...prevState, trees, points, score });
  };

  const handleResize = () => {
    setState((prev) => ({
      ...prev,
      position: {
        x: window.innerWidth / 2 - 20,
        y: window.innerHeight - 60,
      },
    }));
    initGame();
  };

  const restartGame = () => {
    setState((prev) => ({
      ...prev,
      score: 0,
      lives: 3,
      gameOver: false,
      isMoving: false,
      targetPosition: null,
      effects: [],
      removedTrees: [],
    }));
    initGame();
  };

  return (
    <div className="cover" ref={gameRef}>
      <div className="score-display">
        Score: {state.score} | Lives: {state.lives}
      </div>

      {state.gameOver && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Final Score: {state.score}</p>
          <button onClick={restartGame}>Play Again</button>
        </div>
      )}

      {/* Custom cursor image */}
      <img
        src={assets.cursor}
        alt="Cursor"
        className="cursor"
        style={{
          position: "absolute",
          left: `${state.cursorPosition.x - CURSOR_SIZE.width / 2}px`,
          top: `${state.cursorPosition.y - CURSOR_SIZE.height / 2}px`,
          width: `${CURSOR_SIZE.width}px`,
          height: `${CURSOR_SIZE.height}px`,
          pointerEvents: "none",
          zIndex: 1000,
        }}
      />

      {/* Click effects */}
      {state.effects.map((effect) => (
        <img
          key={effect.id}
          src={assets.effect}
          alt="Effect"
          className="effect"
          style={{
            position: "absolute",
            left: `${effect.x}px`,
            top: `${effect.y}px`,
            width: `${EFFECT_SIZE.width}px`,
            height: `${EFFECT_SIZE.height}px`,
            pointerEvents: "none",
            zIndex: 20,
            animation: "fadeOut 1s forwards",
          }}
        />
      ))}

      {/* Show only visible trees */}
      {state.trees
        .filter((t) => t.visible)
        .map((tree) => (
          <img
            key={tree.id}
            src={assets.tree}
            alt="Tree"
            className="tree"
            style={{
              position: "absolute",
              left: `${tree.x}px`,
              top: `${tree.y}px`,
              width: `${TREE_SIZE.width}px`,
              height: `${TREE_SIZE.height}px`,
              transform: "rotateX(50deg)",
            }}
          />
        ))}

      {/* Show removed trees with fade out animation */}
      {state.removedTrees.map((tree) => (
        <img
          key={`removed-${tree.id}`}
          src={assets.tree}
          alt="Removed Tree"
          className="tree removed-tree"
          style={{
            position: "absolute",
            left: `${tree.x}px`,
            top: `${tree.y}px`,
            width: `${TREE_SIZE.width}px`,
            height: `${TREE_SIZE.height}px`,
            transform: "rotateX(50deg)",
            animation: "treeRemove 0.5s forwards",
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Render hurdles with different images */}
      {state.hurdles.map((hurdle) => {
        const hurdleSize = HURDLE_SIZES[hurdle.type];
        return (
          <img
            key={hurdle.id}
            src={assets.hurdles[hurdle.type]}
            alt={`Hurdle ${hurdle.type + 1}`}
            className="hurdle"
            style={{
              position: "absolute",
              left: `${hurdle.x}px`,
              top: `${hurdle.y}px`,
              width: `${hurdleSize.width}px`,
              height: `${hurdleSize.height}px`,
              zIndex: 5,
            }}
          />
        );
      })}

      {state.points
        .filter((p) => !p.collected)
        .map((point) => (
          <img
            key={point.id}
            src={assets.point}
            alt="Point"
            className="point"
            style={{
              position: "absolute",
              left: `${point.x}px`,
              top: `${point.y}px`,
              width: `${POINT_SIZE}px`,
              height: `${POINT_SIZE}px`,
              zIndex: 5,
            }}
          />
        ))}

      <img
        ref={characterRef}
        src={assets.character[state.direction]}
        alt="Character"
        style={{
          position: "absolute",
          left: `${state.position.x}px`,
          top: `${state.position.y}px`,
          width: `${CHARACTER_SIZE.width}px`,
          height: `${CHARACTER_SIZE.height}px`,
          zIndex: 10,
        }}
      />
    </div>
  );
};

export default GameView;
