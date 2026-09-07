'use client';

import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function RetailPage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/retail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await response.json();

      if (data.choices?.[0]?.message) {
        setMessages([...updatedMessages, data.choices[0].message]);
      } else {
        setMessages([
          ...updatedMessages,
          { role: 'assistant', content: 'Sorry, I received an invalid response from the gateway.' },
        ]);
      }
    } catch (error) {
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: 'Error: Unable to connect to the AI Gateway.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Store Navigation Header */}
      <header className="bg-indigo-600 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold">🛒 NovaRetail Store</h1>
        <nav className="space-x-4 text-sm">
          <a href="#" className="hover:underline">New Arrivals</a>
          <a href="#" className="hover:underline">Deals</a>
          <a href="#" className="hover:underline">Support</a>
        </nav>
      </header>

      {/* Main Content & Product Grid */}
      <main className="max-w-6xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Autumn Collection 2026</h2>
          <p className="text-gray-600">Discover top-rated electronic items and lifestyle products.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Runner Pro Sneakers', 'Noise-Cancel Headphones', 'Waterproof Jacket'].map((product, i) => (
            <div key={i} className="bg-white rounded-lg shadow border border-gray-100 p-4 flex flex-col justify-between">
              <div className="h-40 bg-gray-200 rounded-md mb-4 flex items-center justify-center text-gray-400">
                [Product Image {i + 1}]
              </div>
              <h3 className="font-bold text-lg mb-1">{product}</h3>
              <p className="text-indigo-600 font-semibold mb-4">$99.99</p>
              <button className="bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition">
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Floating Chat Widget */}
      <div className="fixed bottom-6 right-6">
        {!chatOpen ? (
          <button
            onClick={() => setChatOpen(true)}
            className="bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 flex items-center gap-2"
          >
            💬 Need help?
          </button>
        ) : (
          <div className="bg-white w-96 h-[500px] rounded-xl shadow-2xl border border-gray-200 flex flex-col">
            {/* Chat Header */}
            <div className="bg-indigo-600 text-white p-4 rounded-t-xl flex justify-between items-center">
              <span className="font-bold">Retail Virtual Assistant</span>
              <button onClick={() => setChatOpen(false)} className="text-xl">✕</button>
            </div>

            {/* Chat Messages Container */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.length === 0 && (
                <p className="text-xs text-gray-400 text-center mt-4">
                  Ask me anything about products, orders, or stock.
                </p>
              )}
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg text-sm max-w-[80%] ${
                    m.role === 'user'
                      ? 'bg-indigo-100 ml-auto text-indigo-900'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {loading && <p className="text-xs text-gray-400">Assistant is processing...</p>}
            </div>

            {/* Chat Input Field */}
            <div className="p-3 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 border rounded p-2 text-sm focus:outline-none focus:border-indigo-600"
              />
              <button onClick={sendMessage} className="bg-indigo-600 text-white px-4 rounded text-sm font-bold">
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}