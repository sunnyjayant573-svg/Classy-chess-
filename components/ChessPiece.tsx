
import React from 'react';
import { PieceType, PieceColor } from '../types';

interface ChessPieceProps {
  type: PieceType;
  color: PieceColor;
}

const ChessPiece: React.FC<ChessPieceProps> = ({ type, color }) => {
  const getIconClass = () => {
    const base = color === 'w' ? 'far' : 'fas';
    switch (type) {
      case 'p': return `fa-chess-pawn`;
      case 'r': return `fa-chess-rook`;
      case 'n': return `fa-chess-knight`;
      case 'b': return `fa-chess-bishop`;
      case 'q': return `fa-chess-queen`;
      case 'k': return `fa-chess-king`;
      default: return '';
    }
  };

  const getThemeColors = () => {
    if (color === 'w') return 'text-slate-100 drop-shadow-sm';
    return 'text-slate-900 drop-shadow-md';
  };

  return (
    <div className={`text-4xl md:text-5xl lg:text-6xl flex items-center justify-center transition-transform hover:scale-110 cursor-grab active:cursor-grabbing ${getThemeColors()}`}>
      <i className={`fa-solid ${getIconClass()}`}></i>
    </div>
  );
};

export default ChessPiece;
