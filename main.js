/**Archivo de inicialización que arranca la aplicación. Se encarga de gestionar la configuración inicial y los eventos de la interfaz. */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Instanciar la partida
    const partida = new Game();

    // 2. Referencias a la interfaz
    const btnApply = document.getElementById('btn-apply-settings');  // Botón de aplicar configuración
    const btnStart = document.getElementById('btn-start'); // Botón de iniciar partida
    const selectSize = document.getElementById('select-size'); // Selector de tamaño del tablero
    const selectIA = document.getElementById('select-ia'); // Selector de nivel de IA
    const selectTurn = document.getElementById('select-turn'); // Selector de primer jugador
    const selectOpponent = document.getElementById('select-opponent'); // Selector de oponente

    // Referencias de Login / Logout
    const userDisplay = document.getElementById('user-display');
    const btnAuth = document.getElementById('btn-auth');
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const inputNick = document.getElementById('input-nick');
    const inputPassword = document.getElementById('input-password');
    const btnCancelLogin = document.getElementById('btn-cancel-login');

    const logoutModal = document.getElementById('logout-modal');
    const btnConfirmLogout = document.getElementById('btn-confirm-logout');
    const btnCancelLogout = document.getElementById('btn-cancel-logout');

    let currentUser = null;

    const modalGameOver = document.getElementById('game-over-modal'); // Modal de fin de partida
    // Botón de reinicio de partida dentro del modal
    document.getElementById('btn-restart-game').onclick = () => {
        modalGameOver.close(); // Cierra el modal de fin de partida
        Start(); // Reinicia la partida
    };

    // Botón de cierre del modal de fin de partida
    document.getElementById('btn-close-modal').onclick = () => {
        modalGameOver.close();
    };
    
    // Activar/desactivar opciones según el modo de juego
    selectOpponent.addEventListener('change', () => {
        const isOnline = selectOpponent.value === 'player';
        selectIA.disabled = isOnline;
        selectTurn.disabled = isOnline;
        selectSize.disabled = isOnline;
        if (isOnline) {
            selectSize.value = '5'; // El servidor usa tablero 5x5
        }
    });

    btnAuth.addEventListener('click', () => {
        if (!currentUser) {
            loginModal.showModal();
        } else {
            logoutModal.showModal();
        }
    });

    // Enviar formulario de Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nick = inputNick.value.trim();
        const password = inputPassword.value;

        if (!nick || !password) return;

        // TODO: Conectar aquí con ServerAPI.register(nick, password)
        currentUser = nick;
        userDisplay.innerText = `User: ${nick}`;
        btnAuth.innerText = 'Log out';
        btnAuth.classList.add('btn-danger');

        loginForm.reset();
        loginModal.close();
    });

    btnCancelLogin.addEventListener('click', () => {
        loginForm.reset();
        loginModal.close();
    });

    // Confirmar Logout
    btnConfirmLogout.addEventListener('click', () => {
        currentUser = null;
        userDisplay.innerText = 'User: Guest';
        btnAuth.innerText = 'Log in';
        btnAuth.classList.remove('btn-danger');
        logoutModal.close();
    });

    btnCancelLogout.addEventListener('click', () => {
        logoutModal.close();
    });

    // Paneles
    const dialogInstructions = document.getElementById('Instructions'); //dialog de instrucciones
    document.getElementById('btn-instructions').onclick = () => dialogInstructions.showModal(); // Botón de abrir instrucciones
    document.getElementById('close-instructions').onclick = () => dialogInstructions.close(); // Botón de cerrar instrucciones

    const dialogRatings = document.getElementById('ratings'); //dialog de puntuaciones
    document.getElementById('btn-ratings').onclick = () => dialogRatings.showModal(); // Botón de abrir puntuaciones
    document.getElementById('close-rankings').onclick = () => dialogRatings.close(); // Botón de cerrar puntuaciones

    // 3. Controles de la partida (Botones in-game)
    const btnDraw = document.getElementById('btn-draw'); // Botón de proponer empate
    const btnPass = document.getElementById('btn-pass'); // Botón de pasar turno
    const btnGiveUp = document.getElementById('btn-giveup'); // Botón de rendirse

    btnDraw.onclick = () => partida.proposeDraw(); // Llama al método de proponer empate en la partida
    btnPass.onclick = () => partida.skipTurn(); // Llama al método de pasar turno en la partida
    btnGiveUp.onclick = () => partida.giveUp(); // Llama al método de rendirse en la partida

    // 3. Arrancar partida al pulsar los botones
    function Start() {
        let size = parseInt(selectSize.value); // Convertir el valor del selector de tamaño a número entero
        let level = selectIA.value; // Nivel de dificultad de la IA
        let firstPlayer = selectTurn.value === 'red' ? 1 : 2; // Determinar el primer jugador (1 = rojo, 2 = azul)
        partida.Start(size, level, firstPlayer); // Iniciar la partida (Game) con los parámetros seleccionados
    }

    btnApply.onclick = Start; // Llama a la función Start al pulsar el botón de aplicar configuración
    btnStart.onclick = Start; // Llama a la función Start al pulsar el botón de iniciar partida

    // Arrancar una partida automática al entrar a la web
    Start();
});