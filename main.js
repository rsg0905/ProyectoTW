//envuelto en evento DOMContentLoaded para asegurar que el DOM esté completamente cargado antes de ejecutar el código JS
//Es decir, el código JS se ejecutará solo después de que todo el HTML haya sido procesado y renderizado por el navegador, evitando errores de referencia a elementos que aún no existen en el DOM.
document.addEventListener('DOMContentLoaded', () => {
    // Referencia al contenedor principal del html
    const containerTabelle = document.getElementById('tablero');

    // Creamos el contenedor de la cuadricula
    const grid = document.createElement('div');
    grid.id = 'tablero-grid';
    containerTabelle.appendChild(grid);

    // Botones e Interfaz 
    const btnApply = document.getElementById('btn-apply-settings'); 
    const selectSize = document.getElementById('select-size'); 
    const displayMessages = document.querySelector('#mensajes p'); 

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
    let visitedPositions = []; // para almacenar las posiciones visitadas durante un turno de captura múltiple

    // EVENTOS DE LA INTERFAZ (abrir/cerrar paneles)
    btnSeeInstructions.addEventListener('click', () => dialogInstructions.showModal()); 
    btnCloseInstructions.addEventListener('click', () => dialogInstructions.close()); 

    btnSeeRating.addEventListener('click', () => dialogRatings.showModal()); 
    btnCloseRatings.addEventListener('click', () => dialogRatings.close()); 


    // GENERACIÓN DINÁMICA DEL TABLERO
    function generateDashboard(size) {
        boardState = []; 
        const totalBoxes = size * size; // número total de casillas
        const centralPosition = Math.floor(totalBoxes/2); //calcula la posición central del tablero (para dejarla vacía)
        let accountant = 0; // contador para recorrer todas las casillas del tablero

        //RECORRIDO DE FILAS Y COLUMNAS PARA CREAR LA MATRIZ DEL TABLERO.
        for(let row=0; row<size; row++) {
            let actualRow = []; 
            for(let col = 0; col<size; col++) {
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
    //Traduce la matriz de numeros  en elementos visuales (divs y SVG) que representan las casillas y las fichas en el DOM.
    function drawBoard(){
        containerTabelle.innerHTML = ''; // Limpiamos el contenedor completo

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

        //el SVG con las lineas dibujadas y el contenedor CSS de las casillas solo existen en la memoria RAM del ordenador. 
        //Al usar appendChild se inyenctan fisicamente en la etiquete <main id="tablero"> del HTML y se muestran en la pantalla del usuario.
        // El SVG se coloca primero para que las líneas queden detrás de las casillas interactivas
        
        // Añadir el SVG y el Grid al DOM: 
        containerTabelle.appendChild(svg);
        containerTabelle.appendChild(grid);

        // 3. Dibujar las casillas interactivas y las fichas. 
        //recorrer la matriz boardState para crear cada casilla y colocar las fichas según el valor (0, 1 o 2)
        for(let row = 0; row < actualSize; row++){
            for(let col = 0; col < actualSize; col++) { 
                //1. crear la casilla (div) y asignarle la clase CSS 'box' para que tenga el estilo adecuado
                const box = document.createElement('div'); 
                box.classList.add('box'); //60 px de ancho y alto, borde redondeado, cursor pointer, etc.
                //esta caja actua como un botón que el usuario puede clicar para seleccionar una ficha o un destino.

                //leer el numero guardado en boardState para saber si hay ficha roja, azul o casilla vacía
                const value = boardState[row][col]; 

                if(value === 1) {
                    //1. crear un div para la ficha 
                    const piece = document.createElement('div'); 
                    //2. asignarle la clase CSS 'red-piece' para que tenga el estilo adecuado (color rojo, borde redondeado, etc.)
                    piece.classList.add('red-piece'); 
                    //3. meter la ficha dentro de la casilla (box) para que se muestre en el tablero
                    box.appendChild(piece);

                } else if(value === 2) {
                    //1. crear un div para la ficha
                    const piece = document.createElement('div');
                    //2. asignarle la clase CSS 'blue-piece' para que tenga el estilo adecuado (color azul, borde redondeado, etc.)
                    piece.classList.add('blue-piece');
                    //3. meter la ficha dentro de la casilla (box) para que se muestre en el tablero
                    box.appendChild(piece);
                }

                //comprober si la caja q está dibujando en ese momento es la misma que el usuario ha clicado para seleccionar una ficha (checkboxTicked). Si es así, se le aplica un estilo especial para que se vea resaltada.
                if(checkboxTicked && checkboxTicked.row === row && checkboxTicked.col === col){
                   //si coinciden se aplica un estilo especial a la casilla para que se vea resaltada (fondo amarillo semitransparente y borde redondeado)
                    box.style.backgroundColor = 'rgba(255,255,0,0.5)'; 
                    box.style.borderRadius = '50%'; // Resaltado circular para adaptarse a la intersección
                }
                //cuando el usuario hace click en una casilla, se llama a la función handleClickBox con la fila, columna y valor de esa casilla.
                box.addEventListener('click', () => handleClickBox(row, col, value)); 
                
                //se coloca la casilla (box) dentro del contenedor CSS (grid) para que se muestre en el tablero
                grid.appendChild(box); 
            }
        }
    }

    //Máquina de estados para manejar la interacción del usuario con el tablero.
    function handleClickBox(row, col, value) {
        if(interactionMode === 'select_piece') { //el juego espera que el usuario seleccione una ficha propia para moverla
            // Solo puedes seleccionar tus propias fichas
            if(value === playerTurn) { //comprobar si la ficha clicada pertenece al jugador activo (1 para rojo, 2 para azul)
                checkboxTicked = {row: row, col: col}; 
                interactionMode = 'select_destination'; //cambiar el modo de interacción para que el juego espere que el usuario seleccione un destino válido para mover la ficha previamente seleccionada
                displayMessages.innerText = `You've selected your piece. Tap the destination.`; 
                drawBoard(); 
            } else { //si el usuario clicó una casilla vacía o una ficha del rival, se le muestra un mensaje de error
                displayMessages.innerText = 'You must select a piece of your color (Red).'; 
            }

            //el juego espera que el usuario seleccione un destino válido para mover la ficha previamente seleccionada
        } else if(interactionMode === 'select_destination') {
            //si el usuario clicó la misma casilla que ya había seleccionado para mover la ficha, se cancela la selección y se vuelve al modo de seleccionar pieza. 
            if(row === checkboxTicked.row && col === checkboxTicked.col) {

                if(visitedPositions.length > 0) {
                    displayMessages.innerText = 'You are un the middle of a multi-capture. You cannot cancel now.';
                    return; // No permitir cancelar si hay capturas en curso
                }

                checkboxTicked = null; 
                interactionMode = 'select_piece';  //volver al modo de seleccionar pieza
                displayMessages.innerText = `Selection canceled.`; 
                drawBoard(); 

            } else if(value === 0) { //comprobar si la casilla clicada está vacía (0) para intentar mover la ficha seleccionada a esa posición
                
                let esMovimiento = validateNormalMovement(checkboxTicked.row, checkboxTicked.col, row, col, playerTurn);
                //guarda true si es un paso asyacente legal
                let esCaptura = validateCapture(checkboxTicked.row, checkboxTicked.col, row, col, playerTurn);
                //guarda true si es un salto legal sobre un enemigo (captura)

                let visited = visitedPositions.some(pos => pos.row === row && pos.col === col); // comprueba si la posición de destino ha sido visitada
                if(esCaptura && visited) {
                    displayMessages.innerText = 'You cannot land on a previously visited square during a multi-capture.';
                    return;
                }

                if(visitedPositions.length > 0 && esMovimiento) {
                    displayMessages.innerText = 'You are in the middle of a multi-capture. You must continue capturing.';
                    return;
                }

                // Si es un movimiento normal pero hay capturas obligatorias disponibles en el tablero, lo bloqueamos
                if (visitedPositions.length === 0 && esMovimiento && compulsoryCaptureExists(playerTurn)) {
                    displayMessages.innerText = 'Illegal move: You must capture if possible.';
                    return;
                }

                if (esMovimiento || esCaptura) {
                    // Mover la pieza
                    boardState[row][col] = playerTurn; 
                    boardState[checkboxTicked.row][checkboxTicked.col] = 0; //se deja vacía la casilla de origen
                    
                    // Si fue captura, eliminar la pieza comida del tablero
                    if (esCaptura) {
                        //se calcula donde estaba exactamente la ficha rival. Se resta la coordenada de destino menos 
                        //la de origen y se divide entre 2 para encontrar la casilla intermedia que contiene la ficha rival.
                        let medioR = checkboxTicked.row + (row - checkboxTicked.row) / 2;
                        let medioC = checkboxTicked.col + (col - checkboxTicked.col) / 2;
                        boardState[medioR][medioC] = 0; //se elimina la ficha rival de la casilla intermedia

                        //Memorizar el origen inicial y el nuevo destino en el historial del turno
                        if (visitedPositions.length === 0) {
                            visitedPositions.push({row: checkboxTicked.row, col: checkboxTicked.col});
                        }
                        visitedPositions.push({row: row, col: col});

                        //comprobar si se puede seguir saltando desde la nueva posición (captura múltiple)
                        if (canCaptureAgain(row, col, playerTurn)) {
                            checkboxTicked = {row: row, col: col};
                            displayMessages.innerText = 'You can capture again! Select the next destination.';
                            drawBoard();
                            return; // No cambiar el turno aún
                        } else {
                            visitedPositions = []; // Reiniciar historial de posiciones visitadas al finalizar la captura múltiple
                        }
                    }
  
                    checkboxTicked = null;  //se borra la selección de la ficha para que el usuario pueda seleccionar otra en su próximo turno
                    interactionMode = 'select_piece'; //volver al modo de seleccionar pieza para el próximo turno

                    //cambiar el turno al otro jugador (si era 1 pasa a 2 y viceversa)
                    playerTurn = playerTurn === 1 ? 2 : 1; 

                    displayMessages.innerText = `Valid Movement. ${playerTurn} turn.`; 
                    drawBoard(); 
                } else {
                    displayMessages.innerText = 'Invalid movement (Check lines and rules).'; 
                }
            }
        }
    }

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

    //Función detectora de saltos contiguos para captura múltiple. 
    function canCaptureAgain(r, c, player) {
        let jumps = [ [-2, 0], [2, 0], [0, -2], [0, 2], [-2, -2], [-2, 2], [2, -2], [2, 2] ];
        for(let s of jumps) { //recorre todas las direcciones posibles de salto
            let destR = r + s[0]; //calcula la fila de destino sumando la fila actual más el salto proyectado
            let destC = c + s[1]; //calcula la columna de destino sumando la columna actual más el salto proyectado

            //si el destino proyectado está dentro de los límites del tablero, comprueba: 
            //  -  si la casilla de destino está vacía, 
            //  -  si no ha sido visitada en este turno 
            //  -  si el salto es legal (captura obligatoria).
            if(destR >= 0 && destR < actualSize && destC >= 0 && destC < actualSize){
                let visited = visitedPositions.some(pos => pos.row === destR && pos.col === destC); // comprueba si la posición de destino ha sido visitada
                if(boardState[destR][destC] === 0 && !visited && validateCapture(r, c, destR, destC, player)){
                    return true; // Existe un salto contiguo
                }
            }
        }
        return false;
    }


});