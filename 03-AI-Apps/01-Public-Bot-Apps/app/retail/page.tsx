'use client';

import React from 'react';

export default function RetailPage() {
  const products = [
    {
      id: 1,
      name: "Runner Pro Sneakers",
      price: "$129.99",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80"
    },
    {
      id: 2,
      name: "Noise-Cancel Headphones",
      price: "$199.99",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80"
    },
    {
      id: 3,
      name: "Waterproof Jacket",
      price: "$159.99",
      image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=500&q=80"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold tracking-tight">🛒 NovaRetail Store</span>
          </div>
          <nav className="hidden md:flex space-x-6 text-sm font-medium">
            <a href="#" className="hover:text-indigo-200 transition">New Arrivals</a>
            <a href="#" className="hover:text-indigo-200 transition">Deals</a>
            <a href="#" className="hover:text-indigo-200 transition">Support</a>
          </nav>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Autumn Collection 2026</h1>
          <p className="text-slate-600">Discover top-rated electronic items and lifestyle products.</p>
        </div>

        {/* Cuadrícula de Productos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
              <div className="h-64 overflow-hidden bg-slate-100">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
                <p className="text-indigo-600 font-bold mt-1">{product.price}</p>
                <button className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium transition">
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer Generico */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
          <span>© 2026 NovaRetail Store. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}