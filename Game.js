/**Clase principañ que une la interfaz gráfica (HTML), la lógica matemática y la IA. Gestiona los turnos, 
 * los eventos de usuario (clics) y el flujo de la partida
 */
    
class Game {
    constructor() {
        this.turn = 1; // 1 for red, 2 for blue
        this.interactionMode = 'select_piece'; // 'select_piece' or 'select_destination'
        this.selectedBox = null; // {row, col} of the selected box
        this.visitedPositions = []; // For chain captures
        this.huffCandidates = []; // Pieces that can be huffed

        this.gameOverModal = document.getElementById('game-over-modal'); //dialog de fin de partida
        this.gameOverMessage = document.getElementById('game-over-message'); //párrafo dentro del dialog que mostrará el mensaje de fin de partida

        this.STORAGE_KEY = 'alquerque_local_stats';                                                                         
        this.statistics = this.loadStatistics();                                                                            
        this.updateStatisticsUI(); 

        this.displayMessages = document.querySelector('#mensajes p'); // Elemento donde se mostrarán los mensajes de estado del juego
        this.board = null;
        this.ia = null; 
    }
    
    loadStatistics() {                                                                                              
        const defaultStats = {                                                                                      
            3: { wins: 0, losses: 0 },                                                                              
            5: { wins: 0, losses: 0 }                                                                               
        };                                                                                                          
                                                                                                                        
        try {                                                                                                       
            const rawData = localStorage.getItem(this.STORAGE_KEY);                                                 
            if (!rawData) {                                                                                         
                return defaultStats;                                                                                
            }                                                                                                       
                                                                                                                        
            const parsed = JSON.parse(rawData);                                                                     
                                                                                                                        
            // Verificamos que tenga la estructura esperada para 3x3 y 5x5                                          
            if (parsed && parsed[3] && parsed[5]) {                                                                 
                return parsed;                                                                                      
            }                                                                                                       
        } catch (error) {                                                                                           
            console.warn('No se pudieron leer las estadísticas de localStorage:', error);                           
        }                                                                                                           
                                                                                                                        
        return defaultStats;                                                                                        
    }

