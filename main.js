document.addEventListener('DOMContentLoaded', () => {
    // 1. Instanciar la partida
    const partida = new Game();

    // 2. Referencias a la interfaz
    const btnApply = document.getElementById('btn-apply-settings'); 
    const btnStart = document.getElementById('btn-start');
    const selectSize = document.getElementById('select-size');
    const selectIA = document.getElementById('select-ia');
    const selectTurn = document.getElementById('select-turn');
    
    // Paneles
    const dialogInstructions = document.getElementById('Instructions'); 
    document.getElementById('btn-instructions').onclick = () => dialogInstructions.showModal();
    document.getElementById('close-instructions').onclick = () => dialogInstructions.close();

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