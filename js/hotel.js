class Habitacion {
    constructor(id, tipo, descripcion, precio, imagen, disponibilidad = true) {
        this.id = id;
        this.tipo = tipo;
        this.descripcion = descripcion;
        this.precio = precio;
        this.imagen = imagen;
        this.disponibilidad = disponibilidad;
    }
}

class Reserva {
    constructor(habitacion, fechaInicio, fechaFin, huesped) {
        this.habitacion = habitacion;
        this.fechaInicio = new Date(fechaInicio);
        this.fechaFin = new Date(fechaFin);
        this.huesped = huesped;
        this.id = Date.now().toString();
        this.estado = 'pendiente'; // pendiente, confirmada, cancelada
        this.calcularTotal();
    }

    calcularTotal() {
        const diffTime = Math.abs(this.fechaFin - this.fechaInicio);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        this.total = diffDays * this.habitacion.precio;
        return this.total;
    }

    confirmar() {
        this.estado = 'confirmada';
        this.habitacion.disponibilidad = false;
    }

    cancelar() {
        this.estado = 'cancelada';
        this.habitacion.disponibilidad = true;
    }
}

class SistemaReservas {
    constructor() {
        this.habitaciones = [];
        this.reservas = [];
        this.cargarHabitaciones();
        this.cargarReservas();
    }

    cargarHabitaciones() {
        // Datos de ejemplo - en un sistema real podrían venir de una API
        this.habitaciones = [
            new Habitacion(
                1, 
                'individual', 
                'Habitación individual, baño privado', 
                4500, 
                'imagenes/habitacion-individual.jpg'
            ),
            new Habitacion(
                2, 
                'individual', 
                'Habitación individual con balcon', 
                5000, 
                'imagenes/habitacion-individual-2.jpg'
            ),
            new Habitacion(
                3, 
                'doble', 
                'Habitación doble con cama queen, baño privado y balcón', 
                7500, 
                'imagenes/habitacion-doble.jpg'
            ),
            new Habitacion(
                4, 
                'doble', 
                'Habitación doble con dos camas twin, ideal para amigos', 
                7000, 
                'imagenes/habitacion-doble-2.jpg'
            ),
            new Habitacion(
                5, 
                'suite', 
                'Suite ejecutiva con sala de estar separada y jacuzzi', 
                12000, 
                'imagenes/suite.jpg'
            ),
            new Habitacion(
                6, 
                'suite', 
                'Suite presidencial con terraza privada y vista al mar', 
                18000, 
                'imagenes/suite-presidencial.jpg'
            )
        ];
    }

    cargarReservas() {
        const reservasGuardadas = JSON.parse(localStorage.getItem('reservasHotel')) || [];
        this.reservas = reservasGuardadas.map(reserva => {
            const habitacion = this.habitaciones.find(h => h.id === reserva.habitacion.id);
            const nuevaReserva = new Reserva(
                habitacion, 
                reserva.fechaInicio, 
                reserva.fechaFin, 
                reserva.huesped
            );
            nuevaReserva.id = reserva.id;
            nuevaReserva.estado = reserva.estado;
            return nuevaReserva;
        });
    }

    guardarReservas() {
        localStorage.setItem('reservasHotel', JSON.stringify(this.reservas));
    }

    agregarReserva(habitacion, fechaInicio, fechaFin, huesped) {
        const nuevaReserva = new Reserva(habitacion, fechaInicio, fechaFin, huesped);
        this.reservas.push(nuevaReserva);
        this.guardarReservas();
        return nuevaReserva;
    }

    cancelarReserva(id) {
        const reserva = this.reservas.find(r => r.id === id);
        if (reserva) {
            reserva.cancelar();
            this.reservas = this.reservas.filter(r => r.id !== id);
            this.guardarReservas();
            return true;
        }
        return false;
    }

    confirmarReservas() {
        this.reservas.forEach(reserva => reserva.confirmar());
        this.guardarReservas();
    }

    calcularTotalReservas() {
        return this.reservas.reduce((total, reserva) => total + reserva.total, 0);
    }

    filtrarHabitaciones(tipo, precioMax) {
        return this.habitaciones.filter(habitacion => {
            const cumpleTipo = !tipo || habitacion.tipo === tipo;
            const cumplePrecio = !precioMax || habitacion.precio <= precioMax;
            return cumpleTipo && cumplePrecio && habitacion.disponibilidad;
        });
    }
}