'use client';

import React, { useState } from 'react';

export default function RetailPage() {
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const t = {
    es: {
      brand: "🛒 NovaRetail Store",
      newArrivals: "Novedades",
      deals: "Ofertas",
      support: "Soporte",
      title: "Colección Otoño 2026",
      subtitle: "Descubre los mejores productos tecnológicos y de estilo de vida.",
      addToCart: "Añadir al Carrito",
      rights: "© 2026 NovaRetail Store. Todos los derechos reservados.",
      chatTitle: "Asistente IA NovaRetail",
      chatPlaceholder: "Escribe tu pregunta...",
      send: "Enviar",
      openChat: "💬 ¿Necesitas ayuda?",
      welcome: "¡Hola! Soy el asistente virtual de NovaRetail. ¿En qué puedo ayudarte hoy?"
    },
    en: {
      brand: "🛒 NovaRetail Store",
      newArrivals: "New Arrivals",
      deals: "Deals",
      support: "Support",
      title: "Autumn Collection 2026",
      subtitle: "Discover top-rated electronic items and lifestyle products.",
      addToCart: "Add to Cart",
      rights: "© 2026 NovaRetail Store. All rights reserved.",
      chatTitle: "NovaRetail AI Assistant",
      chatPlaceholder: "Type your message...",
      send: "Send",
      openChat: "💬 Need help?",
      welcome: "Hello! I am NovaRetail's AI Assistant. How can I help you today?"
    }
  };

  const currentT = t[lang];

  const products = [
    {
      id: 1,
      name: lang === 'es' ? "Zapatillas Runner Pro" : "Runner Pro Sneakers",
      price: "$129.99",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80"
    },
    {
      id: 2,
      name: lang === 'es' ? "Auriculares Cancelación Ruido" : "Noise-Cancel Headphones",
      price: "$199.99",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80"
    },
    {
      id: 3,
      name: lang === 'es' ? "Chaqueta Impermeable" : "Waterproof Jacket",
      price: "$159.99",
      image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=500&q=80"
    }
  ];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }]
        }),
      });

      const data = await response.json();
      const botResponse = data.choices?.[0]?.message?.content || 
        (lang === 'es' ? "No he podido procesar la respuesta." : "Failed to parse response.");

      setMessages(prev => [...prev, { role: 'assistant', content: botResponse }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: lang === 'es' ? "Error al conectar con la pasarela de seguridad Prisma AIRS." : "Error connecting to Prisma AIRS security gateway." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <span className="text-2xl font-bold tracking-tight">{currentT.brand}</span>
          
          <div className="flex items-center space-x-6">
            <nav className="hidden md:flex space-x-6 text-sm font-medium">
              <a href="#" className="hover:text-indigo-200 transition">{currentT.newArrivals}</a>
              <a href="#" className="hover:text-indigo-200 transition">{currentT.deals}</a>
              <a href="#" className="hover:text-indigo-200 transition">{currentT.support}</a>
            </nav>

            {/* Selector de Idioma */}
            <div className="flex items-center bg-indigo-700 p-1 rounded-lg border border-indigo-500">
              <button
                onClick={() => setLang('es')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${lang === 'es' ? 'bg-white text-indigo-700 shadow' : 'text-indigo-200 hover:text-white'}`}
              >
                ES
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${lang === 'en' ? 'bg-white text-indigo-700 shadow' : 'text-indigo-200 hover:text-white'}`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{currentT.title}</h1>
          <p className="text-slate-600">{currentT.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
              <div className="h-64 overflow-hidden bg-slate-100">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
                <p className="text-indigo-600 font-bold mt-1">{product.price}</p>
                <button className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium transition">
                  {currentT.addToCart}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
          <span>{currentT.rights}</span>
        </div>
      </footer>

      {/* Widget de Chat Flotante (Prisma AIRS Secured) */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isChatOpen ? (
          <button
            onClick={() => setIsChatOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-full shadow-lg font-medium flex items-center space-x-2 transition transform hover:scale-105"
          >
            <span>{currentT.openChat}</span>
          </button>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 md:w-96 flex flex-col h-[480px] overflow-hidden">
            {/* Header Chat */}
            <div className="bg-indigo-600 text-white px-4 py-3 flex justify-between items-center">
              <span className="font-semibold text-sm">{currentT.chatTitle}</span>
              <button onClick={() => setIsChatOpen(false)} className="text-indigo-200 hover:text-white font-bold text-lg">
                ✕
              </button>
            </div>

            {/* Mensajes */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-slate-700">
                {currentT.welcome}
              </div>
              {messages.map((m, index) => (
                <div key={index} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-800'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="text-slate-400 text-xs italic">{lang === 'es' ? "Prisma AIRS inspeccionando petición..." : "Prisma AIRS inspecting request..."}</div>
              )}
            </div>

            {/* Formulario */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={currentT.chatPlaceholder}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {currentT.send}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}