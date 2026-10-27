class Board {
    constructor(size, containerHTML) {
        this.size = size;
        this.state = []; 
        this.containerHTML = containerHTML; 
    }

    // GENERACIÓN DINÁMICA DEL TABLERO
    generateDashboard() {
        this.state = []; 
        const totalBoxes = this.size * this.size; // número total de casillas
        const centralPosition = Math.floor(totalBoxes / 2); //calcula la posición central del tablero (para dejarla vacía)
        let accountant = 0; // contador para recorrer todas las casillas del tablero

        //RECORRIDO DE FILAS Y COLUMNAS PARA CREAR LA MATRIZ DEL TABLERO.
        for(let row = 0; row < this.size; row++) {
            let actualRow = []; 
            for(let col = 0; col < this.size; col++) {
                if(accountant < centralPosition) { //lo que este antes de la posición central se llena con fichas rojas
                    actualRow.push(1); // ficha roja

                } else if(accountant === centralPosition) { //la posición central se deja vacía
                    actualRow.push(0); // hueco vacío

                } else { //lo que este después de la posición central se llena con fichas azules
                    actualRow.push(2); // ficha azul
                }   
                accountant++; 
            }
            this.state.push(actualRow);  //añadimos la fila completa a la matriz del tablero
        }
    } 


    //DIBUJAR EL TABLERO DE MANERA DINÁMICA: se encarga de crear la estructura visual del tablero y las fichas según el estado actual del juego.
    //recibe los datos visuales desde la clase juego. 
    drawBoard(checkboxTicked, huffCandidates){
        const oldGrid = document.getElementById('tablero-grid');
        const oldSvg = document.getElementById('tablero-lineas');
        if(oldGrid) oldGrid.remove(); // Eliminamos la cuadricula anterior
        if(oldSvg) oldSvg.remove(); // Eliminamos el SVG anterior

        // 1. Crear el contenedor CSS de las casillas (las intersecciones) adaptado al tamaño actual del tablero
        const grid = document.createElement('div');
        grid.id = 'tablero-grid';
        grid.style.gridTemplateColumns = `repeat(${this.size}, 60px)`; 
        grid.style.gridTemplateRows = `repeat(${this.size}, 60px)`; 
        
        // 2. Crear el SVG para dibujar las líneas (dibuja vectores que conectan las casillas)
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = "tablero-lineas";
        
        // Tamaño total del SVG basado en el número de celdas * 60px
        const totalDimension = this.size * 60;
        
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
        for(let i = 0; i < this.size; i++) {
            let pos = offset + (i * 60);
            crearLinea(offset, pos, maxOffset, pos); // Horizontal
            crearLinea(pos, offset, pos, maxOffset); // Vertical
        }

        // Dibujar las líneas diagonales correctamente (solo desde nodos pares)
        for(let row = 0; row < this.size; row++) { //recorrer filas
            for(let col = 0; col < this.size; col++) { //recorrer columnas

                //solo las casillas (row + col) pares tienen diagonales
                if ((row + col) % 2 === 0) {
                    let cx1 = offset + (col * 60);
                    let cy1 = offset + (row * 60);
                    
                    // Diagonal hacia abajo-derecha. 
                    //comprobamos que no estamos en la última fila ni en la última columna para no dibujar fuera del tablero
                    if (row + 1 < this.size && col + 1 < this.size) {
                        let cx2 = offset + ((col + 1) * 60);
                        let cy2 = offset + ((row + 1) * 60);
                        crearLinea(cx1, cy1, cx2, cy2);
                    }
                    // Diagonal hacia abajo-izquierda. 
                    //comprobamos que no estamos en la última fila ni en la primera columna para no dibujar fuera del tablero
                    if (row + 1 < this.size && col - 1 >= 0) {
                        let cx2 = offset + ((col - 1) * 60);
                        let cy2 = offset + ((row + 1) * 60);
                        crearLinea(cx1, cy1, cx2, cy2);
                    }   
                }
            }
        }

        // Añadir el SVG y el Grid al DOM: 
        this.containerHTML.appendChild(svg);
        this.containerHTML.appendChild(grid);

        // 3. Dibujar las casillas interactivas y las fichas. 
        for(let row = 0; row < this.size; row++){
            for(let col = 0; col < this.size; col++) { 
                const box = document.createElement('div'); 
                box.classList.add('box'); 

                const value = this.state[row][col]; 

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
                if (huffCandidates && huffCandidates.some(p => p.row === row && p.col === col)) {
                    box.classList.add('huffable');
                }

                if(checkboxTicked && checkboxTicked.row === row && checkboxTicked.col === col){
                    box.style.backgroundColor = 'rgba(255,255,0,0.5)'; 
                    box.style.borderRadius = '50%'; 
                }
                grid.appendChild(box); 
            }
        }
    }

    conectedPieces(r1, c1, r2, c2){
        let dr = Math.abs(r1 - r2);
        let dc = Math.abs(c1 - c2);
        if (dr > 1 || dc > 1) return false; // Tienen que ser casillas contiguas
        if (dr === 1 && dc === 1){
            return (r1 + c1) % 2 === 0; // Solo hay diagonal si la suma es par
        }
        return true; // Movimiento horizontal o vertical valido
    }

        
    validateNormalMovement(originRow, originCol, destRow, destCol, player){
        if((!this.conectedPieces(originRow, originCol, destRow, destCol))) {
            return false; 
        }

        let advanceR = destRow - originRow;
        if(player === 1){
            if(advanceR < 0) return false; // Rojas no retroceden
            if(originRow === this.size - 1 && advanceR !== 0) return false;
        } else {
            if(advanceR > 0) return false; // Azules no pueden avanzar hacia abajo
            if(originRow === 0 && advanceR !== 0) return false; 
        }
        return true; 
    }

    validateCapture(originRow, originCol, destRow, destCol, player){
        let dr = destRow - originRow; // Diferencia de filas totales del salto
        let dc = destCol - originCol; // Diferencia de columnas totales del salto

        if ((Math.abs(dr) !== 2 && dr !== 0) || (Math.abs(dc) !== 2 && dc !== 0)) return false;
        if (Math.abs(dr) === 2 && Math.abs(dc) === 1) return false; 
        if (Math.abs(dr) === 1 && Math.abs(dc) === 2) return false; 

        let pasR = dr === 0 ? 0 : dr / 2; // fila intermedia
        let pasC = dc === 0 ? 0 : dc / 2; // columna intermedia

        if(!this.conectedPieces(originRow, originCol, originRow + pasR, originCol + pasC)) return false; 

        let rival = player === 1 ? 2 : 1;
        if(this.state[originRow + pasR][originCol + pasC] !== rival) return false;

        return true;
    }

    compulsoryCaptureExists(player){
        let jumps = [ [-2, 0], [2, 0], [0, -2], [0, 2], [-2, -2], [-2, 2], [2, -2], [2, 2] ]; 
        
        for(let r = 0; r < this.size; r++){
            for(let c = 0; c < this.size; c++){
                if(this.state[r][c] === player){
                    for(let s of jumps) {
                        let destR = r + s[0];
                        let destC = c + s[1];
                        if(destR >= 0 && destR < this.size && destC >= 0 && destC < this.size){
                            if(this.state[destR][destC] === 0 && this.validateCapture(r, c, destR, destC, player)){
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
    getCapturingPieces(player) {
        let pieces = [];
        let jumps = [ [-2, 0], [2, 0], [0, -2], [0, 2], [-2, -2], [-2, 2], [2, -2], [2, 2] ];

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.state[r][c] === player) {
                    for (let s of jumps) {
                        let destR = r + s[0];
                        let destC = c + s[1];

                        if (destR >= 0 && destR < this.size && destC >= 0 && destC < this.size) {
                            if (this.state[destR][destC] === 0 && this.validateCapture(r, c, destR, destC, player)) {
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

}