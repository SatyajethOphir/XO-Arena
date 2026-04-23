function createGame(player1, player2) {
  return {
    players: [player1, player2],
    board: Array(9).fill(null),
    turn: 0,
    active: true
  };
}

function checkWinner(board) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  for (let [a,b,c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function isDraw(board) {
  return board.every(cell => cell !== null);
}

module.exports = { createGame, checkWinner, isDraw };