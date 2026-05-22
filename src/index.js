import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import { GameRoom } from './GameRoom';
const SERVER_URL = 'https://stream-sabotage.onrender.com';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GameRoom />
  </React.StrictMode>
);
