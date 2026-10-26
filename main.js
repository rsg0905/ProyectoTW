//envuelto en evento DOMContentLoaded para asegurar que el DOM esté completamente cargado antes de ejecutar el código JS
//Es decir, el código JS se ejecutará solo después de que todo el HTML haya sido procesado y renderizado por el navegador, evitando errores de referencia a elementos que aún no existen en el DOM.
document.addEventListener('DOMContentLoaded', () => {
    // Referencia al contenedor principal del html
    const contenedorTablero = document.getElementById('tablero');

    // Creamos el contenedor de la cuadricula
    const grid = document.createElement('div');
    grid.id = 'tablero-grid';
    contenedorTablero.appendChild(grid);

    // Botones e Interfaz 
    const btnApply = document.getElementById('btn-apply-settings'); 
    const selectSize = document.getElementById('select-size'); 
    const displayMessages = document.querySelector('#mensajes p'); 
    const selectTurn = document.getElementById('select-turn');
    const selectIA = document.getElementById('select-ia');
    const btnStart = document.getElementById('btn-start');
    const btnDraw = document.getElementById('btn-draw');
    const btnPass = document.getElementById('btn-pass');
    const btnGiveUp = document.getElementById('btn-giveup');

    // Paneles superpuestos
    const dialogInstructions = document.getElementById('Instructions'); 
    const btnSeeInstructions = document.getElementById('btn-instructions'); 
    const btnCloseInstructions = document.getElementById('close-instructions'); 

    const dialogRatings = document.getElementById('ratings'); 
    const btnSeeRating = document.getElementById('btn-ratings'); 
    const btnCloseRatings = document.getElementById('close-rankings'); 

    // variables de estado: recordar en que situación está el juego y que jugador tiene el turno 
    let boardState = [];  //matriz donde 0 es vacio,1 es ficha roja y 2 es ficha azul
    let actualSize = 5; //tamaño actual del tablero (5x5 por defecto)
    let playerTurn = 1; //turno del jugador (1 para rojo, 2 para azul)

    // modos de juego: seleccionar pieza o seleccionar destino. 
    //crea una 'maquina de estados' para controlar la interacción del usuario con el tablero.
    let interactionMode = 'select_piece'; 
    // casilla seleccionada
    let checkboxTicked = null; // guardará la fila y columna de la pieza clicada 

    // almacena las posiciones visitadas durante un turno de captura múltiple
    // (incluye el origen inicial y cada casilla de aterrizaje de la cadena)
    let visitedPositions = []; 

    // piezas del oponente que pueden ser sopladas al inicio del turno
    // (se llenan cuando el jugador anterior tenía captura disponible y no la hizo)
    let huffCandidates = []; 

    // Nivel de IA y estadísticas para la tabla de clasificaciones
    let iaLevel = 'easy'; //predeterminado para esta entrega
    //el nivel de ia se podra cambiar a difficult en futuras versiones del juego.
    let stats = {
        3: { wins: 0, losses: 0 },
        5: { wins: 0, losses: 0 }
    };

    // EVENTOS DE LA INTERFAZ (abrir/cerrar paneles)
    btnSeeInstructions.addEventListener('click', () => dialogInstructions.showModal()); 
    btnCloseInstructions.addEventListener('click', () => dialogInstructions.close()); 

    btnSeeRating.addEventListener('click', () => dialogRatings.showModal()); 
    btnCloseRatings.addEventListener('click', () => dialogRatings.close()); 


    // GENERACIÓN DINÁMICA DEL TABLERO
    function generateDashboard(size) {
        boardState = []; 
        const totalBoxes = size * size; // número total de casillas
        const centralPosition = Math.floor(totalBoxes / 2); //calcula la posición central del tablero (para dejarla vacía)
        let accountant = 0; // contador para recorrer todas las casillas del tablero

        //RECORRIDO DE FILAS Y COLUMNAS PARA CREAR LA MATRIZ DEL TABLERO.
        for(let row = 0; row < size; row++) {
            let actualRow = []; 
            for(let col = 0; col < size; col++) {
                if(accountant < centralPosition) { //lo que este antes de la posición central se llena con fichas rojas
                    actualRow.push(1); // ficha roja

                } else if(accountant === centralPosition) { //la posición central se deja vacía
                    actualRow.push(0); // hueco vacío

                } else { //lo que este después de la posición central se llena con fichas azules
                    actualRow.push(2); // ficha azul
                }   
                accountant++; 
            }
            boardState.push(actualRow);  //añadimos la fila completa a la matriz del tablero
        }
    } 

    //DIBUJAR EL TABLERO DE MANERA DINÁMICA: se encarga de crear la estructura visual del tablero y las fichas según el estado actual del juego.
    //Traduce la matriz de numeros en elementos visuales (divs y SVG) que representan las casillas y las fichas en el DOM.
    function drawBoard(){
        const oldGrid = document.getElementById('tablero-grid');
        const oldSvg = document.getElementById('tablero-lineas');
        if(oldGrid) oldGrid.remove(); // Eliminamos la cuadricula anterior
        if(oldSvg) oldSvg.remove(); // Eliminamos el SVG anterior

        // 1. Crear el contenedor CSS de las casillas (las intersecciones) adaptado al tamaño actual del tablero
        const grid = document.createElement('div');
        grid.id = 'tablero-grid';
        grid.style.gridTemplateColumns = `repeat(${actualSize}, 60px)`; 
        grid.style.gridTemplateRows = `repeat(${actualSize}, 60px)`; 
        
        // 2. Crear el SVG para dibujar las líneas (dibuja vectores que conectan las casillas)
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = "tablero-lineas";
        
        // Tamaño total del SVG basado en el número de celdas * 60px
        const totalDimension = actualSize * 60;
        
        // Función auxiliar para dibujar líneas en el SVG
        function crearLinea(x1, y1, x2, y2) {
            const linea = document.createElementNS("http://www.w3.org/2000/svg", "line");
            linea.setAttribute("x1", x1); // Coordenada X inicial
            linea.setAttribute("y1", y1); // Coordenada Y inicial
            linea.setAttribute("x2", x2); // Coordenada X final
            linea.setAttribute("y2", y2); // Coordenada Y final
            linea.setAttribute("stroke", "#888"); // Color de la línea
            linea.setAttribute("stroke-width", "3"); // Grosor de la línea
            svg.appendChild(linea); // Agrega la línea al SVG
        }

        // Centro geométrico de la primera y última celda para alinear las líneas
        const offset = 30; // La mitad de 60px (centro de la casilla)
        const maxOffset = totalDimension - 30; // La mitad de 60px desde el borde (centro de la última casilla)

        // Dibujar las líneas rectas (horizontales y verticales)
        //se repite tantas veces como el tamaño del tablero para crear todas las líneas necesarias
        //(5 VECES SI ES UN TABLERO 5X5)
        for(let i = 0; i < actualSize; i++) {
            let pos = offset + (i * 60);
            crearLinea(offset, pos, maxOffset, pos); // Horizontal
            crearLinea(pos, offset, pos, maxOffset); // Vertical
        }

        // Dibujar las líneas diagonales correctamente (solo desde nodos pares)
        for(let row = 0; row < actualSize; row++) { //recorrer filas
            for(let col = 0; col < actualSize; col++) { //recorrer columnas

                //solo las casillas (row + col) pares tienen diagonales
                if ((row + col) % 2 === 0) {
                    let cx1 = offset + (col * 60);
                    let cy1 = offset + (row * 60);
                    
                    // Diagonal hacia abajo-derecha. 
                    //comprobamos que no estamos en la última fila ni en la última columna para no dibujar fuera del tablero
                    if (row + 1 < actualSize && col + 1 < actualSize) {
                        let cx2 = offset + ((col + 1) * 60);
                        let cy2 = offset + ((row + 1) * 60);
                        crearLinea(cx1, cy1, cx2, cy2);
                    }
                    // Diagonal hacia abajo-izquierda. 
                    //comprobamos que no estamos en la última fila ni en la primera columna para no dibujar fuera del tablero
                    if (row + 1 < actualSize && col - 1 >= 0) {
                        let cx2 = offset + ((col - 1) * 60);
                        let cy2 = offset + ((row + 1) * 60);
                        crearLinea(cx1, cy1, cx2, cy2);
                    }
                }
            }
        }

        // Añadir el SVG y el Grid al DOM: 
        contenedorTablero.appendChild(svg);
        contenedorTablero.appendChild(grid);

        // 3. Dibujar las casillas interactivas y las fichas. 
        for(let row = 0; row < actualSize; row++){
            for(let col = 0; col < actualSize; col++) { 
                const box = document.createElement('div'); 
                box.classList.add('box'); 

                const value = boardState[row][col]; 

                if(value === 1) {
                    const piece = document.createElement('div'); 
                    piece.classList.add('red-piece'); 
                    box.appendChild(piece);

                } else if(value === 2) {
                    const piece = document.createElement('div');
                    piece.classList.add('blue-piece');
                    box.appendChild(piece);
                }

                // Si esta casilla contiene una pieza del oponente que puede ser soplada,
                // le añadimos la clase 'huffable' para resaltarla visualmente (borde amarillo vía CSS).
                if (huffCandidates.some(p => p.row === row && p.col === col)) {
                    box.classList.add('huffable');
                }

                if(checkboxTicked && checkboxTicked.row === row && checkboxTicked.col === col){
                    box.style.backgroundColor = 'rgba(255,255,0,0.5)'; 
                    box.style.borderRadius = '50%'; 
                }

                box.addEventListener('click', () => handleClickBox(row, col, value)); 
                grid.appendChild(box); 
            }
        }
    }

    //Máquina de estados para manejar la interacción del usuario con el tablero.
    // Regla del soplo + captura múltiple
    function handleClickBox(row, col, value) {
        //comprobar si el juego ha terminado o si es el turno del jugador 2 (ordenador).
        if (playerTurn === 2 || interactionMode === 'game_over') return;

        // Modo seleccionar pieza
        if(interactionMode === 'select_piece') { 

            // Antes de cualquier otra cosa, comprobar si el jugador quiere ejercer el soplo.
            if (huffCandidates.length > 0 && value === (playerTurn === 1 ? 2 : 1)) {
                // Comprobar si la pieza clicada es una de las que pueden ser sopladas
                let isHuffable = huffCandidates.some(p => p.row === row && p.col === col);
                //si es una pieza soplable, se elimina del tablero y se limpia la lista de soplos pendientes.
                if (isHuffable) {
                    boardState[row][col] = 0; //eliminar la pieza del tablero
                    huffCandidates = []; // Limpiar la lista de piezas infractoras después del soplo
                    displayMessages.innerText = `You huffed an opponent's piece! Now make your move.`;
                    drawBoard();
                    checkGameOver();
                    return; 
                }
            }

            // Solo puedes seleccionar tus propias fichas
            if(value === playerTurn) { 
                checkboxTicked = {row: row, col: col}; // Guardar la posición de la pieza seleccionada
                interactionMode = 'select_destination'; 
                displayMessages.innerText = `You've selected your piece. Tap the destination.`; 
                drawBoard(); 
            } else { 
                displayMessages.innerText = 'You must select a piece of your color.'; 
            }

         //Seleccionar destino de la pieza previamente seleccionada
        } else if(interactionMode === 'select_destination') {
            //si el jugador hace click en la misma pieza que ya había seleccionado, se cancela la selección y vuelve al modo de seleccionar pieza.
            if(row === checkboxTicked.row && col === checkboxTicked.col) {

                // No permitir cancelar si hay una cadena de capturas en curso
                if(visitedPositions.length > 0) {
                    displayMessages.innerText = 'You are in the middle of a multi-capture. You cannot cancel now.';
                    return; 
                }

                checkboxTicked = null; // Deseleccionar la pieza
                interactionMode = 'select_piece';  // Volver al modo de seleccionar pieza
                displayMessages.innerText = `Selection canceled.`;
                drawBoard(); 

            } else if(value === 0) { //si el jugador hace click en una casilla vacía: 
                
                let esMovimiento = validateNormalMovement(checkboxTicked.row, checkboxTicked.col, row, col, playerTurn);
                let esCaptura = validateCapture(checkboxTicked.row, checkboxTicked.col, row, col, playerTurn);

                // Comprobar si la casilla de destino ya fue visitada en esta cadena
                let visited = visitedPositions.some(pos => pos.row === row && pos.col === col); 
                //si es una captura múltiple, no se puede aterrizar en una casilla previamente visitada: 
                if(esCaptura && visited) {
                    displayMessages.innerText = 'You cannot land on a previously visited square during a multi-capture.';
                    return;
                }

                // A mitad de cadena no se permite un movimiento normal, solo capturar
                if(visitedPositions.length > 0 && esMovimiento) {
                    displayMessages.innerText = 'You are in the middle of a multi-capture. You must continue capturing.';
                    return;
                }

                // Si el movimiento es válido (ya sea normal o captura), se ejecuta la jugada
                if (esMovimiento || esCaptura) {

                    // Comprobar si ANTES del movimiento había alguna captura disponible.
                    let captureWasAvailable = compulsoryCaptureExists(playerTurn);
                    let capturingPieces = [];
                    //si habia capturas disponibles y el jugador no las hizo, se guardan las piezas infractoras para que puedan ser sopladas en el siguiente turno.
                    if (captureWasAvailable && visitedPositions.length === 0) {
                        capturingPieces = getCapturingPieces(playerTurn); // Guardar las piezas que podían capturar antes del movimiento
                    }

                    // Al moverse, el jugador renuncia al soplo pendiente del turno actual
                    huffCandidates = [];

                    // Mover la pieza
                    boardState[row][col] = playerTurn; 

                    // Vaciar la casilla de origen
                    boardState[checkboxTicked.row][checkboxTicked.col] = 0; 
                    
                    // Si fue captura, eliminar la pieza comida del tablero
                    if (esCaptura) {
                        let medioR = checkboxTicked.row + (row - checkboxTicked.row) / 2;
                        let medioC = checkboxTicked.col + (col - checkboxTicked.col) / 2;
                        boardState[medioR][medioC] = 0; 

                        // Memorizar el origen inicial y el nuevo destino en el historial del turno
                        if (visitedPositions.length === 0) {
                            visitedPositions.push({row: checkboxTicked.row, col: checkboxTicked.col});
                        }
                        visitedPositions.push({row: row, col: col});

                        // Comprobar si se puede seguir saltando desde la nueva posición
                        if (canCaptureAgain(row, col, playerTurn)) {
                            checkboxTicked = {row: row, col: col};
                            displayMessages.innerText = 'You can capture again! Select the next destination.';
                            drawBoard();
                            return; // No cambiar el turno aún
                        } else {
                            visitedPositions = []; // Reiniciar historial de casillas visitadas al finalizar la captura múltiple
                        }
                    }
  
                    checkboxTicked = null;  
                    interactionMode = 'select_piece'; 

                    // Cambiar el turno al otro jugador
                    playerTurn = playerTurn === 1 ? 2 : 1; 

                    // Solo hay soplo si el jugador NO capturó pero tenía capturas disponibles.
                    if (captureWasAvailable && !esCaptura) {
                        huffCandidates = capturingPieces.map(p => 
                            (p.row === row && p.col === col) ? p : 
                            (boardState[p.row][p.col] === 0 ? {row: row, col: col} : p)
                        );
                    }

                    drawBoard(); 

                    // Comprobar si la partida ha terminado; si no, lanzar turno del ordenador
                    if (!checkGameOver()) {
                        displayMessages.innerText = `Valid movement. Computer's turn (Blue)...`;
                        if (playerTurn === 2) {
                            setTimeout(computerTurn, 600);
                        }
                    } 

                } else {
                    displayMessages.innerText = 'Invalid movement (Check lines and rules).'; 
                }
            }
        }
    }

    // Skip turn
    btnPass.addEventListener('click', () => {
        if (interactionMode === 'game_over' || playerTurn === 2) return;

        // Cambiamos el turno al oponente
        playerTurn = 2;

        // Limpiamos cualquier seleccion a medias y el estado de capturas/soplos
        checkboxTicked = null;
        visitedPositions = []; // evita basura si se salta a mitad de cadena
        huffCandidates   = []; // renuncia a soplos pendientes
        interactionMode = 'select_piece';

        displayMessages.innerText = `You skipped your turn. It is now Computer's turn.`;
        drawBoard();

        if (!checkGameOver()) {
            setTimeout(computerTurn, 600);
        }
    });

    // Give up
    btnGiveUp.addEventListener('click', () => {
        if (interactionMode === 'game_over') return;

        // Sumar derrota en la tabla de clasificaciones para el tamaño actual
        stats[actualSize].losses++;
        updateRatings();

        // El jugador se rinde y el mensaje indica que ha perdido
        displayMessages.innerText = "You gave up. The computer wins the match!";

        // Limpiamos el estado de capturas/soplos antes de bloquear el tablero
        checkboxTicked   = null;
        visitedPositions = [];
        huffCandidates   = [];

        // Cambiamos el estado para bloquear nuevos clics en el tablero
        interactionMode = 'game_over';
        drawBoard();
    });

    // Propose a draw (Empate por mutuo acuerdo)
    btnDraw.addEventListener('click', () => {
        if (interactionMode === 'game_over') return;

        checkboxTicked   = null;
        visitedPositions = [];
        huffCandidates   = [];
        interactionMode  = 'game_over';

        displayMessages.innerText = "Match ended in a draw by mutual agreement!";
        drawBoard();
    });

    function conectedPieces(r1, c1, r2, c2){
        let dr = Math.abs(r1 - r2);
        let dc = Math.abs(c1 - c2);
        if (dr > 1 || dc > 1) return false; // Tienen que ser casillas contiguas
        if (dr === 1 && dc === 1){
            return (r1 + c1) % 2 === 0; // Solo hay diagonal si la suma es par
        }
        return true; // Movimiento horizontal o vertical valido
    }
    
    function validateNormalMovement(originRow, originCol, destRow, destCol, player){
        if((!conectedPieces(originRow, originCol, destRow, destCol))) {
            return false; 
        }

        let advanceR = destRow - originRow;
        if(player === 1){
            if(advanceR < 0) return false; // Rojas no retroceden
            if(originRow === actualSize - 1 && advanceR !== 0) return false;
        } else {
            if(advanceR > 0) return false; // Azules no pueden avanzar hacia abajo
            if(originRow === 0 && advanceR !== 0) return false; 
        }
        return true; 
    }

    function validateCapture(originRow, originCol, destRow, destCol, player){
        let dr = destRow - originRow; // Diferencia de filas totales del salto
        let dc = destCol - originCol; // Diferencia de columnas totales del salto

        if ((Math.abs(dr) !== 2 && dr !== 0) || (Math.abs(dc) !== 2 && dc !== 0)) return false;
        if (Math.abs(dr) === 2 && Math.abs(dc) === 1) return false; 
        if (Math.abs(dr) === 1 && Math.abs(dc) === 2) return false; 

        let pasR = dr === 0 ? 0 : dr / 2; // fila intermedia
        let pasC = dc === 0 ? 0 : dc / 2; // columna intermedia

        if(!conectedPieces(originRow, originCol, originRow + pasR, originCol + pasC)) return false; 

        let rival = player === 1 ? 2 : 1;
        if(boardState[originRow + pasR][originCol + pasC] !== rival) return false;
        
        return true;
    }

    function compulsoryCaptureExists(player){
        let jumps = [ [-2, 0], [2, 0], [0, -2], [0, 2], [-2, -2], [-2, 2], [2, -2], [2, 2] ]; 
        
        for(let r = 0; r < actualSize; r++){
            for(let c = 0; c < actualSize; c++){
                if(boardState[r][c] === player){
                    for(let s of jumps) {
                        let destR = r + s[0];
                        let destC = c + s[1];
                        if(destR >= 0 && destR < actualSize && destC >= 0 && destC < actualSize){
                            if(boardState[destR][destC] === 0 && validateCapture(r, c, destR, destC, player)){
                                return true; // Existe un salto obligatorio
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    // Devuelve la lista de TODAS las piezas del jugador que actualmente podrían capturar.
    function getCapturingPieces(player) {
        let pieces = [];
        let jumps = [ [-2, 0], [2, 0], [0, -2], [0, 2], [-2, -2], [-2, 2], [2, -2], [2, 2] ];

        for (let r = 0; r < actualSize; r++) {
            for (let c = 0; c < actualSize; c++) {
                if (boardState[r][c] === player) {
                    for (let s of jumps) {
                        let destR = r + s[0];
                        let destC = c + s[1];

                        if (destR >= 0 && destR < actualSize && destC >= 0 && destC < actualSize) {
                            if (boardState[destR][destC] === 0 && validateCapture(r, c, destR, destC, player)) {
                                pieces.push({row: r, col: c});
                                break; 
                            }
                        }
                    }
                }
            }
        }

        return pieces;
    }

    // Función detectora de saltos contiguos para captura múltiple. 
    function canCaptureAgain(r, c, player) {
        let jumps = [ [-2, 0], [2, 0], [0, -2], [0, 2], [-2, -2], [-2, 2], [2, -2], [2, 2] ];
        for(let s of jumps) { 
            let destR = r + s[0]; 
            let destC = c + s[1]; 

            if(destR >= 0 && destR < actualSize && destC >= 0 && destC < actualSize){
                let visited = visitedPositions.some(pos => pos.row === destR && pos.col === destC); 
                if(boardState[destR][destC] === 0 && !visited && validateCapture(r, c, destR, destC, player)){
                    return true; // Existe un salto contiguo
                }
            }
        }
        return false;
    }

    // Función para verificar si el jugador actual tiene movimientos válidos disponibles
    function hasValidMoves(player) {
        if (compulsoryCaptureExists(player)) {
            return true;
        }

        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ];

        for (let r = 0; r < actualSize; r++) {
            for (let c = 0; c < actualSize; c++) {
                if (boardState[r][c] === player) {
                    for (let d of directions) {
                        let destR = r + d[0];
                        let destC = c + d[1];
                        if (destR >= 0 && destR < actualSize && destC >= 0 && destC < actualSize) {
                            if (boardState[destR][destC] === 0 && validateNormalMovement(r, c, destR, destC, player)) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    // Función para actualizar la tabla de clasificaciones en el panel de estadísticas
    function updateRatings() {
        document.getElementById('wins-3').innerText = stats[3].wins;
        document.getElementById('losses-3').innerText = stats[3].losses;
        document.getElementById('wins-5').innerText = stats[5].wins;
        document.getElementById('losses-5').innerText = stats[5].losses;
    }

    // Función para comprobar si el juego ha terminado y actualizar el estado del juego y las estadísticas
    function checkGameOver() {
        if (!hasValidMoves(playerTurn)) {
            interactionMode = 'game_over';
            visitedPositions = [];
            huffCandidates = [];
            if (playerTurn === 2) {
                stats[actualSize].wins++;
                displayMessages.innerText = "Congratulations! You won the match!";
            } else {
                stats[actualSize].losses++;
                displayMessages.innerText = "Game Over! You have no valid moves left. Computer wins!";
            }
            updateRatings();
            drawBoard();
            return true;
        }
        return false;
    }

    //función para gestionar el turno del ordenador. 
    function computerTurn() {
        //verificar que el juego no haya terminado y que sea el turno del ordenador (2)
        if (interactionMode === 'game_over' || playerTurn !== 2) return;

        //Regla del soplo: si el jugador anterior tenía captura disponible y no la hizo, el ordenador sopla una de sus piezas.
        if (huffCandidates.length > 0) {
            let pieceToHuff = huffCandidates[0]; // Elegimos la primera pieza infractora para soplar
            boardState[pieceToHuff.row][pieceToHuff.col] = 0; // Eliminamos la pieza del tablero
            huffCandidates = []; // Limpiamos la lista de piezas infractoras después del soplo
            displayMessages.innerText = "Computer huffed one of your pieces for not capturing!";
            drawBoard(); //dibujar el tablero actualizado después del soplo
            if (checkGameOver()) return; // Comprobar si el soplo terminó la partida
        }

        // 2. Recopilar todas las jugadas válidas del ordenador (fichas azules = 2)
        let possibleCaptures = [];
        let possibleMoves = [];

        const jumpDirs = [ [-2, 0], [2, 0], [0, -2], [0, 2], [-2, -2], [-2, 2], [2, -2], [2, 2] ];
        const moveDirs = [ [-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1] ];

        for (let r = 0; r < actualSize; r++) {
            for (let c = 0; c < actualSize; c++) {
                if (boardState[r][c] === 2) {
                    // Capturas disponibles
                    for (let j of jumpDirs) {
                        let destR = r + j[0];
                        let destC = c + j[1];
                        if (destR >= 0 && destR < actualSize && destC >= 0 && destC < actualSize) {
                            if (boardState[destR][destC] === 0 && validateCapture(r, c, destR, destC, 2)) {
                                possibleCaptures.push({
                                    type: 'capture',
                                    fromR: r, fromC: c,
                                    toR: destR, toC: destC
                                });
                            }
                        }
                    }
                    // Movimientos normales disponibles
                    for (let m of moveDirs) {
                        let destR = r + m[0];
                        let destC = c + m[1];
                        if (destR >= 0 && destR < actualSize && destC >= 0 && destC < actualSize) {
                            if (boardState[destR][destC] === 0 && validateNormalMovement(r, c, destR, destC, 2)) {
                                possibleMoves.push({
                                    type: 'move',
                                    fromR: r, fromC: c,
                                    toR: destR, toC: destC
                                });
                            }
                        }
                    }
                }
            }
        }

        // Guardamos qué piezas azules podían capturar por si en modo 'easy' no captura
        let blueCapturingPieces = getCapturingPieces(2);

        // Elegir jugada según iaLevel ('easy' vs 'difficult')
        let chosenAction = null;

        if (iaLevel === 'difficult') {
            if (possibleCaptures.length > 0) {
                chosenAction = possibleCaptures[Math.floor(Math.random() * possibleCaptures.length)];
            } else if (possibleMoves.length > 0) {
                chosenAction = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            }
        } else {
            // Modo 'easy': elige al azar entre todas las jugadas posibles
            let allActions = possibleCaptures.concat(possibleMoves);
            if (allActions.length > 0) {
                chosenAction = allActions[Math.floor(Math.random() * allActions.length)];
            }
        }

        if (!chosenAction) {
            checkGameOver();
            return;
        }

        //Ejecutar movimiento o captura
        boardState[chosenAction.toR][chosenAction.toC] = 2;
        boardState[chosenAction.fromR][chosenAction.fromC] = 0;

        if (chosenAction.type === 'capture') {
            let midR = chosenAction.fromR + (chosenAction.toR - chosenAction.fromR) / 2;
            let midC = chosenAction.fromC + (chosenAction.toC - chosenAction.fromC) / 2;
            boardState[midR][midC] = 0;

            visitedPositions = [
                { row: chosenAction.fromR, col: chosenAction.fromC },
                { row: chosenAction.toR, col: chosenAction.toC }
            ];

            drawBoard();

            // Si puede encadenar otra captura múltiple, continúa tras 600ms
            if (canCaptureAgain(chosenAction.toR, chosenAction.toC, 2)) {
                displayMessages.innerText = "Computer captured a piece and continues jumping...";
                setTimeout(() => continueComputerCapture(chosenAction.toR, chosenAction.toC), 600);
                return;
            } else {
                visitedPositions = [];
            }
        } else if (blueCapturingPieces.length > 0) {
            // Si el ordenador hizo un movimiento normal pero tenía captura disponible (modo easy),
            // sus piezas infractoras quedan marcadas en huffCandidates para que el humano pueda soplarlas
            huffCandidates = blueCapturingPieces.map(p =>
                (p.row === chosenAction.fromR && p.col === chosenAction.fromC)
                    ? { row: chosenAction.toR, col: chosenAction.toC }
                    : p
            );
        }

        // Devolver el turno al jugador 1
        playerTurn = 1;
        drawBoard();
        if (!checkGameOver()) {
            if (huffCandidates.length > 0) {
                displayMessages.innerText = "Your turn (Red)! Computer missed a capture: click its highlighted piece to huff it, or make your move.";
            } else {
                displayMessages.innerText = "Computer moved. Your turn (Red)!";
            }
        }
    }

    //Función recursiva para encadenar capturas múltiples del ordenador en un turno.
    //Se llama a sí misma si tras una captura el ordenador puede seguir capturando desde la nueva posición.
    function continueComputerCapture(r, c) {
        if (interactionMode === 'game_over') return;

        //direcciones de salto posibles para capturas
        const jumpDirs = [ [-2, 0], [2, 0], [0, -2], [0, 2], [-2, -2], [-2, 2], [2, -2], [2, 2] ];
        let nextCaptures = [];

        // Comprobar todas las direcciones de salto desde la posición actual del ordenador
        for (let j of jumpDirs) {
            let destR = r + j[0]; // fila destino
            let destC = c + j[1]; // columna destino
            //si la casilla destino esta dentro de los limites del tablero: 
            if (destR >= 0 && destR < actualSize && destC >= 0 && destC < actualSize) {
                //se comprueba si la casilla destino ya fue visitada en esta cadena de capturas múltiples
                let visited = visitedPositions.some(pos => pos.row === destR && pos.col === destC);
                //si la casilla destino es vacía, no ha sido visitada y es un salto válido, se añade a la lista de capturas posibles
                if (boardState[destR][destC] === 0 && !visited && validateCapture(r, c, destR, destC, 2)) {
                    nextCaptures.push({ toR: destR, toC: destC }); // Añadir a las capturas posibles
                }
            }
        }

        //si la lista de capturas posibles no está vacía se elige una al azar y se ejecuta la captura, actualizando el tablero y el historial de posiciones visitadas.
        if (nextCaptures.length > 0) {
            let chosen = nextCaptures[Math.floor(Math.random() * nextCaptures.length)]; //elegir captura al azar
            boardState[chosen.toR][chosen.toC] = 2; // colocar la ficha azul en la casilla destino
            boardState[r][c] = 0; // vaciar la casilla de origen

            let midR = r + (chosen.toR - r) / 2; // fila intermedia (la de pieza capturada)
            let midC = c + (chosen.toC - c) / 2; // columna intermedia (la de pieza capturada)
            boardState[midR][midC] = 0; //eliminar la pieza capturada del tablero

            visitedPositions.push({ row: chosen.toR, col: chosen.toC }); //añadir a historial de posiciones visitadas la nueva casilla destino
            drawBoard();

            //validar si desde la nueva posición se puede seguir capturando, en cuyo caso se llama a sí misma tras 600ms para continuar la cadena de capturas.
            if (canCaptureAgain(chosen.toR, chosen.toC, 2)) {
                setTimeout(() => continueComputerCapture(chosen.toR, chosen.toC), 1200);
                return;
            }
        }

        visitedPositions = []; // Reiniciar historial de posiciones visitadas al finalizar la cadena de capturas
        playerTurn = 1; //cambiar el turno al jugador 1 
        drawBoard();
        // Comprobar si la partida ha terminado; si no, mostrar mensaje de turno del siguiente jugador
        if (!checkGameOver()) {
            displayMessages.innerText = "Computer finished capturing. Your turn (Red)!";
        }
    }

    // INICIAR / APLICAR CONFIGURACIÓN DE PARTIDA
    function startNewGame() {
        actualSize = parseInt(selectSize.value); 
        iaLevel = selectIA.value;
        playerTurn = selectTurn.value === 'red' ? 1 : 2;

        generateDashboard(actualSize); 

        // Limpiamos todo el estado de interacción al reiniciar tablero
        checkboxTicked   = null;
        visitedPositions = [];
        huffCandidates   = [];
        interactionMode  = 'select_piece'; 

        drawBoard();  

        if (playerTurn === 2) {
            displayMessages.innerText = `Board generated (${actualSize}x${actualSize}). Computer starts (Blue)...`;
            setTimeout(computerTurn, 600);
        } else {
            displayMessages.innerText = `Board generated with dimensions ${actualSize}x${actualSize}. Your turn (Red)!`;
        }
    }

    btnApply.addEventListener('click', startNewGame);
    btnStart.addEventListener('click', startNewGame);

    startNewGame(); 
});