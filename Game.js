class Game {
    constructor() {
        this.turn = 1; // 1 for red, 2 for blue
        this.interactionMode = 'select_piece'; // 'select_piece' or 'select_destination'
        this.selectedBox = null; // {row, col} of the selected box
        this.visitedPositions = []; // For chain captures
        this.huffCandidates = []; // Pieces that can be huffed

        this.gameOverModal = document.getElementById('game-over-modal');
        this.gameOverMessage = document.getElementById('game-over-message');

        this.statistics = { 3: {wins: 0, losses: 0}, 5: {wins: 0, losses: 0} }; // Estadísticas 

        this.displayMessages = document.querySelector('#mensajes p');
        this.board = null;
        this.ia = null; 
    }

    Start(size, iaLevel, firstPlayer) {
        this.board = new Board(size, document.getElementById('tablero'));
        this.ia = new IA(iaLevel);
        this.turn = firstPlayer; 

        this.selectedBox = null; 
        this.visitedPositions = [];
        this.huffCandidates = [];
        this.interactionMode = 'select_piece';

        this.board.generateDashboard(); 
        this.refreshScreen(); 

        // Retraso visual para el primer turno de la IA ===
        if (this.turn === 2) {
            this.displayMessages.innerText = `Board generated. Computer starts (Blue)...`;
            // Espera 800 milisegundos antes de que el ordenador mueva
            setTimeout(() => this.iaPlay(), 800);
        } else {
            this.displayMessages.innerText = `Board generated. Your turn (Red)!`;
        }
    }

    refreshScreen() {
        this.board.drawBoard(this.selectedBox, this.huffCandidates);
        this.vinculateEventListeners();
    }

    vinculateEventListeners() {
        //busca las casillas recien dibujaddas y les asigna el evento click
        const boxes = document.querySelectorAll('.box');
        let counter = 0; 
        for (let r = 0; r < this.board.size; r++) {
            for (let c = 0; c < this.board.size; c++) {
                let value = this.board.state[r][c];
                boxes[counter].onclick = () => this.handleClickBox(r, c, value  );
                counter++;
            }
        }

    }

    //Máquina de estados para manejar la interacción del usuario con el tablero.
    // Regla del soplo + captura múltiple
    handleClickBox(row, col, value) {
        //comprobar si el juego ha terminado o si es el turno del jugador 2 (ordenador).
        if (this.turn === 2 || this.interactionMode === 'game_over') return;

        //Regla del soplo: si el jugador anterior tenía una captura disponible y no la hizo se da la oportunidad de soplar una de sus piezas.
        if (this.huffCandidates.length > 0 && value === 2) {
            let isHuffable = this.huffCandidates.some(p => p.row === row && p.col === col);
            if (isHuffable) {
                this.board.state[row][col] = 0; 
                this.huffCandidates = []; 
                this.selectedBox = null; // Resetea la selección de la pieza
                this.interactionMode = 'select_piece';
                this.displayMessages.innerText = `You huffed an opponent's piece! Now make your move.`;
                this.refreshScreen();
                this.checkGameOver();
                return; 
            }
        }

        // Modo seleccionar pieza
        if(this.interactionMode === 'select_piece') {

            // Antes de cualquier otra cosa, comprobar si el jugador quiere ejercer el soplo.
            if (this.huffCandidates.length > 0 && value === (this.turn === 1 ? 2 : 1)) {
                // Comprobar si la pieza clicada es una de las que pueden ser sopladas
                let isHuffable = this.huffCandidates.some(p => p.row === row && p.col === col);
                //si es una pieza soplable, se elimina del tablero y se limpia la lista de soplos pendientes.
                if (isHuffable) {
                    this.board.state[row][col] = 0; //eliminar la pieza del tablero
                    this.huffCandidates = []; // Limpiar la lista de piezas infractoras después del soplo
                    this.displayMessages.innerText = `You huffed an opponent's piece! Now make your move.`;
                    this.refreshScreen();
                    this.checkGameOver();
                    return; 
                }
            }

            // Solo puedes seleccionar tus propias fichas
            if(value === this.turn) { 
                this.selectedBox = {row: row, col: col}; // Guardar la posición de la pieza seleccionada
                this.interactionMode = 'select_destination'; 
                this.displayMessages.innerText = `You've selected your piece. Tap the destination.`; 
                this.refreshScreen(); 
            } else { 
                this.displayMessages.innerText = 'You must select a piece of your color.'; 
            }

         //Seleccionar destino de la pieza previamente seleccionada
        } else if(this.interactionMode === 'select_destination') {
            //si el jugador hace click en la misma pieza que ya había seleccionado, se cancela la selección y vuelve al modo de seleccionar pieza.
            if(row === this.selectedBox.row && col === this.selectedBox.col) {

                // No permitir cancelar si hay una cadena de capturas en curso
                if(this.visitedPositions.length > 0) {
                    this.displayMessages.innerText = 'You are in the middle of a multi-capture. You cannot cancel now.';
                    return; 
                }

                /* NUEVA REGLA: Plantarse a mitad de una captura múltiple
                if(this.visitedPositions.length > 0) {
                    this.huffCandidates = [this.selectedBox]; // Se marca para que la IA la sople
                    this.selectedBox = null;
                    this.visitedPositions = [];
                    this.interactionMode = 'select_piece';
                    this.turn = 2;
                    this.displayMessages.innerText = 'You stopped capturing. Computer can huff this piece!';
                    this.refreshScreen();
                    setTimeout(() => this.iaPlay(), 600);
                    return; 
                }*/

                this.selectedBox = null; // Deseleccionar la pieza
                this.interactionMode = 'select_piece';  // Volver al modo de seleccionar pieza
                this.displayMessages.innerText = `Selection canceled.`;
                this.refreshScreen();

            } else if(value === 0) { //si el jugador hace click en una casilla vacía: 

                let esMovimiento = this.board.validateNormalMovement(this.selectedBox.row, this.selectedBox.col, row, col, this.turn);
                let esCaptura = this.board.validateCapture(this.selectedBox.row, this.selectedBox.col, row, col, this.turn);

                // Comprobar si la casilla de destino ya fue visitada en esta cadena
                let visited = this.visitedPositions.some(pos => pos.row === row && pos.col === col);
                //si es una captura múltiple, no se puede aterrizar en una casilla previamente visitada:
                if(esCaptura && visited) {
                    this.displayMessages.innerText = 'You cannot land on a previously visited square during a multi-capture.';
                    return;
                }

                // A mitad de cadena no se permite un movimiento normal, solo capturar
                if(this.visitedPositions.length > 0 && esMovimiento) {
                    this.displayMessages.innerText = 'You are in the middle of a multi-capture. You must continue capturing.';
                    return;
                }

                // Si el movimiento es válido (ya sea normal o captura), se ejecuta la jugada
                if (esMovimiento || esCaptura) {

                    // Comprobar si ANTES del movimiento había alguna captura disponible.
                    let captureWasAvailable = this.board.compulsoryCaptureExists(this.turn);
                    let capturingPieces = [];
                    //si habia capturas disponibles y el jugador no las hizo, se guardan las piezas infractoras para que puedan ser sopladas en el siguiente turno.
                    if (captureWasAvailable && this.visitedPositions.length === 0) {
                        capturingPieces = this.board.getCapturingPieces(this.turn); // Guardar las piezas que podían capturar antes del movimiento
                    }

                    // Al moverse, el jugador renuncia al soplo pendiente del turno actual
                    this.huffCandidates = [];

                    // Mover la pieza
                    this.board.state[row][col] = this.turn;

                    // Vaciar la casilla de origen
                    this.board.state[this.selectedBox.row][this.selectedBox.col] = 0;

                    // Si fue captura, eliminar la pieza comida del tablero
                    if (esCaptura) {
                        let medioR = this.selectedBox.row + (row - this.selectedBox.row) / 2;
                        let medioC = this.selectedBox.col + (col - this.selectedBox.col) / 2;
                        this.board.state[medioR][medioC] = 0;

                        // Memorizar el origen inicial y el nuevo destino en el historial del turno
                        if (this.visitedPositions.length === 0) {
                            this.visitedPositions.push({row: this.selectedBox.row, col: this.selectedBox.col});
                        }
                        this.visitedPositions.push({row: row, col: col});

                        // Comprobar si se puede seguir saltando desde la nueva posición
                        if (this.canCaptureAgain(row, col, this.turn)) {
                            this.selectedBox = {row: row, col: col};
                            this.displayMessages.innerText = 'You can capture again! Select the next destination.';
                            this.refreshScreen();
                            return; // No cambiar el turno aún
                        } else {
                            this.visitedPositions = []; // Reiniciar historial de casillas visitadas al finalizar la captura múltiple
                        }
                    }
  
                    this.selectedBox = null;  
                    this.interactionMode = 'select_piece'; 
                    this.turn = this.turn === 1 ? 2 : 1;

                    // Solo hay soplo si el jugador NO capturó pero tenía capturas disponibles.
                    if (captureWasAvailable && !esCaptura) {
                        this.huffCandidates = capturingPieces.map(p => 
                            (p.row === row && p.col === col) ? p : 
                            (this.board.state[p.row][p.col] === 0 ? {row: row, col: col} : p)
                        );
                    }

                    this.refreshScreen();

                    // Comprobar si la partida ha terminado; si no, lanzar turno del ordenador
                    if (!this.checkGameOver()) {
                        this.displayMessages.innerText = `Valid movement. Computer's turn (Blue)...`;
                        if (this.turn === 2) {
                            setTimeout(() => this.iaPlay(), 600);
                        }
                    } 

                } else {
                    this.displayMessages.innerText = 'Invalid movement (Check lines and rules).'; 
                }
            }
        }
    }

    canCaptureAgain(r, c, player) {
        let jumps = [ [-2, 0], [2, 0], [0, -2], [0, 2], [-2, -2], [-2, 2], [2, -2], [2, 2] ];
        for(let s of jumps) { 
            let destR = r + s[0]; 
            let destC = c + s[1]; 
            if(destR >= 0 && destR < this.board.size && destC >= 0 && destC < this.board.size){
                let visited = this.visitedPositions.some(pos => pos.row === destR && pos.col === destC); 
                if(this.board.state[destR][destC] === 0 && !visited && this.board.validateCapture(r, c, destR, destC, player)){
                    return true;
                }
            }
        }
        return false;
    }

    iaPlay() {
        if (this.interactionMode === 'game_over' || this.turn !== 2) return;

        let jugada = this.ia.calculateMove(this.board, this.huffCandidates);

        if (!jugada) {
            this.checkGameOver();
            return;
        }

        if (jugada.type === 'huff') {
            this.board.state[jugada.piece.row][jugada.piece.col] = 0;
            this.huffCandidates = [];
            this.displayMessages.innerText = "Computer huffed one of your pieces!";
            this.refreshScreen();
            if (!this.checkGameOver()) {
                setTimeout(() => this.iaPlay(), 600); 
            }
            return;
        }

        // Antes de mover, el juego comprueba si la IA está ignorando una captura
        let captureWasAvailable = this.board.compulsoryCaptureExists(2);
        let capturingPieces = [];
        if (captureWasAvailable) {
            capturingPieces = this.board.getCapturingPieces(2);
        }

        // Al mover, la IA renuncia al soplo pendiente que pudiera tener sobre ti en este turno
        this.huffCandidates = [];

        // Ejecutar jugada física en el tablero
        this.board.state[jugada.toR][jugada.toC] = 2;
        this.board.state[jugada.fromR][jugada.fromC] = 0;

        if (jugada.type === 'capture') {
            let midR = jugada.fromR + (jugada.toR - jugada.fromR) / 2;
            let midC = jugada.fromC + (jugada.toC - jugada.fromC) / 2;
            this.board.state[midR][midC] = 0;
            
            this.visitedPositions = [];
        }

        // Si la IA podía capturar pero hizo un movimiento normal cede el derecho a soplarla
        if (captureWasAvailable && jugada.type !== 'capture') {
            this.huffCandidates = capturingPieces.map(p => 
                (p.row === jugada.fromR && p.col === jugada.fromC) ? {row: jugada.toR, col: jugada.toC} : p
            );
        }

        this.turn = 1;
        this.refreshScreen();
        
        if (!this.checkGameOver()) {
            // Aviso en pantalla si la IA ha dejado una pieza vulnerable
            if (this.huffCandidates.length > 0) {
                this.displayMessages.innerText = "Computer missed a capture! Click its highlighted piece to huff it.";
            } else {
                this.displayMessages.innerText = "Computer moved. Your turn (Red)!";
            }
        }
    }

    // CONTROLES DE PARTIDA
    skipTurn() { //saltar turno
        if (this.interactionMode === 'game_over' || this.turn === 2) return;
        
        this.selectedBox = null;
        this.visitedPositions = [];
        this.huffCandidates = []; // Renunciar a los soplos pendientes
        this.interactionMode = 'select_piece';
        this.turn = 2; // Ceder el turno

        this.displayMessages.innerText = "You skipped your turn. Computer's turn (Blue)...";
        this.refreshScreen();

        if (!this.checkGameOver()) {
            setTimeout(() => this.iaPlay(), 600);
        }
    }

    giveUp() {
        if (this.interactionMode === 'game_over') return;
        
        this.interactionMode = 'game_over';
        this.selectedBox = null;
        this.visitedPositions = [];
        this.huffCandidates = [];
        
        this.statistics[this.board.size].losses++;
        document.getElementById(`losses-${this.board.size}`).innerText = this.statistics[this.board.size].losses;

        let msg = "You gave up. The computer wins the match!";
        this.displayMessages.innerText = msg;
        this.gameOverMessage.innerText = msg; // Inyecta el texto en el panel
        this.gameOverModal.showModal(); // Abre el panel desplegable
        
        this.refreshScreen();
    }

    proposeDraw() {
        if (this.interactionMode === 'game_over') return;
        
        this.interactionMode = 'game_over';
        this.selectedBox = null;
        this.visitedPositions = [];
        this.huffCandidates = [];

        let msg = "Match ended in a draw by mutual agreement!";
        this.displayMessages.innerText = msg;
        this.gameOverMessage.innerText = msg;
        this.gameOverModal.showModal();
        
        this.refreshScreen();
    }


    hasValidMoves(player) {
        if (this.board.compulsoryCaptureExists(player)) {
            return true;
        }

        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ];

        for (let r = 0; r < this.board.size; r++) {
            for (let c = 0; c < this.board.size; c++) {
                if (this.board.state[r][c] === player) {
                    for (let d of directions) {
                        let destR = r + d[0];
                        let destC = c + d[1];
                        if (destR >= 0 && destR < this.board.size && destC >= 0 && destC < this.board.size) {
                            if (this.board.state[destR][destC] === 0 && this.board.validateNormalMovement(r, c, destR, destC, player)) {
                                return true;
                            } 
                        }
                    }
                }
            }
        }
        return false;
    }

    checkGameOver() {
       if (!this.hasValidMoves(this.turn)) {
            this.interactionMode = 'game_over';
            this.visitedPositions = [];
            this.huffCandidates = [];
            
            let msg = "";
            if (this.turn === 2) {
                this.statistics[this.board.size].wins++;
                msg = "Congratulations! You won the match!";
            } else {
                this.statistics[this.board.size].losses++;
                msg = "Game Over! You have no valid moves left. Computer wins!";
            }
            
            document.getElementById(`wins-${this.board.size}`).innerText = this.statistics[this.board.size].wins;
            document.getElementById(`losses-${this.board.size}`).innerText = this.statistics[this.board.size].losses;
            
            this.displayMessages.innerText = msg;
            this.gameOverMessage.innerText = msg;
            this.gameOverModal.showModal(); // Despliega la ventana de fin de juego
            
            this.refreshScreen();
            return true;
        }
        return false;
    }
}