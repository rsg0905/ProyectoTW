document.addEventListener('DOMContentLoaded', () => {
    // 1. Instanciar la partida
    const partida = new Game();

    // 2. Referencias a la interfaz
    const btnApply = document.getElementById('btn-apply-settings'); 
    const btnStart = document.getElementById('btn-start');
    const selectSize = document.getElementById('select-size');
    const selectIA = document.getElementById('select-ia');
    const selectTurn = document.getElementById('select-turn');
    
    const modalGameOver = document.getElementById('game-over-modal');
    document.getElementById('btn-restart-game').onclick = () => {
        modalGameOver.close();
        Start(); 
    };

    document.getElementById('btn-close-modal').onclick = () => {
        modalGameOver.close();
    };
    
    // Paneles
    const dialogInstructions = document.getElementById('Instructions'); 
    document.getElementById('btn-instructions').onclick = () => dialogInstructions.showModal();
    document.getElementById('close-instructions').onclick = () => dialogInstructions.close();

    const dialogRatings = document.getElementById('ratings'); 
    document.getElementById('btn-ratings').onclick = () => dialogRatings.showModal();
    document.getElementById('close-rankings').onclick = () => dialogRatings.close();

    // 3. Controles de la partida (Botones in-game)
    const btnDraw = document.getElementById('btn-draw');
    const btnPass = document.getElementById('btn-pass');
    const btnGiveUp = document.getElementById('btn-giveup');

    btnDraw.onclick = () => partida.proposeDraw();
    btnPass.onclick = () => partida.skipTurn();
    btnGiveUp.onclick = () => partida.giveUp();

    // 3. Arrancar partida al pulsar los botones
    function Start() {
        let size = parseInt(selectSize.value);
        let level = selectIA.value;
        let firstPlayer = selectTurn.value === 'red' ? 1 : 2;
        partida.Start(size, level, firstPlayer);
    }

    btnApply.onclick = Start;
    btnStart.onclick = Start;

    // Arrancar una partida automática al entrar a la web
    Start();
});