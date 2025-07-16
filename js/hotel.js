class Habitacion {
    constructor({ id, tipo, descripcion, precio, imagen, disponibilidad, amenities = [] }) {
        this.id = id;
        this.tipo = tipo;
        this.descripcion = descripcion;
        this.precio = precio;
        this.imagen = imagen.startsWith('img/') ? imagen : `img/${imagen}`;
        this.disponibilidad = disponibilidad;
        this.amenities = amenities;
    }

    get tipoFormateado() {
        return this.tipo.charAt(0).toUpperCase() + this.tipo.slice(1);
    }
}

class Reserva {
    constructor({ habitacion, fechaInicio, fechaFin, huesped }) {
        if (!habitacion || !fechaInicio || !fechaFin || !huesped?.nombre) {
            throw new Error('Datos incompletos para crear reserva');
        }

        this.habitacion = habitacion;
        this.fechaInicio = new Date(fechaInicio);
        this.fechaFin = new Date(fechaFin);
        this.huesped = huesped;
        this.id = `RES-${Date.now()}`;
        this.estado = 'pendiente';
        this.fechaCreacion = new Date();
        this.total = this.calcularTotal();
    }

    calcularTotal() {
        if (this.fechaFin <= this.fechaInicio) {
            throw new Error('Fecha de salida debe ser posterior a la de entrada');
        }

        const diffTime = Math.abs(this.fechaFin - this.fechaInicio);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays * this.habitacion.precio;
    }

    toJSON() {
        return {
            id: this.id,
            habitacion: {
                id: this.habitacion.id,
                tipo: this.habitacion.tipo,
                precio: this.habitacion.precio
            },
            fechaInicio: this.fechaInicio.toISOString(),
            fechaFin: this.fechaFin.toISOString(),
            huesped: this.huesped,
            estado: this.estado,
            total: this.total,
            fechaCreacion: this.fechaCreacion.toISOString()
        };
    }
}

class SistemaReservas {
    constructor() {
        this.habitaciones = [];
        this.reservas = [];
    }

    async inicializar() {
        try {
            await this.cargarHabitaciones();
            this.cargarReservas();
            return true;
        } catch (error) {
            console.error('Error inicializando SistemaReservas:', error);
            return false;
        }
    }

    async cargarHabitaciones() {
        this.habitaciones = (await HotelAPI.fetchHabitaciones())
            .map(item => new Habitacion(item));
    }

    cargarReservas() {
        const reservasGuardadas = JSON.parse(localStorage.getItem('reservasHotel')) || [];
        this.reservas = reservasGuardadas.map(reservaData => {
            const habitacion = this.habitaciones.find(h => h.id === reservaData.habitacion.id);
            if (!habitacion) return null;
            
            try {
                return new Reserva({
                    habitacion,
                    fechaInicio: reservaData.fechaInicio,
                    fechaFin: reservaData.fechaFin,
                    huesped: reservaData.huesped
                });
            } catch (error) {
                console.error('Error cargando reserva:', error);
                return null;
            }
        }).filter(Boolean);
    }

    guardarReservas() {
        localStorage.setItem('reservasHotel', JSON.stringify(
            this.reservas.map(r => r.toJSON())
        ));
    }

    agregarReserva(reservaData) {
        try {
            const habitacion = this.habitaciones.find(h => 
                h.id === reservaData.habitacionId && h.disponibilidad
            );
            
            if (!habitacion) {
                throw new Error('Habitación no disponible');
            }

            const reserva = new Reserva({
                habitacion,
                fechaInicio: reservaData.fechaInicio,
                fechaFin: reservaData.fechaFin,
                huesped: reservaData.huesped
            });

            this.reservas.push(reserva);
            this.guardarReservas();
            return reserva;
        } catch (error) {
            console.error('Error agregando reserva:', error);
            throw error;
        }
    }

    async cancelarReserva(id) {
        try {
            const index = this.reservas.findIndex(r => r.id === id);
            if (index === -1) return false;

            await HotelAPI.cancelarReserva(id);
            this.reservas.splice(index, 1);
            this.guardarReservas();
            return true;
        } catch (error) {
            console.error('Error cancelando reserva:', error);
            throw error;
        }
    }

    async confirmarTodasLasReservas() {
        try {
            const resultados = await Promise.all(
                this.reservas.map(async reserva => {
                    const resultado = await HotelAPI.confirmarReserva(reserva);
                    reserva.estado = 'confirmada';
                    return resultado;
                })
            );
            
            this.guardarReservas();
            return resultados;
        } catch (error) {
            console.error('Error confirmando reservas:', error);
            throw error;
        }
    }

    filtrarHabitaciones({ tipo, precioMax }) {
        return this.habitaciones.filter(habitacion => {
            const cumpleTipo = !tipo || habitacion.tipo === tipo;
            const cumplePrecio = !precioMax || habitacion.precio <= precioMax;
            return cumpleTipo && cumplePrecio && habitacion.disponibilidad;
        });
    }

    calcularTotalReservas() {
        return this.reservas.reduce((sum, r) => sum + r.total, 0);
    }
}