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
        grid.innerHTML = ''; // limpiamos visualmente el tablero
        
        // Corregido: uso de backticks (`) para interpolar variables
        grid.style.gridTemplateColumns = `repeat(${actualSize}, 60px)`; 
        grid.style.gridTemplateRows = `repeat(${actualSize}, 60px)`; 

        for(let row = 0; row < actualSize; row++){
            for(let col=0; col < actualSize; col++) { // Corregido: col < actualSize (antes era 0)
                const box = document.createElement('div'); 
                box.classList.add('box'); 

                const value = boardState[row][col]; 

                // pintar fichas
                if(value === 1) {
                    const piece = document.createElement('div'); 
                    piece.classList.add('red-piece'); 
                    box.appendChild(piece); 
                } else if(value === 2) {
                    const piece = document.createElement('div');
                    piece.classList.add('blue-piece'); 
                    box.appendChild(piece); 
                }

                // Corregido: usar === para comparar
                if(checkboxTicked && checkboxTicked.row === row && checkboxTicked.col === col){
                    box.style.backgroundColor = 'rgba(255,255,0,0.4)'; 
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