document.addEventListener('DOMContentLoaded', () => {
    // Referencia al contenedor principal del html
    const contenedorTablero = document.getElementById('tablero');

    // Creamos el contenedor de la cuadricula
    const grid = document.createElement('div');
    grid.id = 'tablero-grid';
    contenedorTablero.appendChild(grid);

    // MATRIZ LOGICA DEL ESTADO DEL JUEGO
    // 0 = Casilla vacia
    // 1 = Ficha Roja
    // 2 = Ficha Azul
    let estadoTablero = [
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 0, 2, 2],
        [2, 2, 2, 2, 2],
        [2, 2, 2, 2, 2]
    ];

    // Funcion principal para dibujar el tablero basado en la matriz
    function generarTablero(tamaño) {
        grid.innerHTML = ''; // Limpiar el grid antes de dibujar

        // Ajustar el numero de columnas y filas en el css
        grid.style.gridTemplateColumns = `repeat(${tamaño}, 50px)`;
        grid.style.gridTemplateRows = `repeat(${tamaño}, 50px)`;

        // Recorrer la matriz logica para dibujar el tablero
        for (let fila = 0; fila < tamaño; fila++) {
            for (let col = 0; col < tamaño; col++) {
                // Creamos la casilla base transparente para que se vea el grid
                const casilla = document.createElement('div');
                casilla.classList.add('casilla');
                casilla.dataset.fila = fila;
                casilla.dataset.columna = col;

                // Leemos la matriz logica para saber si hay que pintar una ficha
                const valor = estadoTablero[fila][col];

                // Pintar la ficha correspondiente si es necesario
                if (valor === 1) {
                    const fichaRoja = document.createElement('div');
                    fichaRoja.classList.add('ficha-roja');
                    casilla.appendChild(fichaRoja);
                } else if (valor === 2) {
                    const fichaAzul = document.createElement('div');
                    fichaAzul.classList.add('ficha-azul');
                    casilla.appendChild(fichaAzul);
                }

                // Le da funcionalidad al click (aun no tiene efecto en la logica del juego, solo imprime en consola para ver que funciona)
                casilla.addEventListener('click', () => {
                    console.log(`Clic en la fila ${fila}, columna ${col}. Valor logico: ${estadoTablero[fila][col]}`);
                });

                // Añadimos la casilla terminada al grid
                grid.appendChild(casilla);
            }
        }
    }

    // Inicializamos un tablero de 5x5
    generarTablero(5);
});