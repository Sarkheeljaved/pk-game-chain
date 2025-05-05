import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Image } from "react-bootstrap";
import { useSpeechSynthesis, VOICE_CONFIGS } from "./useSpeechSynthesis";
import "../styles/AdminDataPage.css";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  name: string;
  avatar?: string;
  voice?: string;
}

function AdminDataPage() {
  const navigate = useNavigate();
  const { speak } = useSpeechSynthesis();
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem("chat_users");
    return savedUsers ? JSON.parse(savedUsers) : [];
  });
  const [newUser, setNewUser] = useState<User>({
    id: "",
    name: "",
    avatar: "",
    voice: "default",
  });
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Load users from localStorage on component mount
  useEffect(() => {
    const savedUsers = localStorage.getItem("chat_users");
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
  }, []);

  // Save users to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("chat_users", JSON.stringify(users));
  }, [users]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        setNewUser((prev) => ({ ...prev, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const previewVoice = (voiceId: string) => {
    if (!newUser.name.trim()) return;
    speak(`Hello ${newUser.name}, this is my voice`, voiceId);
  };

  const handleAddUser = () => {
    if (!newUser.name.trim()) return;

    const userToAdd = {
      ...newUser,
      id: Date.now().toString(),
    };

    setUsers((prev) => [...prev, userToAdd]);
    resetForm();
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setNewUser({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      voice: user.voice || "default",
    });
    previewVoice(`${user?.voice}`);
    if (user.avatar) {
      setAvatarPreview(user.avatar);
    }
  };

  const handleUpdateUser = () => {
    if (!newUser.name.trim() || !editingUserId) return;

    setUsers((prev) =>
      prev.map((user) => (user.id === editingUserId ? { ...newUser } : user))
    );
    resetForm();
    setEditingUserId(null);
  };

  const handleRemoveUser = (id: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
  };

  const resetForm = () => {
    setNewUser({ id: "", name: "", avatar: "", voice: "default" });
    setAvatarPreview("");
  };

  const cancelEdit = () => {
    resetForm();
    setEditingUserId(null);
  };

  const startChat = () => {
    navigate("/chat-Page");
  };

  return (
    <div className="admin-page">
      <Modal.Dialog centered size="lg">
        <Modal.Header>
          <Modal.Title>Manage Users</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="user-form mb-4">
            <h4>{editingUserId ? "Edit User" : "Add New User"}</h4>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                placeholder="Enter user name"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Avatar</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />
              {avatarPreview && (
                <Image
                  src={avatarPreview}
                  roundedCircle
                  className="mt-2 avatar-preview"
                />
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Voice</Form.Label>
              <div className="voice-options">
                {VOICE_CONFIGS.map((voice) => (
                  <div
                    key={voice.id}
                    className={`voice-option ${
                      newUser.voice === voice.id ? "selected" : ""
                    }`}
                    onClick={() => setNewUser({ ...newUser, voice: voice.id })}
                    onMouseEnter={() => previewVoice(voice.id)}
                  >
                    <div className="voice-name">{voice.name}</div>
                    <small className="voice-description">
                      {voice.voiceURI || "System Default"}
                    </small>
                  </div>
                ))}
              </div>
              <small className="text-muted">
                Hover to preview, click to select
              </small>
            </Form.Group>
            <div className="d-flex gap-2">
              {editingUserId ? (
                <>
                  <Button variant="primary" onClick={handleUpdateUser}>
                    Update User
                  </Button>
                  <Button variant="outline-secondary" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button variant="primary" onClick={handleAddUser}>
                  Add User
                </Button>
              )}
            </div>
          </div>

          <div className="user-list">
            <h4>Current Users ({users.length})</h4>
            {users.length === 0 ? (
              <p>No users added yet</p>
            ) : (
              <ul className="list-unstyled">
                {users.map((user) => (
                  <li
                    key={user.id}
                    className="d-flex align-items-center mb-2 user-item"
                  >
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        roundedCircle
                        width="40"
                        height="40"
                        className="me-2"
                      />
                    ) : (
                      <div className="avatar-placeholder me-2">
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <span className="me-auto">{user.name}</span>
                    <span className="me-2 text-muted">
                      {VOICE_CONFIGS.find((v) => v.id === user.voice)?.name ||
                        "Default"}
                    </span>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleRemoveUser(user.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="success"
            onClick={startChat}
            disabled={users.length === 0}
          >
            Start Chat ({users.length} users)
          </Button>
        </Modal.Footer>
      </Modal.Dialog>
    </div>
  );
}

export default AdminDataPage;
