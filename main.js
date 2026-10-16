document.addEventListener('DOMContentLoaded', () => {
    // Referencia al contenedor principal del html
    const contenedorTablero = document.getElementById('tablero');

    // Creamos el contenedor de la cuadricula
    const grid = document.createElement('div');
    grid.id = 'tablero-grid';
    contenedorTablero.appendChild(grid);

    // Botones e Interfaz 
    const btnApply = document.getElementById('btn-apply-settings'); // Corregido: guion en vez de punto
    const selectSize = document.getElementById('select-size'); 
    const displayMessages = document.querySelector('#mensajes p'); // Corregido: escrito igual que en el HTML

    // Paneles superpuestos
    const dialogInstructions = document.getElementById('Instructions'); 
    const btnSeeInstructions = document.getElementById('btn-instructions'); 
    const btnCloseInstructions = document.getElementById('close-instructions'); 

    const dialogRatings = document.getElementById('ratings'); // Corregido: apuntaba a Instructions
    const btnSeeRating = document.getElementById('btn-ratings'); 
    const btnCloseRatings = document.getElementById('close-rankings'); // Asegúrate de que el HTML tenga id="close-rankings"

    // variables de estado 
    let boardState = []; 
    let actualSize = 5; 
    let playerTurn = 1;

    // modos de juego: seleccionar pieza o seleccionar destino
    let interactionMode = 'select_piece'; 
    // casilla seleccionada
    let checkboxTicked = null; // guardará la fila y columna de la pieza clicada 

    // EVENTOS DE LA INTERFAZ (abrir/cerrar paneles)
    btnSeeInstructions.addEventListener('click', () => dialogInstructions.showModal()); 
    btnCloseInstructions.addEventListener('click', () => dialogInstructions.close()); 

    btnSeeRating.addEventListener('click', () => dialogRatings.showModal()); 
    btnCloseRatings.addEventListener('click', () => dialogRatings.close()); 

    // GENERACIÓN DINÁMICA DEL TABLERO
    function generateDashboard(size) {
        boardState = []; 
        const totalBoxes = size * size; 
        const centralPosition = Math.floor(totalBoxes/2); 
        let accountant = 0; 

        for(let row=0; row<size; row++) {
            let actualRow = []; 
            for(let col = 0; col<size; col++) {
                if(accountant < centralPosition) {
                    actualRow.push(1); // ficha roja
                } else if(accountant === centralPosition) {
                    actualRow.push(0); // hueco vacío
                } else {
                    actualRow.push(2); // ficha azul
                }   
                accountant++; 
            }
            boardState.push(actualRow); 
        }
    } 

    function drawBoard(){
        contenedorTablero.innerHTML = ''; // Limpiamos el contenedor completo
        
        // 1. Crear el contenedor de las casillas (las intersecciones)
        const grid = document.createElement('div');
        grid.id = 'tablero-grid';
        grid.style.gridTemplateColumns = `repeat(${actualSize}, 60px)`; 
        grid.style.gridTemplateRows = `repeat(${actualSize}, 60px)`; 
        
        // 2. Crear el SVG para dibujar las líneas
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = "tablero-lineas";
        
        // Tamaño total del SVG basado en el número de celdas * 60px
        const totalDimension = actualSize * 60;
        
        // Función auxiliar para dibujar líneas en el SVG
        function crearLinea(x1, y1, x2, y2) {
            const linea = document.createElementNS("http://www.w3.org/2000/svg", "line");
            linea.setAttribute("x1", x1);
            linea.setAttribute("y1", y1);
            linea.setAttribute("x2", x2);
            linea.setAttribute("y2", y2);
            linea.setAttribute("stroke", "#888");
            linea.setAttribute("stroke-width", "3");
            svg.appendChild(linea);
        }

        // Centro geométrico de la primera y última celda para alinear las líneas
        const offset = 30; // La mitad de 60px (centro de la casilla)
        const maxOffset = totalDimension - 30;

        // Dibujar las líneas rectas (horizontales y verticales)
        for(let i = 0; i < actualSize; i++) {
            let pos = offset + (i * 60);
            crearLinea(offset, pos, maxOffset, pos); // Horizontal
            crearLinea(pos, offset, pos, maxOffset); // Vertical
        }

        // Dibujar las líneas diagonales correctamente (solo desde nodos pares)
        for(let row = 0; row < actualSize; row++) {
            for(let col = 0; col < actualSize; col++) {
                // En el alquerque, solo las casillas (row + col) pares tienen diagonales
                if ((row + col) % 2 === 0) {
                    let cx1 = offset + (col * 60);
                    let cy1 = offset + (row * 60);
                    
                    // Diagonal hacia abajo-derecha
                    if (row + 1 < actualSize && col + 1 < actualSize) {
                        let cx2 = offset + ((col + 1) * 60);
                        let cy2 = offset + ((row + 1) * 60);
                        crearLinea(cx1, cy1, cx2, cy2);
                    }
                    // Diagonal hacia abajo-izquierda
                    if (row + 1 < actualSize && col - 1 >= 0) {
                        let cx2 = offset + ((col - 1) * 60);
                        let cy2 = offset + ((row + 1) * 60);
                        crearLinea(cx1, cy1, cx2, cy2);
                    }
                }
            }
        }

        // Añadir el SVG y el Grid al DOM
        contenedorTablero.appendChild(svg);
        contenedorTablero.appendChild(grid);

        // 3. Dibujar las casillas interactivas y las fichas
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

                if(checkboxTicked && checkboxTicked.row === row && checkboxTicked.col === col){
                    box.style.backgroundColor = 'rgba(255,255,0,0.5)'; 
                    box.style.borderRadius = '50%'; // Resaltado circular para adaptarse a la intersección
                }

                box.addEventListener('click', () => handleClickBox(row, col, value)); 
                grid.appendChild(box); 
            }
        }
    }

    function handleClickBox(row, col, value) {
        if(interactionMode === 'select_piece') {
            // Solo puedes seleccionar tus propias fichas
            if(value === playerTurn) { 
                checkboxTicked = {row: row, col: col}; 
                interactionMode = 'select_destination'; 
                displayMessages.innerText = `You've selected your piece. Tap the destination.`; 
                drawBoard(); 
            } else {
                displayMessages.innerText = 'You must select a piece of your color (Red).'; 
            }
        } else if(interactionMode === 'select_destination') {
            if(row === checkboxTicked.row && col === checkboxTicked.col) {
                checkboxTicked = null; 
                interactionMode = 'select_piece'; 
                displayMessages.innerText = `Selection canceled.`; 
                drawBoard(); 
            } else if(value === 0) {
                let esMovimiento = validateNormalMovement(checkboxTicked.row, checkboxTicked.col, row, col, playerTurn);
                let esCaptura = validateCapture(checkboxTicked.row, checkboxTicked.col, row, col, playerTurn);

                // Si es un movimiento normal pero hay capturas obligatorias disponibles en el tablero, lo bloqueamos
                if (esMovimiento && compulsoryCaptureExists(playerTurn)) {
                    displayMessages.innerText = 'Illegal move: You must capture if possible.';
                    return;
                }

                if (esMovimiento || esCaptura) {
                    // Mover la pieza
                    boardState[row][col] = playerTurn; 
                    boardState[checkboxTicked.row][checkboxTicked.col] = 0; 
                    
                    // Si fue captura, eliminar la pieza comida del tablero
                    if (esCaptura) {
                        let medioR = checkboxTicked.row + (row - checkboxTicked.row) / 2;
                        let medioC = checkboxTicked.col + (col - checkboxTicked.col) / 2;
                        boardState[medioR][medioC] = 0; 
                    }

                    checkboxTicked = null; 
                    interactionMode = 'select_piece'; 
                    // Cambiar turno (esto deberás vincularlo a tu IA en el siguiente paso)
                    playerTurn = playerTurn === 1 ? 2 : 1; 

                    displayMessages.innerText = `Valid Movement. ${playerTurn} turn.`; 
                    drawBoard(); 
                } else {
                    displayMessages.innerText = 'Invalid movement (Check lines and rules).'; 
                }
            }
        }
    }

    // Referencias a los botones
    const btnPass = document.getElementById('btn-pass');
    const btnGiveUp = document.getElementById('btn-giveup');

    // Skip turn
    btnPass.addEventListener('click', () => {
        if (interactionMode === 'game_over') return;

        // Cambiamos el turno al oponente
        playerTurn = playerTurn === 1 ? 2 : 1;

        // Limpiamos cualquier seleccion a medias
        checkboxTicked = null;
        interactionMode = 'select_piece';

        displayMessages.innerText = `You skipped your turn. It is now Player ${playerTurn}'s turn.`;
        drawBoard();
    });

    // Give up
    btnGiveUp.addEventListener('click', () => {
        if (interactionMode === 'game_over') return;

        // El jugador se rinde y el mensaje indica que ha perdido
        displayMessages.innerText = "You gave up. The computer wins the match!";

        // Cambiamos el estado para bloquear nuevos clics en el tablero
        interactionMode = 'game_over';
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

        /**Para las piezas rojas (que empiezan arriba y bajan): Su última fila (la línea de fondo donde ya no pueden avanzar más hacia adelante) 
         * es la fila de más abajo del tablero. En código, esto se representa como actualSize - 1 
         * (es decir, la fila 4 en un tablero de 5x5).
         * Para las piezas azules (que empiezan abajo y suben): Su última fila es la de más arriba del tablero. 
         * En código, esto es la fila 0.
         */
        let advanceR = destRow - originRow;
        if(player === 1){
            if(advanceR < 0) return false; // Rojas no retroceden
            // CORREGIDO: Usar originRow en vez de advanceR
            if(originRow === actualSize - 1 && advanceR !== 0) return false;
        } else {
            if(advanceR > 0) return false; // Azules no pueden avanzar hacia arriba
            if(originRow === 0 && advanceR !== 0) return false; 
            //Si la ficha está en la fila de arriba del todo, no puede moverse verticalmente.
        }
        return true; 
    }

    function validateCapture(originRow, originCol, destRow, destCol, player){
        let dr = destRow - originRow; // Diferencia de filas totales del salto
        let dc = destCol - originCol; // Diferencia de columnas totales del salto

        // El salto debe ser de exactamente 2 posiciones (en cualquier dirección)
        //si la diferencia es 2 en una dirección, debe ser 0 en la otra para ser un salto válido. 
        if ((Math.abs(dr) !== 2 && dr !== 0) || (Math.abs(dc) !== 2 && dc !== 0)) return false;
        if (Math.abs(dr) === 2 && Math.abs(dc) === 1) return false; //no se permiten saltos en diagonal de 2x1
        if (Math.abs(dr) === 1 && Math.abs(dc) === 2) return false; //no se permiten saltos en diagonal de 1x2

        //dr y dc valdrán 2, -2 o 0. Al dividir estos valores entre 2, obtenemosa dirección de un solo paso (1, -1 o 0) para ubicar la casilla intermedia.
        //el operador === 0 ? 0 : asegura que si no hay movimiento en una dirección, el paso intermedio también sea 0, evitando errores de cálculo.
        let pasR = dr === 0 ? 0 : dr / 2; // fila intermedia
        let pasC = dc === 0 ? 0 : dc / 2; // columna intermedia

        /**Si a fiche roja esta en la posición [0,0] y se quiere saltar a [2,2]
         * dr es 2 (2-0) y dc es 2 (2-0). Al dividir ambos entre 2, obtenemos pasR = 1 y pasC = 1.
         * La coordenada intermedia sería [0 + 1, 0 + 1] = [1,1], que es la casilla que debe contener la ficha del rival para que el salto sea válido.
         */

        /**comprueba si la casilla de origen y la casilla intermedia están unidas por un camino legal. */
        if(!conectedPieces(originRow, originCol, originRow + pasR, originCol + pasC)) return false; // La pieza intermedia debe estar conectada 

        // La casilla intermedia debe tener una ficha del rival. 
        //si el jugador activo es el 1, el rival debe ser el 2 (y viceversa).
        let rival = player === 1 ? 2 : 1;
        if(boardState[originRow + pasR][originCol + pasC] !== rival) return false;
        /**revisa qué número hay guardado en boardState[1][1]. Si encuentra un 0 (casilla vacía) o un 1 
         * (una ficha de tu propio equipo), devuelve false porque el movimiento es ilegal. 
         * Solo devolverá true si en esa matriz encuentra el 2 correspondiente a la ficha azul del adversario. */
        
        return true;
    }

    function compulsoryCaptureExists(player){
        //diferencias de coordenadas para los posibles saltos (2 casillas en cualquier dirección). 
        let jumps = [ [-2, 0], [2, 0], [0, -2], [0, 2], [-2, -2], [-2, 2], [2, -2], [2, 2] ]; // todas las direcciones posibles de salto
        
        //Recorre la matriz que forma el tablero
        for(let r = 0; r < actualSize; r++){
            for(let c = 0; c < actualSize; c++){
                //si es tu turno el algoritmo ignora las casillas vacías y las del rival, y solo se fija en tus fichas.
                //el algoritmo comprueba si hay un salto obligatorio para el jugador activo.
                if(boardState[r][c] === player){
                    //por cada ficha tuya encontrada proyecta los 8 saltos sumando la coordenada actual a los valores del array jumps, obteniendo el destino hipotético. 
                    for(let s of jumps) {
                        let destR = r + s[0];
                        let destC = c + s[1];
                        //comprobar que el aterrizaje hipotetico del salto esta dentro de los limites del tablero
                        if(destR >= 0 && destR < actualSize && destC >= 0 && destC < actualSize){
                             //si el destino está dentro del tablero, comprueba si la casilla de destino está vacía y si el salto es legal (captura obligatoria).
                            if(boardState[destR][destC] === 0 && validateCapture(r, c, destR, destC, player)){
                                return true; // Existe un salto obligatorio
                            }
                        }
                    }
                }
            }
        }
        //no hay saltos obligatorios para el jugador activo
        return false;
    }
    
    // APLICAR CONFIGURACIÓN.  
    btnApply.addEventListener('click', ()=> {
        actualSize = parseInt(selectSize.value); 
        generateDashboard(actualSize); 
        checkboxTicked = null;
        interactionMode = 'select_piece'; 
        // Corregido: uso de backticks
        displayMessages.innerText = `Board generated with dimensions ${actualSize}x${actualSize}. Let the game begin!`;
        drawBoard();  
    }); 

    generateDashboard(actualSize); 
    drawBoard(); 
});