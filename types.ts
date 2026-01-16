
export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export interface Square {
  row: number;
  col: number;
}

export interface Move {
  from: string;
  to: string;
  piece: Piece;
  captured?: Piece;
  promotion?: PieceType;
  san: string;
}

export interface GameState {
  fen: string;
  history: Move[];
  turn: PieceColor;
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  capturedByWhite: Piece[];
  capturedByBlack: Piece[];
}

export interface AIMoveResponse {
  move: string;
  explanation: string;
}
