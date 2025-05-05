import React, { useState, useEffect, useRef } from "react";
import "../styles/ChatPage.css";
import { Form, Stack } from "react-bootstrap";
import { FaEdit, FaTrash, FaCheck, FaTimes } from "react-icons/fa";

interface Message {
  id: string;
  text: string;
  sender: string;
  receivers: string[]; // Changed from receiver to receivers
  timestamp: Date;
  edited?: boolean;
}

interface User {
  id: string;
  name: string;
  avatar?: string;
  voice?: string;
}

const CHAT_STORAGE_KEY = "multi_user_chat_app_data";

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const ChatApp: React.FC = () => {
  const [users] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem("chat_users");
    return savedUsers ? JSON.parse(savedUsers) : [];
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(users[0]);
  const [currentPage, setCurrentPage] = useState(0);
  const [showChat, setShowChat] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const storageListenerRef = useRef<() => void>(() => {});

  // Constants for pagination
  const MESSAGES_PER_PAGE = 3;
  const filteredMessages = messages; // Show all messages without filtering
  const totalPages = Math.ceil(filteredMessages.length / MESSAGES_PER_PAGE);
  const paginatedMessages = filteredMessages.slice(
    currentPage * MESSAGES_PER_PAGE,
    (currentPage + 1) * MESSAGES_PER_PAGE
  );

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    loadMessages();

    const loadVoices = () => {
      voicesRef.current = synthRef.current?.getVoices() || [];
      console.log("Available voices:", voicesRef.current);
    };

    synthRef.current.onvoiceschanged = loadVoices;
    loadVoices();

    storageListenerRef.current = () => loadMessages();
    window.addEventListener("storage", storageListenerRef.current);

    return () => {
      if (synthRef.current?.speaking) {
        synthRef.current.cancel();
      }
      window.removeEventListener("storage", storageListenerRef.current);
      synthRef.current!.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    speakMessages();
  }, [currentPage]);

  const loadMessages = () => {
    const savedData = localStorage.getItem(CHAT_STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData.messages) {
          const loadedMessages = parsedData.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            receivers: msg.receivers || [msg.receiver].filter(Boolean) // Backward compatibility
          }));
          setMessages(loadedMessages);
        }
      } catch (e) {
        console.error("Failed to parse saved messages", e);
      }
    }
  };

  const saveMessages = (msgs: Message[]) => {
    const dataToSave = {
      messages: msgs.map((msg) => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      })),
    };
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(dataToSave));
    window.dispatchEvent(new Event("storage"));
  };

  const speakMessages = () => {
    if (!synthRef.current) return;

    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }

    paginatedMessages.forEach((msg) => {
      const sender = users.find((u) => u.id === msg.sender);
      if (!sender) return;

      const textToSpeak = `${sender.name} says: ${msg.text}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      // Apply voice settings
      const voiceSettings = {
        mature: { rate: 0.85, pitch: 0.7, voiceName: "Microsoft David" },
        young: { rate: 1.2, pitch: 1.3, voiceName: "Microsoft Mark" },
        female1: { rate: 1.0, pitch: 1.4, voiceName: "Microsoft Zira" },
        female2: {
          rate: 1.1,
          pitch: 1.5,
          voiceName: "Google UK English Female",
        },
        default: { rate: 1.0, pitch: 1.0, voiceName: null },
      };

      const voiceType = sender.voice || "default";
      const config =
        voiceSettings[voiceType as keyof typeof voiceSettings] ||
        voiceSettings.default;

      utterance.rate = config.rate;
      utterance.pitch = config.pitch;

      // Try to find matching system voice
      if (config.voiceName) {
        const matchingVoice = voicesRef.current.find((v) =>
          v.name.includes(config.voiceName!)
        );
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      synthRef.current!.speak(utterance);
    });
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === "" || selectedUsers.length === 0) return;

    const newMessageObj: Message = {
      id: `${Date.now()}`,
      text: newMessage,
      sender: currentUser.id,
      receivers: selectedUsers,
      timestamp: new Date(),
      edited: false,
    };

    const updatedMessages = [...messages, newMessageObj];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
    setNewMessage("");

    setCurrentPage(
      Math.ceil(updatedMessages.length / MESSAGES_PER_PAGE) - 1
    );
  };

  const handleSkip = () => {
    synthRef.current?.cancel();
    setShowChat(false);
  };

  const handleStartGame = () => {
    setShowChat(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const goToNextPage = () => {
    const newPage = Math.min(currentPage + 1, totalPages - 1);
    setCurrentPage(newPage);
  };

  const goToPrevPage = () => {
    const newPage = Math.max(currentPage - 1, 0);
    setCurrentPage(newPage);
  };

  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
    setCurrentPage(0);
    synthRef.current?.cancel();
  };

  const getUserAvatar = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.avatar || "https://via.placeholder.com/40";
  };

  const handleEditMessage = (message: Message) => {
    if (message.sender !== currentUser.id) return;
    setEditingMessageId(message.id);
    setEditText(message.text);
  };

  const handleSaveEdit = () => {
    if (!editingMessageId) return;

    const updatedMessages = messages.map((msg) => {
      if (msg.id === editingMessageId) {
        return {
          ...msg,
          text: editText,
          edited: true,
          timestamp: new Date(),
        };
      }
      return msg;
    });

    setMessages(updatedMessages);
    saveMessages(updatedMessages);
    setEditingMessageId(null);
    setEditText("");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const handleDeleteMessage = (messageId: string) => {
    const messageToDelete = messages.find(msg => msg.id === messageId);
    if (!messageToDelete || messageToDelete.sender !== currentUser.id) return;

    const updatedMessages = messages.filter((msg) => msg.id !== messageId);
    setMessages(updatedMessages);
    saveMessages(updatedMessages);

    if (paginatedMessages.length === 1 && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Stack direction="horizontal" className="chat-app">
      <div className="left_menu">
        <div className="user-selection">
          <h3 className="w-100 text-dark">Current User: {currentUser.name}</h3>
          <Form.Select
            className="form-control"
            value={currentUser.id}
            onChange={(e) => {
              setCurrentUser(
                users.find((u) => u.id === e.target.value) || users[0]
              );
              setSelectedUsers([])
            }}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Form.Select>
          <h3 className="w-100 text-dark">Select Recipients:</h3>
          <div className="user-list">
            {users
              .filter((user) => user.id !== currentUser.id)
              .map((user) => (
                <div key={user.id} className="user-item">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`user-${user.id}`}
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                  />
                  <label
                    htmlFor={`user-${user.id}`}
                    className="form-check-label fs-4"
                  >
                    {user.name}
                  </label>
                </div>
              ))}
          </div>
          <button
            className="btn btn-danger px-5 mt-2 w-100"
            onClick={handleClearChat}
            disabled={messages.length === 0}
          >
            Clear Chat
          </button>
        </div>

        <div className="d-flex flex-column gap-4 w-100">
          <textarea
            className="form-control"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
          />
          <button
            className="btn btn-success px-5"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || selectedUsers.length === 0}
          >
            Send
          </button>
        </div>
      </div>
      <div className="chat_side">
        {showChat ? (
          <div className="custom-shape">
            <>
              <div className="corners_customshape-1"></div>
              <div className="corners_customshape-2"></div>
              <div className="corners_customshape-3"></div>
              <div className="corners_customshape-4"></div>
            </>
            <div className="messages">
              {paginatedMessages.length > 0 ? (
                paginatedMessages.map((message, index) => {
                  const sender = users.find((u) => u.id === message.sender);
                  const isCurrentUserMessage = message.sender === currentUser.id;
                  const isEditing = editingMessageId === message.id;
                  const isEvenIndex = index % 2 === 0;

                  return (
                    <React.Fragment key={`${message.id}-${index}`}>
                      <div
                        className="chat_with_icons"
                        style={{
                          justifyContent: isEvenIndex ? "end" : "start",
                        }}
                      >
                        {!isEvenIndex && (
                          <img
                            src={getUserAvatar(message.sender)}
                            alt={sender?.name}
                            className="rounded-circle"
                            width="40"
                            height="40"
                          />
                        )}
                        <div
                          className={`userchat ${isEvenIndex ? "sent" : "received"}`}
                        >
                          <div className="message-header">
                            <div className="w-100 text-start d-flex gap-3 flex-row flex-wrap justify-content-between align-items-center">
                              <div style={{ fontSize: "14.2px" }}>
                                <strong>{sender?.name}</strong>
                                {message.receivers.length > 0 && (
                                  <span className="text-muted" style={{ fontSize: "0.8em" }}>
                                    {" "}
                                    to {message.receivers
                                      .map(id => users.find(u => u.id === id)?.name)
                                      .filter(Boolean)
                                      .join(", ")}
                                  </span>
                                )}
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="timestamp"
                                  style={{ fontSize: "14.2px" }}
                                >
                                  {formatTime(message.timestamp)}
                                </div>
                                {isCurrentUserMessage && (
                                  <div className="message-actions">
                                    <button
                                      className="btn btn-sm p-0"
                                      onClick={() => handleEditMessage(message)}
                                    >
                                      <FaEdit size={12} />
                                    </button>
                                    <button
                                      className="btn btn-sm p-0 ms-1"
                                      onClick={() =>
                                        handleDeleteMessage(message.id)
                                      }
                                    >
                                      <FaTrash size={12} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            {isEditing ? (
                              <div className="d-flex flex-column">
                                <textarea
                                  className="form-control mb-2"
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  autoFocus
                                />
                                <div className="d-flex justify-content-end gap-2">
                                  <button
                                    className="btn btn-success btn-sm"
                                    onClick={handleSaveEdit}
                                  >
                                    <FaCheck />
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={handleCancelEdit}
                                  >
                                    <FaTimes />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="message-text">{message.text}</div>
                            )}
                            {message.edited && !isEditing && (
                              <div className="edited-indicator">edited</div>
                            )}
                          </div>
                          {isEvenIndex ? (
                            <img
                              src="/chatbox_corner_right.svg"
                              alt=""
                              className="chatbox_corner_right"
                            />
                          ) : (
                            <img
                              src="/chatbox_corner_left.svg"
                              alt=""
                              className="chatbox_corner_left"
                            />
                          )}
                        </div>
                        {isEvenIndex && (
                          <img
                            src={getUserAvatar(message.sender)}
                            alt={sender?.name}
                            className="rounded-circle"
                            width="40"
                            height="40"
                          />
                        )}
                      </div>
                    </React.Fragment>
                  );
                })
              ) : (
                <div className="no-messages w-100 text-center text-muted">
                  No messages to display
                </div>
              )}
            </div>
            <div className="pagination-controls">
              <button
                className="btn rounded-pill px-4 button1"
                onClick={handleSkip}
              >
                Skip
              </button>
              <button
                className="btn rounded-pill px-4 button1"
                onClick={goToPrevPage}
                disabled={currentPage === 0}
              >
                Previous
              </button>
              <button
                className="btn rounded-pill px-4 button2"
                onClick={goToNextPage}
                disabled={currentPage >= totalPages - 1 || totalPages === 0}
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="start-game-container">
            <button
              className="btn btn-primary btn-lg start-game-button"
              onClick={handleStartGame}
            >
              Start Game
            </button>
          </div>
        )}
      </div>
    </Stack>
  );
};

export default ChatApp;