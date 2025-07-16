class HotelAPI {
    static async fetchHabitaciones() {
        // Simular retardo de red
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const response = await fetch('data/habitaciones.json');
        if (!response.ok) throw new Error("Error al cargar habitaciones");
        return await response.json();
    }
}

/////////////////////
