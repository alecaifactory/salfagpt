import { useState } from 'react';

export default function ChatInterfaceSimple({ userId }: { userId: string }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ text: string; from: 'user' | 'ai' }>>([]);

  const sendMessage = () => {
    if (!message.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { text: message, from: 'user' }]);
    
    // Mock AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        text: `Echo: ${message} (User ID: ${userId})`, 
        from: 'ai' 
      }]);
    }, 500);
    
    setMessage('');
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      fontFamily: 'system-ui, sans-serif',
      background: '#f5f5f5'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '20px', 
        background: '#fff', 
        borderBottom: '1px solid #ddd',
        fontWeight: 'bold',
        fontSize: '18px'
      }}>
        🤖 SalfaGPT Chat - Simple Test
      </div>

      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            marginTop: '100px',
            color: '#999',
            fontSize: '16px'
          }}>
            👋 Welcome! Send a message to start chatting.
            <br />
            <small>User ID: {userId}</small>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: msg.from === 'user' ? 'flex-end' : 'flex-start',
                background: msg.from === 'user' ? '#007bff' : '#fff',
                color: msg.from === 'user' ? '#fff' : '#000',
                padding: '12px 16px',
                borderRadius: '12px',
                maxWidth: '70%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {msg.text}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div style={{ 
        padding: '20px', 
        background: '#fff', 
        borderTop: '1px solid #ddd',
        display: 'flex',
        gap: '10px'
      }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: '12px 24px',
            background: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

