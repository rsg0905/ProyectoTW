class ServerAPI {
    constructor(baseUrl = 'http://twserver.alunos.dcc.fc.up.pt') {                                                  
        this.baseUrl = baseUrl;
        this.eventSource = null; // Guardará la conexión SSE activa de "update"
    }
                                                                                                                        
    // Método genérico para todas las peticiones POST con JSON                                                      
    async post(endpoint, payload) {                                                                                 
        const response = await fetch(`${this.baseUrl}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
                                                                                                                        
        // Leemos como texto primero por si el servidor devuelve cuerpo vacío                                       
        const text = await response.text();                                                                         
        let data = {};
        if (text) {
            try {
                data = JSON.parse(text);
            } catch (e) {
                data = { error: text };
            }
        }
  
        // Según el PDF, si el estado HTTP es distinto de 200, viene la propiedad "error"
        if (!response.ok) {
            throw new Error(data.error || `Server error (HTTP ${response.status})`);
        }
  
        // Por seguridad, también comprobamos si viniera "error" con HTTP 200
        if (data.error) {
            throw new Error(data.error);
        }
  
        return data;
    }

    // Registra un usuario nuevo o verifica la contraseña si ya existe
    async register(nick, password) {
        return this.post('register', { nick, password });
    }
  
    // Une al jugador a una partida del grupo indicado. Devuelve { game }
    async join(group, nick, password) {
        return this.post('join', { group, nick, password });
    }
  
    // Abandona la espera o se rinde en la partida activa
    async leave(nick, password, game) {
        return this.post('leave', { nick, password, game });
    }
  
    // Propone o acepta un empate en cualquier momento de la partida                                                
    async draw(nick, password, game) {                                                                              
        return this.post('draw', { nick, password, game });                                                         
    }                                                                                                               
                                                                                                                        
    // Notifica al servidor una posición { row, column } que participa en una jugada                                
    async notify(nick, password, game, position) {                                                                  
        return this.post('notify', { nick, password, game, position });                                             
    }                                                                                                               
                                                                                                                        
    // Obtiene el top 10 de jugadores del grupo. Devuelve { ranking: [...] }                                        
    async ranking(group) {                                                                                          
        return this.post('ranking', { group });                                                                     
    }

    // Abre el canal SSE (GET /update?nick=...&game=...) para recibir eventos de la partida                         
    openUpdateStream(nick, game, onMessage, onError) {                                                              
        // Si hubiera una conexión anterior abierta, la cerramos primero para no duplicar eventos                   
        this.closeUpdateStream();                                                                                   
                                                                                                                        
        // URLSearchParams codifica automáticamente los parámetros en formato urlencoded                            
        const params = new URLSearchParams({ nick, game });                                                         
        const url = `${this.baseUrl}/update?${params.toString()}`;                                                  
                                                                                                                        
        this.eventSource = new EventSource(url);                                                                    
                                                                                                                        
        this.eventSource.onmessage = (event) => {                                                                   
            try {                                                                                                   
                const data = JSON.parse(event.data);                                                                
                if (onMessage) onMessage(data);                                                                     
            } catch (error) {                                                                                       
                console.error('Error al parsear evento SSE:', error, event.data);                                   
            }                                                                                                       
        };                                                                                                          
                                                                                                                        
        this.eventSource.onerror = (event) => {                                                                     
            if (onError) onError(event);                                                                            
        };                                                                                                          
    }                                                                                                               
                                                                                                                    
    // Cierra el canal SSE (obligatorio al terminar cada partida)                                                   
    closeUpdateStream() {                                                                                           
        if (this.eventSource) {                                                                                     
            this.eventSource.close();                                                                               
            this.eventSource = null;                                                                                
        }                                                                                                           
    }                                                                                                               
}