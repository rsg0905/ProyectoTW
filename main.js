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
        // el jugador hace clic para elegir que ficha mover. 
        if(interactionMode === 'select_piece') {
            if(value !== 0) { 
                checkboxTicked = {row: row, col: col}; // Corregido el "e" suelto y la sintaxis
                interactionMode = 'select_destination'; 
                // Corregido: uso de backticks
                displayMessages.innerText = `You have selected the tile at position (${row}, ${col}). Now click on an empty square to move it.`; 
                drawBoard(); 
            } else {
                displayMessages.innerText = 'You have clicked on an empty cell. You must select a piece first.'; 
            }
        } else if(interactionMode === 'select_destination') {
            if(row === checkboxTicked.row && col === checkboxTicked.col) {
                // si hace click en la misma ficha la deseleccionamos
                checkboxTicked = null; 
                interactionMode = 'select_piece'; 
                displayMessages.innerText = 'Selection cancelled. It’s still your turn.'; 
                drawBoard(); 
            } else if(value === 0) {
                boardState[row][col] = boardState[checkboxTicked.row][checkboxTicked.col]; 
                boardState[checkboxTicked.row][checkboxTicked.col] = 0; 

                checkboxTicked = null; 
                interactionMode = 'select_piece'; 
                displayMessages.innerText = 'Move made! Now it’s the computer’s turn...'; 
                drawBoard(); 
            } else {
                displayMessages.innerText = 'Invalid move. You must move to an empty square.'; 
            }
        }
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