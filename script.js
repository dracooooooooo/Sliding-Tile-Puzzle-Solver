class PuzzleSolver {
    constructor() {
        this.size = 3;
        this.board = [];
        this.emptyPos = { row: 2, col: 2 };
        this.moves = 0;
        this.startTime = 0;
        this.timer = null;
        this.isSolving = false;
        this.init();
    }

    init() {
        this.generateSolvedBoard();
        this.updateBoardDisplay();
        this.setupEventListeners();
        this.startTimer();
    }

    generateSolvedBoard() {
        this.board = [];
        let num = 1;
        for (let i = 0; i < this.size; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.size; j++) {
                if (i === this.size - 1 && j === this.size - 1) {
                    this.board[i][j] = 0;
                    this.emptyPos = { row: i, col: j };
                } else {
                    this.board[i][j] = num++;
                }
            }
        }
    }

    shuffleBoard(moves = 100) {
        if (this.isSolving) return;
        
        const directions = [
            { row: -1, col: 0, name: 'up' },
            { row: 1, col: 0, name: 'down' },
            { row: 0, col: -1, name: 'left' },
            { row: 0, col: 1, name: 'right' }
        ];

        for (let i = 0; i < moves; i++) {
            const validMoves = directions.filter(dir => {
                const newRow = this.emptyPos.row + dir.row;
                const newCol = this.emptyPos.col + dir.col;
                return newRow >= 0 && newRow < this.size && 
                       newCol >= 0 && newCol < this.size;
            });

            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            this.swapTile(randomMove.row, randomMove.col);
        }

        this.moves = 0;
        this.updateBoardDisplay();
    }

    swapTile(rowOffset, colOffset) {
        const newRow = this.emptyPos.row + rowOffset;
        const newCol = this.emptyPos.col + colOffset;

        if (newRow >= 0 && newRow < this.size && newCol >= 0 && newCol < this.size) {
            // Swap values
            this.board[this.emptyPos.row][this.emptyPos.col] = this.board[newRow][newCol];
            this.board[newRow][newCol] = 0;
            
            // Update empty position
            this.emptyPos = { row: newRow, col: newCol };
            this.moves++;
            
            return true;
        }
        return false;
    }

    updateBoardDisplay() {
        const boardElement = document.getElementById('puzzle-board');
        const moveCountElement = document.getElementById('move-count');
        const sizeElement = document.getElementById('current-size');
        
        // Update grid size
        boardElement.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        
        // Clear board
        boardElement.innerHTML = '';
        
        // Create tiles
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.textContent = this.board[i][j] === 0 ? '' : this.board[i][j];
                tile.dataset.row = i;
                tile.dataset.col = j;
                
                if (this.board[i][j] === 0) {
                    tile.classList.add('empty');
                }
                
                tile.addEventListener('click', () => this.handleTileClick(i, j));
                boardElement.appendChild(tile);
            }
        }
        
        // Update stats
        moveCountElement.textContent = this.moves;
        sizeElement.textContent = `${this.size}×${this.size}`;
        
        // Check if solved
        if (this.isSolved()) {
            document.getElementById('status').textContent = 'Solved!';
            document.querySelectorAll('.tile').forEach(tile => tile.classList.add('solved'));
        } else {
            document.getElementById('status').textContent = 'Playing';
            document.querySelectorAll('.tile').forEach(tile => tile.classList.remove('solved'));
        }
    }

    handleTileClick(row, col) {
        if (this.isSolving) return;
        
        const rowDiff = row - this.emptyPos.row;
        const colDiff = col - this.emptyPos.col;
        
        // Check if adjacent to empty tile
        if ((Math.abs(rowDiff) === 1 && colDiff === 0) || 
            (Math.abs(colDiff) === 1 && rowDiff === 0)) {
            this.swapTile(rowDiff, colDiff);
            this.updateBoardDisplay();
        }
    }

    isSolved() {
        let num = 1;
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (i === this.size - 1 && j === this.size - 1) {
                    if (this.board[i][j] !== 0) return false;
                } else {
                    if (this.board[i][j] !== num++) return false;
                }
            }
        }
        return true;
    }

    // BFS Algorithm (probably expand this thingy with wtv stuff is good lmao)

    solveBFS() {
        if (this.isSolving) return;
        
        this.isSolving = true;
        document.getElementById('status').textContent = 'Solving...';
        
        const targetBoard = this.getTargetBoard();
        const visited = new Set();
        const queue = [{
            board: JSON.parse(JSON.stringify(this.board)),
            emptyPos: { ...this.emptyPos },
            path: [],
            moves: 0
        }];

        visited.add(this.boardToString(queue[0].board));

        const directions = [
            { row: -1, col: 0, name: 'U' },
            { row: 1, col: 0, name: 'D' },
            { row: 0, col: -1, name: 'L' },
            { row: 0, col: 1, name: 'R' }
        ];

        const search = () => {
            if (queue.length === 0) {
                document.getElementById('status').textContent = 'No solution found';
                this.isSolving = false;
                return;
            }

            const current = queue.shift();

            // Check if solved
            if (this.boardsEqual(current.board, targetBoard)) {
                this.animateSolution(current.path);
                this.isSolving = false;
                return;
            }

            // Generate next states
            for (const dir of directions) {
                const newRow = current.emptyPos.row + dir.row;
                const newCol = current.emptyPos.col + dir.col;

                if (newRow >= 0 && newRow < this.size && 
                    newCol >= 0 && newCol < this.size) {
                    
                    const newBoard = JSON.parse(JSON.stringify(current.board));
                    
                    // Swap
                    newBoard[current.emptyPos.row][current.emptyPos.col] = 
                        newBoard[newRow][newCol];
                    newBoard[newRow][newCol] = 0;

                    const boardStr = this.boardToString(newBoard);
                    
                    if (!visited.has(boardStr)) {
                        visited.add(boardStr);
                        queue.push({
                            board: newBoard,
                            emptyPos: { row: newRow, col: newCol },
                            path: [...current.path, dir.name],
                            moves: current.moves + 1
                        });
                    }
                }
            }

            // Continue search (with timeout to prevent blocking)
            setTimeout(search, 0);
        };

        search();
    }

    getTargetBoard() {
        const target = [];
        let num = 1;
        for (let i = 0; i < this.size; i++) {
            target[i] = [];
            for (let j = 0; j < this.size; j++) {
                target[i][j] = (i === this.size - 1 && j === this.size - 1) ? 0 : num++;
            }
        }
        return target;
    }

    boardToString(board) {
        return board.flat().join(',');
    }

    boardsEqual(board1, board2) {
        return this.boardToString(board1) === this.boardToString(board2);
    }

    animateSolution(path) {
        if (path.length === 0) return;
        
        let index = 0;
        const animateStep = () => {
            if (index >= path.length) {
                this.isSolving = false;
                document.getElementById('status').textContent = 'Solved!';
                this.updateSolutionDisplay(path);
                return;
            }

            const move = path[index];
            const directionMap = {
                'U': { row: -1, col: 0 },
                'D': { row: 1, col: 0 },
                'L': { row: 0, col: -1 },
                'R': { row: 0, col: 1 }
            };

            this.swapTile(directionMap[move].row, directionMap[move].col);
            this.updateBoardDisplay();
            index++;
            setTimeout(animateStep, 300); // Adjust speed here
        };

        animateStep();
    }

    updateSolutionDisplay(path) {
        const solutionSteps = document.getElementById('solution-steps');
        solutionSteps.textContent = path.join(' → ');
        solutionSteps.textContent += `\n\nTotal moves: ${path.length}`;
    }

    startTimer() {
        this.startTime = Date.now();
        clearInterval(this.timer);
        this.timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            document.getElementById('timer').textContent = `${elapsed}s`;
        }, 1000);
    }

    setupEventListeners() {
        document.getElementById('generate-btn').addEventListener('click', () => {
            this.size = parseInt(document.getElementById('puzzle-size').value);
            this.generateSolvedBoard();
            this.shuffleBoard(this.size * 50);
        });

        document.getElementById('shuffle-btn').addEventListener('click', () => {
            this.shuffleBoard(100);
        });

        document.getElementById('reset-btn').addEventListener('click', () => {
            this.generateSolvedBoard();
            this.moves = 0;
            this.updateBoardDisplay();
        });

        document.getElementById('solve-btn').addEventListener('click', () => {
            const algorithm = document.getElementById('algorithm').value;
            if (algorithm === 'bfs') {
                this.solveBFS();
            }
            // Add other algorithms here
        });

        document.getElementById('custom-btn').addEventListener('click', () => {
            const input = document.getElementById('custom-puzzle').value;
            const numbers = input.split(',').map(num => parseInt(num.trim()));
            const n = Math.sqrt(numbers.length);
            
            if (n % 1 === 0 && numbers.includes(0)) {
                this.size = n;
                this.board = [];
                for (let i = 0; i < n; i++) {
                    this.board[i] = numbers.slice(i * n, (i + 1) * n);
                    const emptyCol = this.board[i].indexOf(0);
                    if (emptyCol !== -1) {
                        this.emptyPos = { row: i, col: emptyCol };
                    }
                }
                this.moves = 0;
                this.updateBoardDisplay();
            } else {
                alert('Invalid input. Please enter N×N numbers (e.g., 1,2,3,4,5,6,7,8,0 for 3×3)');
            }
        });
    }
}

// Initialize the puzzle when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.puzzleSolver = new PuzzleSolver();
    window.puzzleSolver.shuffleBoard(50);
});
