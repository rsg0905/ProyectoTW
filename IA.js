class IA {
    constructor(level) {
        this.level = level;
    }

    calculateMove(board, huffCandidates) {
        //Regla del soplo: si el jugador anterior tenia una captura disponible y no la hizo, se sopla una de sus piezas
        if(huffCandidates.length > 0) {
            let pieceToHuff = huffCandidates[0];
            return {
                type: 'huff', 
                piece: pieceToHuff
            }; 
        }

        //recopilar todas las jugadas válidas (fichas azules = 2)
        let possibleCaptures = [];
        let possibleMoves = [];

        const jumpDirs = [ [-2, 0], [2, 0], [0, -2], [0, 2], [-2, -2], [-2, 2], [2, -2], [2, 2] ];
        const moveDirs = [ [-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1] ];

        for (let r = 0; r < board.size; r++) {
            for (let c = 0; c < board.size; c++) {
                if (board.state[r][c] === 2) {
                    // Capturas disponibles
                    for (let j of jumpDirs) {
                        let destR = r + j[0];
                        let destC = c + j[1];
                        if (destR >= 0 && destR < board.size && destC >= 0 && destC < board.size) {
                            if (board.state[destR][destC] === 0 && board.validateCapture(r, c, destR, destC, 2)) {
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
                        if (destR >= 0 && destR < board.size && destC >= 0 && destC < board.size) {
                            if (board.state[destR][destC] === 0 && board.validateNormalMovement(r, c, destR, destC, 2)) {
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

        //elegir jugada según el nivel (easy o difficult)
        let chosenAction = null; 
        if (this.level === 'difficult') {
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
        return chosenAction; //devuelve null si no hay jugadas posibles
    }

    searchNextCapture(board, r, c, visitedPositions) {
        const jumpDirs = [ [-2, 0], [2, 0], [0, -2], [0, 2], [-2, -2], [-2, 2], [2, -2], [2, 2] ];
        let nextCaptures = [];

        for (let j of jumpDirs) {
            let destR = r + j[0]; 
            let destC = c + j[1]; 

            if (destR >= 0 && destR < board.size && destC >= 0 && destC < board.size) {
                let visited = visitedPositions.some(pos => pos.row === destR && pos.col === destC);

                if (board.state[destR][destC] === 0 && !visited && board.validateCapture(r, c, destR, destC, 2)) {
                    nextCaptures.push({
                        type: 'chain-capture',
                        fromR: r, fromC: c,
                        toR: destR, toC: destC 
                    }); 
                }
            }
        }

        if (nextCaptures.length > 0) {
            return nextCaptures[Math.floor(Math.random() * nextCaptures.length)];
        }

        return null; // No hay más saltos posibles
    }
}