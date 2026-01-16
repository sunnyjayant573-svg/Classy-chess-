
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Chess, Move as ChessMove } from 'chess.js';
import ChessPiece from './components/ChessPiece';
import { getBestMove } from './services/geminiService';
import { Piece, PieceColor, PieceType } from './types';

const App: React.FC = () => {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [capturedByWhite, setCapturedByWhite] = useState<Piece[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<Piece[]>([]);

  // Board constants
  const rows = ['8', '7', '6', '5', '4', '3', '2', '1'];
  const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setSelectedSquare(null);
    setValidMoves([]);
    setAiAnalysis(null);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
  };

  const handleCapture = useCallback((move: ChessMove) => {
    if (move.captured) {
      const piece: Piece = { type: move.captured as PieceType, color: move.color === 'w' ? 'b' : 'w' };
      if (move.color === 'w') {
        setCapturedByWhite(prev => [...prev, piece]);
      } else {
        setCapturedByBlack(prev => [...prev, piece]);
      }
    }
  }, []);

  const makeMove = useCallback((moveData: string | { from: string; to: string; promotion?: string }) => {
    try {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move(moveData);
      
      if (move) {
        setGame(gameCopy);
        handleCapture(move);
        setSelectedSquare(null);
        setValidMoves([]);
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }, [game, handleCapture]);

  const onSquareClick = (square: string) => {
    if (game.isGameOver() || isAiThinking) return;

    // If a piece is already selected, try to move
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      const moveSuccess = makeMove({
        from: selectedSquare,
        to: square,
        promotion: 'q', // default promotion to queen
      });

      if (moveSuccess) return;
    }

    // Otherwise, select the piece
    const piece = game.get(square as any);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      const moves = game.moves({ square: square as any, verbose: true });
      setValidMoves(moves.map(m => m.to));
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const triggerAiMove = async () => {
    if (game.isGameOver() || isAiThinking) return;

    setIsAiThinking(true);
    setAiAnalysis("Analyzing board state...");

    try {
      const fen = game.fen();
      const history = game.history();
      const aiResponse = await getBestMove(fen, history);

      if (aiResponse.move) {
        setAiAnalysis(aiResponse.explanation);
        // Delay slightly for natural feel
        setTimeout(() => {
          const move = makeMove(aiResponse.move);
          if (!move) {
            setAiAnalysis("AI suggested an illegal move. Fallback logic triggered.");
            // Basic random fallback if AI fails
            const randomMoves = game.moves();
            if (randomMoves.length > 0) {
              makeMove(randomMoves[Math.floor(Math.random() * randomMoves.length)]);
            }
          }
          setIsAiThinking(false);
        }, 800);
      } else {
        setIsAiThinking(false);
        setAiAnalysis("AI couldn't find a move.");
      }
    } catch (error) {
      console.error(error);
      setIsAiThinking(false);
      setAiAnalysis("Error communicating with AI.");
    }
  };

  const undoMove = () => {
    const gameCopy = new Chess(game.fen());
    gameCopy.undo();
    setGame(gameCopy);
    setAiAnalysis(null);
  };

  const getStatusMessage = () => {
    if (game.isCheckmate()) return `Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`;
    if (game.isDraw()) return "Draw!";
    if (game.isCheck()) return "Check!";
    return `${game.turn() === 'w' ? "White's" : "Black's"} turn`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-900 text-slate-100">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar: Info & History */}
        <div className="lg:col-span-3 order-2 lg:order-1 space-y-6">
          <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-history text-indigo-400"></i> History
            </h2>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {game.history().length === 0 ? (
                <p className="text-slate-500 text-sm italic">No moves yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {game.history().map((move, i) => (
                    <div key={i} className={`p-2 rounded ${i % 2 === 0 ? 'bg-slate-700/50' : 'bg-slate-700'}`}>
                      <span className="text-slate-500 mr-2">{Math.floor(i / 2) + 1}.</span>
                      <span className="font-medium text-slate-200">{move}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-trophy text-amber-400"></i> Captured
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-2 font-semibold">By White</p>
                <div className="flex flex-wrap gap-1 min-h-[32px]">
                  {capturedByWhite.map((p, i) => (
                    <div key={i} className="text-xl opacity-80"><ChessPiece type={p.type} color={p.color} /></div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-2 font-semibold">By Black</p>
                <div className="flex flex-wrap gap-1 min-h-[32px]">
                  {capturedByBlack.map((p, i) => (
                    <div key={i} className="text-xl opacity-80"><ChessPiece type={p.type} color={p.color} /></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center: The Board */}
        <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col items-center">
          <div className="mb-6 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              GRANDMASTER AI
            </h1>
            <div className={`mt-2 px-4 py-1 rounded-full text-sm font-bold border ${game.isCheck() ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
              {getStatusMessage()}
            </div>
          </div>

          <div className="relative chess-board-shadow rounded-lg overflow-hidden border-[12px] border-slate-800">
            <div className="grid grid-cols-8 grid-rows-8 w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] lg:w-[600px] lg:h-[600px]">
              {rows.map((row, rIdx) => (
                cols.map((col, cIdx) => {
                  const square = `${col}${row}`;
                  const isBlack = (rIdx + cIdx) % 2 === 1;
                  const piece = game.get(square as any);
                  const isValidMove = validMoves.includes(square);
                  const isSelected = selectedSquare === square;
                  const isLastMove = game.history({ verbose: true }).slice(-1)[0]?.to === square || game.history({ verbose: true }).slice(-1)[0]?.from === square;

                  return (
                    <div
                      key={square}
                      onClick={() => onSquareClick(square)}
                      className={`
                        relative flex items-center justify-center cursor-pointer transition-all duration-200
                        ${isBlack ? 'bg-slate-700' : 'bg-slate-400'}
                        ${isSelected ? 'ring-4 ring-indigo-500 ring-inset z-10' : ''}
                        ${isLastMove ? 'after:content-[""] after:absolute after:inset-0 after:bg-amber-400/20' : ''}
                      `}
                    >
                      {/* Coordinates */}
                      {cIdx === 0 && (
                        <span className={`absolute top-0.5 left-0.5 text-[10px] font-bold ${isBlack ? 'text-slate-400' : 'text-slate-600'}`}>
                          {row}
                        </span>
                      )}
                      {rIdx === 7 && (
                        <span className={`absolute bottom-0.5 right-0.5 text-[10px] font-bold ${isBlack ? 'text-slate-400' : 'text-slate-600'}`}>
                          {col}
                        </span>
                      )}

                      {/* Valid move indicator */}
                      {isValidMove && (
                        <div className={`absolute w-3 h-3 md:w-5 md:h-5 rounded-full ${piece ? 'border-4 border-black/20' : 'bg-black/20'}`}></div>
                      )}

                      {/* Piece */}
                      {piece && <ChessPiece type={piece.type as PieceType} color={piece.color as PieceColor} />}
                    </div>
                  );
                })
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <button 
              onClick={resetGame}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-all flex items-center gap-2 border border-slate-700"
            >
              <i className="fas fa-rotate-left"></i> New Game
            </button>
            <button 
              onClick={undoMove}
              disabled={game.history().length === 0}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 rounded-xl font-bold transition-all flex items-center gap-2 border border-slate-700"
            >
              <i className="fas fa-undo"></i> Undo
            </button>
            <button 
              onClick={triggerAiMove}
              disabled={isAiThinking || game.isGameOver()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
            >
              {isAiThinking ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Thinking...
                </>
              ) : (
                <>
                  <i className="fas fa-robot"></i> AI Move
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Sidebar: AI Analysis */}
        <div className="lg:col-span-3 order-3 space-y-6">
          <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700 h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-brain text-purple-400"></i> AI Analysis
            </h2>
            <div className="flex-1 flex flex-col justify-center text-center p-4">
              {aiAnalysis ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="text-3xl mb-4 text-indigo-400">
                    <i className="fas fa-quote-left opacity-50"></i>
                  </div>
                  <p className="text-slate-300 leading-relaxed italic">
                    "{aiAnalysis}"
                  </p>
                  <div className="text-3xl mt-4 text-indigo-400 text-right">
                    <i className="fas fa-quote-right opacity-50"></i>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 flex flex-col items-center">
                  <i className="fas fa-chess-knight text-5xl mb-4 opacity-20"></i>
                  <p className="text-sm">Make a move or click AI Move for grandmaster insights.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
      
      <footer className="mt-12 text-slate-500 text-sm">
        Built with <span className="text-red-500">♥</span> using Gemini 3 & React
      </footer>
    </div>
  );
};

export default App;
