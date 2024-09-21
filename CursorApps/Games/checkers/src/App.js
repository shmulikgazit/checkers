import './App.css';
import { useState } from 'react';

function App() {
  const createInitialBoard = () => {
    const initialBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let row = 0; row < 3; row++) {
      for (let col = (row % 2); col < 8; col += 2) {
        initialBoard[row][col] = '⚫'; // דמות שחורה
      }
    }
    for (let row = 5; row < 8; row++) {
      for (let col = (row % 2); col < 8; col += 2) {
        initialBoard[row][col] = '⚪'; // דמות לבנה
      }
    }
    return initialBoard;
  };

  const [board, setBoard] = useState(createInitialBoard());
  const [draggingPiece, setDraggingPiece] = useState(null);
  const [currentTurn, setCurrentTurn] = useState('⚪'); // התור הנוכחי (לבן מתחיל)
  const [flashTiles, setFlashTiles] = useState([]); // דמויות שצריך להבהיר

  const resetBoard = () => {
    setBoard(createInitialBoard());
    setDraggingPiece(null);
    setCurrentTurn('⚪'); // איפוס התור
    setFlashTiles([]); // נקה את הדמויות המבהירות
  };

  const renderBoard = () => {
    return board.map((row, rowIndex) => (
      <div key={rowIndex} className="row">
        {row.map((square, colIndex) => {
          const isBlackSquare = (rowIndex + colIndex) % 2 === 1;
          const isFlashing = flashTiles.some(([r, c]) => r === rowIndex && c === colIndex);
          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`square ${square === '⚫' ? 'black' : square === '⚪' ? 'white' : ''} ${isBlackSquare ? 'black-square' : 'white-square'} ${isFlashing ? 'flashing' : ''}`}
              onDragOver={(e) => e.preventDefault()} // מאפשר לגרור
              onDrop={() => handleDrop(rowIndex, colIndex)}
              draggable={square !== null} // אפשר לגרור רק אם יש דמות
              onDragStart={(e) => handleDragStart(e, rowIndex, colIndex)}
              onDragEnd={() => setDraggingPiece(null)} // ננקה את הבחירה בסוף הגרירה
            >
              {square || ''} {/* הצג דמות גם אם נגררת */}
            </div>
          );
        })}
      </div>
    ));
  };

  const handleDragStart = (e, rowIndex, colIndex) => {
    setDraggingPiece([rowIndex, colIndex]);
    e.dataTransfer.setData('text/plain', ''); // נדרש כדי להפעיל את הגרירה
  };

  const handleDrop = (toRow, toCol) => {
    if (draggingPiece) {
      const [fromRow, fromCol] = draggingPiece;
      const piece = board[fromRow][fromCol];

      // בדוק אם התור הנוכחי תואם לדמות
      if ((currentTurn === '⚪' && piece === '⚪') || (currentTurn === '⚫' && piece === '⚫')) {
        const jumpMoves = getJumpMoves(fromRow, fromCol, piece);
        if (jumpMoves.length > 0) {
          // אם יש קפיצות, השחקן חייב לבצע קפיצה
          if (isValidJumpMove(fromRow, fromCol, toRow, toCol, piece)) {
            movePiece(fromRow, fromCol, toRow, toCol);
            setCurrentTurn(currentTurn === '⚪' ? '⚫' : '⚪');
          } else {
            // אם השחקן מנסה לבצע מהלך שאינו קפיצה, הצג את הדמויות שיכולות לקפוץ
            setFlashTiles(jumpMoves);
          }
        } else if (isValidMove(fromRow, fromCol, toRow, toCol, piece)) {
          // אם אין קפיצות, אפשר לבצע מהלך רגיל
          movePiece(fromRow, fromCol, toRow, toCol);
          setCurrentTurn(currentTurn === '⚪' ? '⚫' : '⚪');
        }
      }
      setDraggingPiece(null); // ננקה את הבחירה
    }
  };

  const movePiece = (fromRow, fromCol, toRow, toCol) => {
    const newBoard = board.map(row => row.slice());
    const piece = newBoard[fromRow][fromCol];

    newBoard[toRow][toCol] = piece; // העבר את הדמות
    newBoard[fromRow][fromCol] = null; // נקה את המקום הקודם

    // בדוק אם יש קפיצה
    if (Math.abs(fromRow - toRow) === 2) {
      const jumpedRow = (fromRow + toRow) / 2;
      const jumpedCol = (fromCol + toCol) / 2;
      newBoard[jumpedRow][jumpedCol] = null; // הסר את הדמות שנקפצה
    }

    // בדוק אם יש להכתיר את הדמות
    if (toRow === 0 && piece === '⚪') {
      newBoard[toRow][toCol] = '⚪👑'; // הכתרה לדמות לבנה
    } else if (toRow === 7 && piece === '⚫') {
      newBoard[toRow][toCol] = '⚫👑'; // הכתרה לדמות שחורה
    }

    setBoard(newBoard);
  };

  const isValidMove = (fromRow, fromCol, toRow, toCol, piece) => {
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;

    // בדוק אם התנועה היא באלכסון
    if (Math.abs(rowDiff) !== Math.abs(colDiff) || Math.abs(rowDiff) > 2) {
      return false;
    }

    // בדוק אם התנועה היא קפיצה
    if (Math.abs(rowDiff) === 2) {
      const jumpedRow = (fromRow + toRow) / 2;
      const jumpedCol = (fromCol + toCol) / 2;
      const jumpedPiece = board[jumpedRow][jumpedCol];
      if (!jumpedPiece || jumpedPiece === piece) {
        return false; // אין דמות לקפוץ מעליה או קפיצה על דמות מאותו צבע
      }
    }

    return true; // התנועה חוקית
  };

  const isValidJumpMove = (fromRow, fromCol, toRow, toCol, piece) => {
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;

    // בדוק אם התנועה היא קפיצה
    if (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 2) {
      const jumpedRow = (fromRow + toRow) / 2;
      const jumpedCol = (fromCol + toCol) / 2;
      const jumpedPiece = board[jumpedRow][jumpedCol];
      return jumpedPiece && jumpedPiece !== piece; // יש דמות לקפוץ מעליה
    }
    return false; // לא קפיצה חוקית
  };

  const getJumpMoves = (row, col, piece) => {
    const jumpMoves = [];
    const directions = [
      { row: 2, col: 2 }, { row: 2, col: -2 },
      { row: -2, col: 2 }, { row: -2, col: -2 }
    ];

    directions.forEach(({ row: r, col: c }) => {
      const toRow = row + r;
      const toCol = col + c;
      const jumpedRow = row + r / 2;
      const jumpedCol = col + c / 2;

      if (toRow >= 0 && toRow < 8 && toCol >= 0 && toCol < 8) {
        const jumpedPiece = board[jumpedRow][jumpedCol];
        if (jumpedPiece && jumpedPiece !== piece) {
          jumpMoves.push([toRow, toCol]); // הוסף את המהלך לקפיצה
        }
      }
    });

    return jumpMoves;
  };

  return (
    <div className="App">
      <button onClick={resetBoard} className="reset-button">איפוס</button>
      <div className="turn-indicator">תור: {currentTurn}</div> {/* הצגת התור */}
      <div className="board">
        {renderBoard()}
      </div>
    </div>
  );
}

export default App;
