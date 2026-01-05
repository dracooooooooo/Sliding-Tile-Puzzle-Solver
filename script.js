class AdvancedPuzzleSolver {
    constructor() {
        this.size = 3;
        this.board = [];
        this.emptyPos = { row: 2, col: 2 };
        this.moves = 0;
        this.startTime = Date.now();
        this.timer = null;
        this.isSolving = false;
        this.selectedTile = null;
        this.solutionPath = [];
        this.currentStep = 0;
        this.solverStats = {};
        this.init();
    }

    init() {
        this.generateSolvedBoard();
        this.updateBoardDisplay();
        this.setupEventListeners();
        this.startTimer();
        this.updateValidation();
        this.updateSelectedTileInfo();
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
        this.moves = 0;
        this.selectedTile = null;
    }

    resizeBoard(newSize) {
        this.size = newSize;
        this.generateSolvedBoard();
        this.updateBoardDisplay();
        this.shuffleBoard(newSize * 20);
    }

    shuffleBoard(moves = 100) {
        if (this.isSolving) return;
        
        const directions = [
            { row: -1, col: 0, name: 'U' },
            { row: 1, col: 0, name: 'D' },
            { row: 0, col: -1, name: 'L' },
            { row: 0, col: 1, name: 'R' }
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
        this.selectedTile = null;
        this.updateBoardDisplay();
        this.updateValidation();
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

    setTileValue(row, col, value) {
        const oldValue = this.board[row][col];
        
        // If setting to 0 (empty)
        if (value === 0) {
            this.board[row][col] = 0;
            this.emptyPos = { row, col };
        } 
        // If setting a number where there was 0 before
        else if (oldValue === 0) {
            this.board[row][col] = value;
            // Need to find new empty position if we overwrote it
            this.findAndSetEmptyPosition();
        }
        // Just changing a number
        else {
            this.board[row][col] = value;
        }
        
        this.updateBoardDisplay();
        this.updateValidation();
        return true;
    }

    findAndSetEmptyPosition() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] === 0) {
                    this.emptyPos = { row: i, col: j };
                    return;
                }
            }
        }
        // If no empty found, make the last tile empty
        this.board[this.size-1][this.size-1] = 0;
        this.emptyPos = { row: this.size-1, col: this.size-1 };
    }

    selectTile(row, col) {
        this.selectedTile = { row, col };
        this.updateBoardDisplay();
        this.updateSelectedTileInfo();
        
        // Show edit modal on double click
        setTimeout(() => {
            if (this.clickTimer) {
                clearTimeout(this.clickTimer);
                this.clickTimer = null;
                this.showTileEditor(row, col);
            }
        }, 300);
    }

    showTileEditor(row, col) {
        const modal = document.getElementById('tile-editor-modal');
        const currentValue = this.board[row][col];
        
        document.getElementById('modal-coords').textContent = `(${row}, ${col})`;
        document.getElementById('modal-tile-value').value = currentValue;
        document.getElementById('modal-tile-value').focus();
        
        modal.classList.add('active');
        
        // Quick value buttons
        document.querySelectorAll('.quick-value').forEach(btn => {
            btn.onclick = () => {
                document.getElementById('modal-tile-value').value = btn.dataset.value;
            };
        });
        
        // Set up modal event handlers
        const saveHandler = () => {
            const newValue = parseInt(document.getElementById('modal-tile-value').value) || 0;
            this.setTileValue(row, col, newValue);
            modal.classList.remove('active');
        };
        
        const cancelHandler = () => {
            modal.classList.remove('active');
        };
        
        document.getElementById('modal-save').onclick = saveHandler;
        document.getElementById('modal-cancel').onclick = cancelHandler;
        document.querySelector('.modal-close').onclick = cancelHandler;
        
        // Enter key to save
        document.getElementById('modal-tile-value').onkeypress = (e) => {
            if (e.key === 'Enter') saveHandler();
        };
        
        // Click outside to close
        modal.onclick = (e) => {
            if (e.target === modal) cancelHandler();
        };
    }

    updateBoardDisplay() {
        const boardElement = document.getElementById('puzzle-board');
        
        // Update grid size
        boardElement.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        
        // Clear board
        boardElement.innerHTML = '';
        
        // Create tiles
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                const value = this.board[i][j];
                tile.textContent = value === 0 ? '' : value;
                tile.dataset.row = i;
                tile.dataset.col = j;
                
                // Add classes based on state
                if (value === 0) {
                    tile.classList.add('empty');
                    tile.innerHTML = '<i class="fas fa-square"></i>';
                }
                
                // Check if selected
                if (this.selectedTile && this.selectedTile.row === i && this.selectedTile.col === j) {
                    tile.classList.add('selected');
                }
                
                // Check if adjacent to empty
                if (this.isAdjacentToEmpty(i, j)) {
                    tile.classList.add('adjacent');
                }
                
                // Click handler
                tile.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    // Single click: select or move
                    if (this.isAdjacentToEmpty(i, j)) {
                        // Move tile into empty space
                        const rowDiff = i - this.emptyPos.row;
                        const colDiff = j - this.emptyPos.col;
                        this.swapTile(rowDiff, colDiff);
                        this.updateBoardDisplay();
                        this.updateStats();
                    } else {
                        // Select tile
                        this.selectTile(i, j);
                    }
                });
                
                // Double click handler for editing
                tile.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    this.showTileEditor(i, j);
                });
                
                boardElement.appendChild(tile);
            }
        }
        
        this.updateStats();
    }

    isAdjacentToEmpty(row, col) {
        const rowDiff = Math.abs(row - this.emptyPos.row);
        const colDiff = Math.abs(col - this.emptyPos.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    updateStats() {
        document.getElementById('stat-size').textContent = `${this.size}×${this.size}`;
        document.getElementById('stat-moves').textContent = this.moves;
        document.getElementById('stat-status').textContent = this.isSolving ? 'Solving...' : 'Ready';
        
        // Update GitHub link
        const repoLink = `https://github.com/${window.location.pathname.split('/')[1]}/${window.location.pathname.split('/')[2]}`;
        document.getElementById('github-repo-link').href = repoLink;
    }

    updateSelectedTileInfo() {
        if (this.selectedTile) {
            const { row, col } = this.selectedTile;
            document.getElementById('selected-coords').textContent = `(${row}, ${col})`;
            document.getElementById('selected-value').textContent = this.board[row][col] || 'Empty (0)';
        } else {
            document.getElementById('selected-coords').textContent = 'None';
            document.getElementById('selected-value').textContent = '-';
        }
    }

    updateValidation() {
        const validationElement = document.getElementById('validation-messages');
        const messages = [];
        
        // Check if puzzle is valid
        const numbers = this.board.flat();
        const uniqueNumbers = [...new Set(numbers)];
        const expectedNumbers = Array.from({length: this.size * this.size}, (_, i) => i);
        
        // Check for duplicates
        if (uniqueNumbers.length !== numbers.length) {
            messages.push({
                type: 'invalid',
                text: 'Duplicate numbers found in puzzle'
            });
        }
        
        // Check for missing numbers
        const missingNumbers = expectedNumbers.filter(n => !numbers.includes(n));
        if (missingNumbers.length > 0) {
            messages.push({
                type: 'invalid',
                text: `Missing numbers: ${missingNumbers.join(', ')}`
            });
        }
        
        // Check if solvable (for 15-puzzle)
        if (this.size === 4) {
            const inversions = this.countInversions();
            const emptyRowFromBottom = this.size - this.emptyPos.row;
            const isSolvable = (emptyRowFromBottom % 2 === 1) === (inversions % 2 === 0);
            
            if (!isSolvable) {
                messages.push({
                    type: 'warning',
                    text: 'This 4×4 puzzle configuration may not be solvable'
                });
            }
        }
        
        // Update display
        if (messages.length === 0) {
            validationElement.innerHTML = `
                <div class="validation-item valid">
                    <i class="fas fa-check"></i>
                    <span>Puzzle is valid and ready to solve</span>
                </div>
            `;
            document.getElementById('stat-valid').textContent = '✓ Valid';
            document.getElementById('stat-valid').style.color = '#4ade80';
        } else {
            validationElement.innerHTML = messages.map(msg => `
                <div class="validation-item ${msg.type}">
                    <i class="fas fa-${msg.type === 'invalid' ? 'times' : 'exclamation-triangle'}"></i>
                    <span>${msg.text}</span>
                </div>
            `).join('');
            document.getElementById('stat-valid').textContent = '✗ Issues';
            document.getElementById('stat-valid').style.color = '#f87171';
        }
    }

    countInversions() {
        const flatBoard = this.board.flat().filter(n => n !== 0);
        let inversions = 0;
        
        for (let i = 0; i < flatBoard.length; i++) {
            for (let j = i + 1; j < flatBoard.length; j++) {
                if (flatBoard[i] > flatBoard[j]) {
                    inversions++;
                }
            }
        }
        
        return inversions;
    }

    loadFromString(inputStr) {
        // Support both comma-separated and space-separated
        const numbers = inputStr.split(/[, \t\n]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n));
        const n = Math.sqrt(numbers.length);
        
        if (n % 1 === 0 && n >= 2 && n <= 8) {
            this.size = n;
            this.board = [];
            
            for (let i = 0; i < n; i++) {
                this.board[i] = numbers.slice(i * n, (i + 1) * n);
            }
            
            this.findAndSetEmptyPosition();
            this.moves = 0;
            this.selectedTile = null;
            this.updateBoardDisplay();
            this.updateValidation();
            return true;
        } else {
            alert(`Invalid input. Please enter ${n*n} numbers for a ${n}×${n} grid.`);
            return false;
        }
    }

    exportToString() {
        return this.board.flat().join(',');
    }

    exportToJSON() {
        return JSON.stringify({
            size: this.size,
            board: this.board,
            moves: this.moves,
            timestamp: new Date().toISOString()
        }, null, 2);
    }

    importFromJSON(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            if (data.size && data.board) {
                this.size = data.size;
                this.board = data.board;
                this.moves = data.moves || 0;
                this.findAndSetEmptyPosition();
                this.selectedTile = null;
                this.updateBoardDisplay();
                this.updateValidation();
                return true;
            }
        } catch (e) {
            alert('Invalid JSON format');
        }
        return false;
    }

    startTimer() {
        this.startTime = Date.now();
        clearInterval(this.timer);
        this.timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            document.getElementById('stat-time').textContent = `${elapsed}s`;
        }, 1000);
    }

    // A* Algorithm Implementation
    solveAStar() {
        if (this.isSolving) return;
        
        this.isSolving = true;
        this.updateStats();
        
        const targetBoard = this.getTargetBoard();
        const startState = {
            board: JSON.parse(JSON.stringify(this.board)),
            emptyPos: { ...this.emptyPos },
            g: 0, // Cost from start
            h: this.calculateHeuristic(this.board), // Heuristic to goal
            parent: null,
            move: null
        };
        
        startState.f = startState.g + startState.h;
        
        const openSet = new PriorityQueue((a, b) => a.f < b.f);
        const closedSet = new Set();
        
        openSet.push(startState);
        closedSet.add(this.boardToString(startState.board));
        
        const directions = [
            { row: -1, col: 0, name: 'U' },
            { row: 1, col: 0, name: 'D' },
            { row: 0, col: -1, name: 'L' },
            { row: 0, col: 1, name: 'R' }
        ];
        
        let nodesExplored = 0;
        const maxNodes = 100000; // Safety limit
        
        const searchStep = () => {
            if (openSet.isEmpty() || nodesExplored >= maxNodes) {
                this.isSolving = false;
                this.showSolutionResult(false);
                return;
            }
            
            const current = openSet.pop();
            nodesExplored++;
            
            // Check if we found the solution
            if (this.boardsEqual(current.board, targetBoard)) {
                this.reconstructPath(current);
                this.isSolving = false;
                this.showSolutionResult(true, nodesExplored);
                return;
            }
            
            // Generate successors
            for (const dir of directions) {
                const newRow = current.emptyPos.row + dir.row;
                const newCol = current.emptyPos.col + dir.col;
                
                if (newRow >= 0 && newRow < this.size && 
                    newCol >= 0 && newCol < this.size) {
                    
                    const newBoard = JSON.parse(JSON.stringify(current.board));
                    
                    // Swap tiles
                    newBoard[current.emptyPos.row][current.emptyPos.col] = 
                        newBoard[newRow][newCol];
                    newBoard[newRow][newCol] = 0;
                    
                    const boardStr = this.boardToString(newBoard);
                    
                    if (!closedSet.has(boardStr)) {
                        const gScore = current.g + 1;
                        const hScore = this.calculateHeuristic(newBoard);
                        
                        const neighbor = {
                            board: newBoard,
                            emptyPos: { row: newRow, col: newCol },
                            g: gScore,
                            h: hScore,
                            f: gScore + hScore,
                            parent: current,
                            move: dir.name
                        };
                        
                        openSet.push(neighbor);
                        closedSet.add(boardStr);
                    }
                }
            }
            
            // Update status periodically
            if (nodesExplored % 1000 === 0) {
                document.getElementById('stat-status').textContent = 
                    `Exploring... ${nodesExplored} nodes`;
            }
            
            // Continue search
            setTimeout(searchStep, 0);
        };
        
        searchStep();
    }

    calculateHeuristic(board) {
        // Manhattan distance heuristic
        let distance = 0;
        const size = board.length;
        
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const value = board[i][j];
                if (value !== 0) {
                    const targetRow = Math.floor((value - 1) / size);
                    const targetCol = (value - 1) % size;
                    distance += Math.abs(i - targetRow) + Math.abs(j - targetCol);
                }
            }
        }
        
        return distance;
    }

    reconstructPath(node) {
        const path = [];
        while (node.parent) {
            path.unshift(node.move);
            node = node.parent;
        }
        this.solutionPath = path;
        
        if (document.getElementById('chk-animate').checked) {
            this.animateSolution();
        } else {
            this.showSolutionSteps();
        }
    }

    animateSolution() {
        if (this.solutionPath.length === 0) return;
        
        this.currentStep = 0;
        const animateNext = () => {
            if (this.currentStep >= this.solutionPath.length) {
                document.getElementById('stat-status').textContent = 'Solved!';
                return;
            }
            
            const move = this.solutionPath[this.currentStep];
            const directionMap = {
                'U': { row: -1, col: 0 },
                'D': { row: 1, col: 0 },
                'L': { row: 0, col: -1 },
                'R': { row: 0, col: 1 }
            };
            
            this.swapTile(directionMap[move].row, directionMap[move].col);
            this.updateBoardDisplay();
            this.currentStep++;
            
            setTimeout(animateNext, 300);
        };
        
        animateNext();
    }

    showSolutionSteps() {
        const solutionElement = document.getElementById('solution-steps');
        solutionElement.innerHTML = '';
        
        if (this.solutionPath.length === 0) {
            solutionElement.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-robot"></i>
                    <p>No solution found or not yet solved</p>
                </div>
            `;
            return;
        }
        
        const stepsHTML = this.solutionPath.map((step, index) => {
            return `<span class="solution-step">${index + 1}. ${step}</span>`;
        }).join(' ');
        
        solutionElement.innerHTML = stepsHTML;
        
        // Update solution stats
        const statsElement = document.getElementById('solution-stats');
        statsElement.innerHTML = `
            <strong>Solution Statistics:</strong><br>
            • Total moves: ${this.solutionPath.length}<br>
            • Puzzle size: ${this.size}×${this.size}<br>
            • Algorithm used: A* Search<br>
            • Heuristic: Manhattan Distance
        `;
    }

    showSolutionResult(success, nodesExplored = 0) {
        const solutionElement = document.getElementById('solution-steps');
        
        if (success) {
            solutionElement.innerHTML = `
                <div class="empty-state" style="color: #4ade80;">
                    <i class="fas fa-check-circle"></i>
                    <p>Solution found! ${this.solutionPath.length} moves required.</p>
                    <p style="font-size: 0.9rem;">Nodes explored: ${nodesExplored.toLocaleString()}</p>
                </div>
            `;
        } else {
            solutionElement.innerHTML = `
                <div class="empty-state" style="color: #f87171;">
                    <i class="fas fa-times-circle"></i>
                    <p>No solution found within search limits.</p>
                    <p style="font-size: 0.9rem;">Nodes explored: ${nodesExplored.toLocaleString()}</p>
                </div>
            `;
        }
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

    setupEventListeners() {
        // Size slider
        const sizeSlider = document.getElementById('size-slider');
        const sizeValue = document.getElementById('size-value');
        
        sizeSlider.addEventListener('input', () => {
            sizeValue.textContent = sizeSlider.value;
        });
        
        document.getElementById('resize-btn').addEventListener('click', () => {
            this.resizeBoard(parseInt(sizeSlider.value));
        });
        
        // Quick setup buttons
        document.getElementById('btn-solved').addEventListener('click', () => {
            this.generateSolvedBoard();
            this.updateBoardDisplay();
        });
        
        document.getElementById('btn-random').addEventListener('click', () => {
            this.shuffleBoard(this.size * 50);
        });
        
        document.getElementById('btn-clear').addEventListener('click', () => {
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    this.board[i][j] = 0;
                }
            }
            this.emptyPos = { row: 0, col: 0 };
            this.updateBoardDisplay();
        });
        
        // Custom input
        document.getElementById('btn-load').addEventListener('click', () => {
            const input = document.getElementById('custom-input').value;
            if (input) {
                this.loadFromString(input);
            }
        });
        
        document.getElementById('btn-export').addEventListener('click', () => {
            const exportStr = this.exportToString();
            document.getElementById('custom-input').value = exportStr;
            navigator.clipboard.writeText(exportStr);
            alert('Puzzle copied to clipboard!');
        });
        
        document.getElementById('btn-import').addEventListener('click', () => {
            const jsonStr = prompt('Paste JSON puzzle data:');
            if (jsonStr) {
                this.importFromJSON(jsonStr);
            }
        });
        
        // Solver buttons
        document.getElementById('btn-solve').addEventListener('click', () => {
            const algorithm = document.getElementById('algorithm').value;
            if (algorithm === 'a-star') {
                this.solveAStar();
            } else if (algorithm === 'bfs') {
                this.solveBFS();
            } else if (algorithm === 'ida-star') {
                this.solveIDAStar();
            }
        });
        
        document.getElementById('btn-step').addEventListener('click', () => {
            if (this.solutionPath.length > 0 && this.currentStep < this.solutionPath.length) {
                const move = this.solutionPath[this.currentStep];
                const directionMap = {
                    'U': { row: -1, col: 0 },
                    'D': { row: 1, col: 0 },
                    'L': { row: 0, col: -1 },
                    'R': { row: 0, col: 1 }
                };
                
                this.swapTile(directionMap[move].row, directionMap[move].col);
                this.updateBoardDisplay();
                this.currentStep++;
            }
        });
        
        document.getElementById('btn-stop').addEventListener('click', () => {
            this.isSolving = false;
            document.getElementById('stat-status').textContent = 'Stopped';
        });
        
        // Editor controls
        document.getElementById('btn-set-tile').addEventListener('click', () => {
            if (this.selectedTile) {
                const value = parseInt(document.getElementById('tile-edit-value').value) || 0;
                this.setTileValue(this.selectedTile.row, this.selectedTile.col, value);
            }
        });
        
        document.getElementById('btn-find-empty').addEventListener('click', () => {
            this.selectTile(this.emptyPos.row, this.emptyPos.col);
        });
        
        // Solution panel controls
        document.getElementById('btn-copy-solution').addEventListener('click', () => {
            if (this.solutionPath.length > 0) {
                navigator.clipboard.writeText(this.solutionPath.join(' → '));
                alert('Solution copied to clipboard!');
            }
        });
        
        document.getElementById('btn-clear-solution').addEventListener('click', () => {
            this.solutionPath = [];
            this.currentStep = 0;
            this.showSolutionSteps();
        });
        
        // Click anywhere to deselect
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.tile') && !e.target.closest('#tile-editor-modal')) {
                this.selectedTile = null;
                this.updateBoardDisplay();
                this.updateSelectedTileInfo();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            if (this.selectedTile) {
                const { row, col } = this.selectedTile;
                
                if (e.key >= '0' && e.key <= '9') {
                    this.setTileValue(row, col, parseInt(e.key));
                } else if (e.key === 'Delete' || e.key === 'Backspace') {
                    this.setTileValue(row, col, 0);
                } else if (e.key === 'ArrowUp' && row > 0) {
                    this.selectTile(row - 1, col);
                } else if (e.key === 'ArrowDown' && row < this.size - 1) {
                    this.selectTile(row + 1, col);
                } else if (e.key === 'ArrowLeft' && col > 0) {
                    this.selectTile(row, col - 1);
                } else if (e.key === 'ArrowRight' && col < this.size - 1) {
                    this.selectTile(row, col + 1);
                } else if (e.key === 'Enter' || e.key === ' ') {
                    this.showTileEditor(row, col);
                }
            }
            
            // Global shortcuts
            if (e.key === 'r' && e.ctrlKey) {
                e.preventDefault();
                this.shuffleBoard(100);
            } else if (e.key === 's' && e.ctrlKey) {
                e.preventDefault();
                this.solveAStar();
            }
        });
    }
}

// Priority Queue for A* algorithm
class PriorityQueue {
    constructor(comparator = (a, b) => a < b) {
        this.heap = [];
        this.comparator = comparator;
    }
    
    push(item) {
        this.heap.push(item);
        this.bubbleUp(this.heap.length - 1);
    }
    
    pop() {
        const root = this.heap[0];
        const last = this.heap.pop();
        
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.sinkDown(0);
        }
        
        return root;
    }
    
    isEmpty() {
        return this.heap.length === 0;
    }
    
    bubbleUp(index) {
        while (index > 0) {
            const parent = Math.floor((index - 1) / 2);
            if (this.comparator(this.heap[index], this.heap[parent])) {
                [this.heap[index], this.heap[parent]] = [this.heap[parent], this.heap[index]];
                index = parent;
            } else {
                break;
            }
        }
    }
    
    sinkDown(index) {
        const length = this.heap.length;
        
        while (true) {
            let left = 2 * index + 1;
            let right = 2 * index + 2;
            let swap = null;
            
            if (left < length && this.comparator(this.heap[left], this.heap[index])) {
                swap = left;
            }
            
            if (right < length) {
                if ((swap === null && this.comparator(this.heap[right], this.heap[index])) ||
                    (swap !== null && this.comparator(this.heap[right], this.heap[left]))) {
                    swap = right;
                }
            }
            
            if (swap === null) break;
            
            [this.heap[index], this.heap[swap]] = [this.heap[swap], this.heap[index]];
            index = swap;
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.puzzleSolver = new AdvancedPuzzleSolver();
    window.puzzleSolver.shuffleBoard(30);
    
    // Set up GitHub link
    const pathParts = window.location.pathname.split('/').filter(p => p);
    if (pathParts.length >= 2) {
        const repoLink = `https://github.com/${pathParts[0]}/${pathParts[1]}`;
        document.getElementById('github-repo-link').href = repoLink;
    }
});