    saveStatistics() {                                                                                              
        try {                                                                                                       
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.statistics));                                
        } catch (error) {                                                                                           
            console.warn('No se pudieron guardar las estadísticas en localStorage:', error);                        
        }                                                                                                           
    }

    updateStatisticsUI() {                                                                                          
        for (const size of [3, 5]) {                                                                                
            const winsCell = document.getElementById(`wins-${size}`);                                               
            const lossesCell = document.getElementById(`losses-${size}`);                                           
                                                                                                                        
            if (winsCell) winsCell.innerText = this.statistics[size].wins;                                          
            if (lossesCell) lossesCell.innerText = this.statistics[size].losses;                                    
        }                                                                                                           
    }

    Start(size, iaLevel, firstPlayer) {
        this.board = new Board(size, document.getElementById('tablero')); // Crea un nuevo tablero de juego con el tamaño especificado y lo asocia al elemento del DOM
        this.ia = new IA(iaLevel); // Crea una nueva instancia de la IA con el nivel de dificultad especificado
        this.turn = firstPlayer; // Establece el primer jugador (1 = rojo, 2 = azul)

        this.selectedBox = null;  
        this.visitedPositions = [];
        this.huffCandidates = [];
        this.interactionMode = 'select_piece';

        this.board.generateDashboard();  // Genera el tablero
        this.refreshScreen(); // Dibuja el tablero y vincula los eventos de clic a las casillas

        // Retraso visual para el primer turno de la IA
        if (this.turn === 2) {
            this.displayMessages.innerText = `Board generated. Computer starts (Blue)...`;
            // Espera 800 milisegundos antes de que el ordenador mueva
            setTimeout(() => this.iaPlay(), 800);
        } else {
            this.displayMessages.innerText = `Board generated. Your turn (Red)!`;
        }
    }

    refreshScreen() { // Actualiza la visualización del tablero y vincula los eventos de clic a las casillas
        this.board.drawBoard(this.selectedBox, this.huffCandidates);
        this.vinculateEventListeners();
    }

    vinculateEventListeners() {
        //busca las casillas recien dibujaddas y les asigna el evento click
        const boxes = document.querySelectorAll('.box'); //obtener todas las casillas del tablero
        let counter = 0; 
        //recorrer la cuadricula (filas y columnas)
        for (let r = 0; r < this.board.size; r++) {
            for (let c = 0; c < this.board.size; c++) {
                //obtener que hay en esa casilla (0, 1 o 2) es este momento
                let value = this.board.state[r][c];
                //asignar la acción de clic a esa casilla 
                boxes[counter].onclick = () => this.handleClickBox(r, c, value);
                //la función flecha no crea su propio this, hereda el significado de this de su entorno inmediato (apunta a la clase Game)
                //al hacer clic, el codigo sabe donde encontrar el método handleClickBox
                counter++; //incrementar el contador para la siguiente casilla
                //a cada casilla se le asigna el evento .onclick pasando la fila, columna y valor de la casilla al método handleClickBox
            }
        }

    }

    // Mueve la ficha de una casilla a otra sin capturar
    executeMove(fromR, fromC, toR, toC, player) {
        this.board.state[toR][toC] = player;
        this.board.state[fromR][fromC] = 0;
    }

    // Mueve la ficha y retira la pieza saltada
    executeJump(fromR, fromC, toR, toC, player) {
        this.executeMove(fromR, fromC, toR, toC, player);
        const midR = fromR + (toR - fromR) / 2;
        const midC = fromC + (toC - fromC) / 2;
        this.board.state[midR][midC] = 0;
    }


    //Máquina de estados para manejar la interacción del usuario con el tablero.
    // Regla del soplo + captura múltiple
    //argumentos: fila en la que se hizo clic, columna en la que se hizo clic y valor de la casilla (0, 1 o 2)
    handleClickBox(row, col, value) {
        //comprobar si el juego ha terminado o si es el turno del jugador 2 (ordenador).
        if (this.turn === 2 || this.interactionMode === 'game_over') return;

        //Regla del soplo: si el jugador anterior tenía una captura disponible y no la hizo se le da la oportunidad de soplar una de sus piezas.
        //comprobar si la lista de piezas sopables no está vacía y si el jugador hace clic en una de esas piezas.
        if (this.huffCandidates.length > 0 && value === 2) {
            //validación con some: como puede haber varias piezas rivales en el tablero, se busca las coordenadas exactas
            //de la pieza que se acaba de clicar coincidan con alguna de las coordenadas guardadas en la lista de piezas sopables. Si coincide, se permite el soplo.
            let isHuffable = this.huffCandidates.some(p => p.row === row && p.col === col);
            if (isHuffable) {
                this.board.state[row][col] = 0;  //borrar la pieza soplada del tablero
                this.huffCandidates = []; // Limpiar la lista de piezas sopables
                this.selectedBox = null; // Resetea la selección de la pieza
                this.interactionMode = 'select_piece';
                this.displayMessages.innerText = `You huffed an opponent's piece! Now make your move.`;
                this.refreshScreen();
                this.checkGameOver();
                return; //la función acaba aqui pero no cambia  el turno. 
            }
        }

        // Modo seleccionar pieza
        if(this.interactionMode === 'select_piece') {

            // Solo puedes seleccionar tus propias fichas
            if(value === this.turn) { //comprobar que el valor de la casilla coincide con el turno del jugador (1 = rojo, 2 = azul)
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

                /* Plantarse a mitad de una captura múltiple
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

                    // Si fue captura, eliminar la pieza comida del tablero
                    if (esCaptura) {
                        this.executeJump(this.selectedBox.row, this.selectedBox.col, row, col, this.turn);

                        // Memorizar el origen inicial y el nuevo destino en el historial del turno
                        if (this.visitedPositions.length === 0) {
                            this.visitedPositions.push({row: this.selectedBox.row, col: this.selectedBox.col});
                        }
                        this.visitedPositions.push({row: row, col: col});

                        // Comprobar si se puede seguir saltando desde la nueva posición
                        if (this.canCaptureAgain(row, col, this.turn)) {
                            this.selectedBox = {row: row, col: col}; // Mantener la pieza seleccionada para la siguiente captura
                            this.displayMessages.innerText = 'You can capture again! Select the next destination.';
                            this.refreshScreen();
                            return; // No cambiar el turno aún
                        } else {
                            this.visitedPositions = []; // Reiniciar historial de casillas visitadas al finalizar la captura múltiple
                        }
                    } else {
                        this.executeMove(this.selectedBox.row, this.selectedBox.col, row, col, this.turn);
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
        //posibles saltos: arriba, abajo, izquierda, derecha y diagonales
        let jumps = [ [-2, 0], [2, 0], [0, -2], [0, 2], [-2, -2], [-2, 2], [2, -2], [2, 2] ];
        for(let s of jumps) {  //recorrer todos los posibles saltos
            let destR = r + s[0];  //fila de destino
            let destC = c + s[1];  //columna de destino
            // Comprobar que la casilla de destino está dentro del tablero
            if(destR >= 0 && destR < this.board.size && destC >= 0 && destC < this.board.size){
                // Comprobar que la casilla de destino no ha sido visitada en esta cadena
                let visited = this.visitedPositions.some(pos => pos.row === destR && pos.col === destC); 
                // Comprobar que la casilla de destino está vacía y que la captura es válida
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
        if (jugada.type === 'capture') {
            this.executeJump(jugada.fromR, jugada.fromC, jugada.toR, jugada.toC, 2);
            this.visitedPositions = [
                {row: jugada.fromR, col: jugada.fromC},
                {row: jugada.toR,   col: jugada.toC}
            ];
            let curR = jugada.toR, curC = jugada.toC;
            let next;
            while ((next = this.ia.searchNextCapture(this.board, curR, curC, this.visitedPositions)) !== null) {
                this.executeJump(next.fromR, next.fromC, next.toR, next.toC, 2);
                this.visitedPositions.push({row: next.toR, col: next.toC});
                curR = next.toR;
                curC = next.toC;
            }
            this.visitedPositions = [];
        } else {
            this.executeMove(jugada.fromR, jugada.fromC, jugada.toR, jugada.toC, 2);
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
        this.saveStatistics();
        this.updateStatisticsUI();

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
            
            this.saveStatistics();
            this.updateStatisticsUI();
            
            this.displayMessages.innerText = msg;
            this.gameOverMessage.innerText = msg;
            this.gameOverModal.showModal(); // Despliega la ventana de fin de juego
            
            this.refreshScreen();
            return true;
        }
        return false;
    }
}