import { useState } from 'react';

export default function ChatInterfaceMinimal({ userId }: { userId: string }) {
  const [message, setMessage] = useState('');

  return (
    <div className="h-full flex flex-col bg-slate-100 p-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">
        Flow Chat - Minimal Test
      </h1>
      <p className="text-slate-600 mb-4">User ID: {userId}</p>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
      />
      <p className="mt-4 text-sm text-slate-500">
        If you can see this, React is hydrating correctly! ✅
      </p>
    </div>
  );
}


