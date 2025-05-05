import { useState, useEffect, useRef } from "react";
import "../styles/flipCardDemo.css";

const initialCardData = [
  {
    id: 1,
    name: "Card 1",
    description: "This is card 1",
    image: "https://picsum.photos/200/300",
    isCorrect: true,
  },
  {
    id: 2,
    name: "Card 2",
    description: "This is card 2",
    image: "https://picsum.photos/200/301",
    isCorrect: false,
  },
  {
    id: 3,
    name: "Card 3",
    description: "This is card 3",
    image: "https://picsum.photos/200/302",
    isCorrect: true,
  },
  {
    id: 4,
    name: "Card 4",
    description: "This is card 4",
    image: "https://picsum.photos/200/303",
    isCorrect: false,
  },
  {
    id: 5,
    name: "Card 5",
    description: "This is card 5",
    image: "https://picsum.photos/200/304",
    isCorrect: true,
  },
  {
    id: 6,
    name: "Card 6",
    description: "This is card 6",
    image: "https://picsum.photos/200/305",
    isCorrect: false,
  },
];

const shuffleArray = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

function FlipCardDemo() {
  const [cards, setCards] = useState(shuffleArray(initialCardData));
  const [incorrectCards, setIncorrectCards] = useState<any[]>([]);
  const [correctCards, setCorrectCards] = useState<any[]>([]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [showResetPopup, setShowResetPopup] = useState(false);
  // const [cardsAccordingbutton, setCardsAccordingbutton] =
  //   useState<string>("notopen");
  // const [cardsAccordingbuttonHover, setCardsAccordingbuttonHover] =
  //   useState<string>(cardsAccordingbutton);

  // Lens state
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const [hoveredCardData, setHoveredCardData] = useState<any>(null);
  const [cardPosition, setCardPosition] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const lensRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cards.length === 0 && initialCardData.length > 0) {
      setShowResetPopup(true);
    }
  }, [cards]);

  const [isCardClicked, setIsCardClicked] = useState(false);
  const playSoundAndBreakCard = (card: any, index: any) => {
    if (card) {
      setIsCardClicked(true);
      if (audioRef.current) {
        audioRef.current.currentTime = 0; // Rewind to start in case it's already playing
        audioRef.current
          .play()
          .catch((e) => console.log("Audio play failed:", e));
        setDestroyCardIndex(index);

        if (!cracked) {
          setCracked(true);
          setTimeout(() => {
            setShattered(true);
          }, 500); // delay between crack and fall
        }
      }
    }
  };
  const [destroyCardIndex, setDestroyCardIndex] = useState<number | null>(null);
  const [cracked, setCracked] = useState(false);
  const [shattered, setShattered] = useState(false);
  const handleCardClick = (card: any, index: number) => {
    setIsZooming(false);
    playSoundAndBreakCard(card, index);
    const updatedCards = cards.map((c) =>
      c.id === card.id ? { ...c, isHidden: true } : c
    );
    setCards(updatedCards);
    setTimeout(() => {
      if (card.isCorrect) {
        setCorrectCards((prev) => [...prev, card]);
      } else {
        setIncorrectCards((prev) => [...prev, card]);
      }
      setCards((prev) => prev.filter((c) => c.id !== card.id));
      setShattered(false);
      setCracked(false);
      setDestroyCardIndex(null);
      // setIsZooming(true);
    }, 1200);
  };

  const resetCards = () => {
    setCards(shuffleArray(initialCardData));
    setIncorrectCards([]);
    setCorrectCards([]);
    setShowResetPopup(false);
  };

  const handleFlipCard = (itemId: number) => {
    setHoveredCard(itemId);
  };

  // const handleDataAccordingbutton = (ShowCards: string) => {
  //   setCardsAccordingbutton(ShowCards);
  // };

  const handleMouseMove = (e: React.MouseEvent) => {
    setLensPosition({
      x: e.clientX - (lensRef.current?.offsetWidth || 100) / 2,
      y: e.clientY - (lensRef.current?.offsetHeight || 100) / 2,
    });

    if (cardRef.current && hoveredCard) {
      const rect = cardRef.current.getBoundingClientRect();
      setCardPosition({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      });
    }
  };
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    audioRef.current = new Audio("/flip_card_audio/glass-smash-6266.mp3");
    return () => {
      // Cleanup audio when component unmounts
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  const handleCardMouseEnter = (card: any, e: React.MouseEvent) => {
    setHoveredCard(card.id);
    setHoveredCardData(card);
    setIsZooming(true);
    handleFlipCard(card.id); //This will trigger the sound

    const rect = e.currentTarget.getBoundingClientRect();
    setCardPosition({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });
  };

  const handleCardMouseLeave = () => {
    setIsCardClicked(false);
    setHoveredCard(null);
    setHoveredCardData(null);
    setIsZooming(false);
  };

  return (
    <div
      className="cover"
      onMouseMove={handleMouseMove}
      style={{ cursor: "none" }}
    >
      {showResetPopup && (
        <div className="reset-popup">
          <div className="reset-popup-content">
            <h3>All cards have been processed!</h3>
            <p>Would you like to reset and shuffle the cards?</p>
            <button onClick={resetCards}>Reset Cards</button>
          </div>
        </div>
      )}
      <div
        className="zoom-overlay"
        style={{
          display: isZooming ? "block" : "none",
        }}
      />
      <div
        ref={lensRef}
        className="zoom-lens"
        style={{
          left: `${lensPosition.x}px`,
          top: `${lensPosition.y}px`,
        }}
      >
        {isZooming && hoveredCardData ? (
          <div
            className="zoomed-image"
            // style={{
            //   backgroundImage: `url(${hoveredCardData.image})`,
            //   backgroundPosition: `-${lensPosition.x * 2}px -${
            //     lensPosition.y * 2
            //   }px`,
            // }}
          >
            <img src="/lensForzoom.svg" alt="lens" className="lens-image" />
          </div>
        ) : (
          <div className="zoomed-image">
            <img src="/lensForzoom.svg" alt="lens" className="lens-image" />
          </div>
        )}

        {isZooming && hoveredCardData && (
          <div
            ref={cardRef}
            className="focused-card"
            style={{
              left: `${cardPosition.x}px`,
              top: `${cardPosition.y}px`,
              width: `${cardPosition.width}px`,
              height: `${cardPosition.height}px`,
            }}
          />
        )}
      </div>

      <h1>Flip Card</h1>
      <h3 className="">And Check Answer</h3>
      <div className="w-100 d-flex flex-wrap flex-row p-3 justify-content-between gap-3 align-items-center">
        <div className="w-100 d-flex flex-wrap flex-row gap-3 p-3 justify-content-center align-items-center">
          {cards.map((item, index) => (
            <div
              key={item.id}
              className={`flip-card card-${item.id}`}
              onMouseEnter={(e) => {
                handleCardMouseEnter(item, e);
                handleFlipCard(item.id);
              }}
              onMouseLeave={() => {
                handleCardMouseLeave();
                setHoveredCard(null);
              }}
              onClick={() => handleCardClick(item, index)}
            >
              <div
                className={`flip-card-inner ${
                  destroyCardIndex === index ? "flipped" : ""
                }`}
              >
                <div className="flip-card-front">
                  <div
                    className="d-flex justify-content-center align-items-center"
                    style={{ width: 150, height: 200, fontSize: "25px" }}
                  >
                    ?
                  </div>
                </div>
                <>
                  <div
                    className="flip-card-back"
                    style={{
                      backgroundColor: "none",
                      background: `${
                        isCardClicked && destroyCardIndex === index && item.id
                          ? ""
                          : "#2980b9"
                      }`,
                    }}
                  >
                    {isCardClicked && destroyCardIndex === index && item.id && (
                      <>
                        <div
                          className={`glass-panel ${cracked ? "cracked" : ""}`}
                        >
                          <img
                            src="/break_glass.svg"
                            style={{
                              position: "absolute",
                              left: "0",
                              top: "0",
                              zIndex: "2",
                              width: "100%",
                              height: "100%",
                            }}
                            alt=""
                            className=""
                          />
                          {shattered && (
                            <div className="shards-wrapper">
                              {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className={`shard shard-${i}`} />
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <h1>{item.name}</h1>
                    <p>{item.description}</p>
                  </div>
                </>
              </div>
            </div>
          ))}
        </div>
        <div className="p-2 bg-danger">
          {incorrectCards.map((item) => (
            <div key={`incorrect-${item.id}`}>
              <div className="fs-6">{item.name}</div>
            </div>
          ))}
        </div>

        <div className="p-2 bg-success">
          {correctCards.map((item) => (
            <div key={`correct-${item.id}`}>
              <div className="fs-6">{item.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FlipCardDemo;
