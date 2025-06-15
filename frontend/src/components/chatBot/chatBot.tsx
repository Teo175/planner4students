
import React, { useState } from 'react';
import './chatBot.scss';
import apiService from '../../api/server/apiService';
import { FaCommentDots } from 'react-icons/fa';

const ChatBot: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Nu știi ce coordonator să alegi? Explică-mi ideea ta de aplicație și îți voi recomanda un profesor din cadrul universității.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleChat = () => setOpen(!open);

 const handleSend = async () => {
  if (!input.trim()) return;

  const newMessages = [...messages, { sender: 'user', text: input }];
  setMessages(newMessages);
  setInput('');
  setLoading(true);

  try {
    const reply = await apiService.chatWithBot(input);
    setMessages([...newMessages, { sender: 'bot', text: reply }]);
  } catch {
    setMessages([...newMessages, { sender: 'bot', text: 'Eroare la comunicarea cu serverul.' }]);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="floating-chat-container">
      {open && (
        <div className="chat-window">
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.sender}`}>{msg.text}</div>
            ))}
            {loading && <div className="message bot">Se generează răspunsul...</div>}
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="Scrie ideea ta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend}>Trimite</button>
          </div>
        </div>
      )}
      <button className="floating-button" onClick={toggleChat}>
           <FaCommentDots size={20} />
      </button>
      
    </div>
    
  );
};

export default ChatBot;
