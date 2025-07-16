document.addEventListener('DOMContentLoaded', async () => {
    // Estado global
    const state = {
        reservas: JSON.parse(localStorage.getItem('reservas')) || [],
        habitaciones: [],
        reservaSeleccionadaId: null
    };

    // Elementos DOM
    const DOM = {
        contenedor: document.getElementById('contenedor-habitaciones'),
        panelReservas: document.getElementById('reservas-panel'),
        btnReservas: document.getElementById('reservas-btn'),
        filtroTipo: document.getElementById('tipo-habitacion'),
        filtroPrecio: document.getElementById('precio-max'),
        reservasItems: document.getElementById('reservas-items')
    };

    // Cargar y renderizar habitaciones
    async function cargarHabitaciones() {
        try {
            state.habitaciones = await HotelAPI.fetchHabitaciones();
            renderHabitaciones(state.habitaciones);
        } catch (error) {
            console.error("Error:", error);
            DOM.contenedor.innerHTML = `
                <div class="error">
                    Error al cargar habitaciones: ${error.message}
                    <button onclick="location.reload()">Reintentar</button>
                </div>
            `;
        }
    }

    // Renderizar habitaciones
    function renderHabitaciones(habitaciones) {
        DOM.contenedor.innerHTML = habitaciones.map(habitacion => `
            <div class="habitacion-card" data-id="${habitacion.id}">
                <img src="${habitacion.imagen}" alt="${habitacion.tipo}" class="habitacion-img">
                <div class="habitacion-info">
                    <h3>${habitacion.tipo.toUpperCase()}</h3>
                    <p>${habitacion.descripcion}</p>
                    <span class="precio">$${habitacion.precio}/noche</span>
                    <button class="btn-reservar">Reservar</button>
                </div>
            </div>
        `).join('');
    }

    // Filtrar habitaciones
    function filtrarHabitaciones() {
        const tipo = DOM.filtroTipo.value;
        const precioMax = DOM.filtroPrecio.value ? parseInt(DOM.filtroPrecio.value) : null;
        
        const filtradas = state.habitaciones.filter(habitacion => {
            const cumpleTipo = !tipo || habitacion.tipo === tipo;
            const cumplePrecio = !precioMax || habitacion.precio <= precioMax;
            return cumpleTipo && cumplePrecio;
        });
        
        renderHabitaciones(filtradas);
    }

    // Manejar reserva
   async function manejarReserva(habitacionId) {
    const habitacion = state.habitaciones.find(h => h.id === habitacionId);
    
    const { value: datos } = await Swal.fire({
        title: `Reservar ${habitacion.tipo}`,
        html: `
            <input id="nombre" class="swal2-input" placeholder="Nombre" required>
            <input id="fecha-inicio" class="swal2-input" type="date" required>
            <input id="fecha-fin" class="swal2-input" type="date" required>
        `,
        focusConfirm: false,
        preConfirm: () => {
            const fechaInicio = new Date(document.getElementById('fecha-inicio').value);
            const fechaFin = new Date(document.getElementById('fecha-fin').value);
            
            // Validar fechas
            if (fechaFin <= fechaInicio) {
                Swal.showValidationMessage('La fecha de salida debe ser posterior a la de entrada');
                return false;
            }
            
            // Calcular días de estadía
            const diffTime = Math.abs(fechaFin - fechaInicio);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return {
                nombre: document.getElementById('nombre').value,
                fechaInicio: document.getElementById('fecha-inicio').value,
                fechaFin: document.getElementById('fecha-fin').value,
                dias: diffDays,
                total: diffDays * habitacion.precio
            };
        }
    });

    if (datos) {
        state.reservas.push({
            ...datos,
            habitacion,
            id: Date.now()
        });
        
        localStorage.setItem('reservas', JSON.stringify(state.reservas));
        actualizarPanelReservas();
        Swal.fire(
            '¡Reserva confirmada!',
            `Estadía de ${datos.dias} días. Total: $${datos.total}`,
            'success'
        );
    }
}
    // Actualizar panel de reservas
   function actualizarPanelReservas() {
    DOM.reservasItems.innerHTML = state.reservas.map(reserva => `
        <div class="reserva-item ${reserva.id === state.reservaSeleccionadaId ? 'selected' : ''}" 
             data-id="${reserva.id}">
            <h4>${reserva.habitacion.tipo.toUpperCase()}</h4>
            <p><strong>Nombre:</strong> ${reserva.nombre}</p>
            <p><strong>Fechas:</strong> ${reserva.fechaInicio} a ${reserva.fechaFin}</p>
            <p><strong>Días:</strong> ${reserva.dias}</p>
            <p><strong>Precio noche:</strong> $${reserva.habitacion.precio}</p>
            <p><strong>Total:</strong> $${reserva.total}</p>
        </div>
    `).join('');
    
    // Actualizar total general
    const totalGeneral = state.reservas.reduce((sum, r) => sum + r.total, 0);
    document.getElementById('total-reserva').textContent = `Total General: $${totalGeneral}`;
}

    // Manejar selección de reserva
    function manejarSeleccionReserva(event) {
        const reservaItem = event.target.closest('.reserva-item');
        if (reservaItem) {
            // Deseleccionar todas
            document.querySelectorAll('.reserva-item').forEach(item => {
                item.classList.remove('selected');
            });
            
            // Seleccionar la actual
            reservaItem.classList.add('selected');
            state.reservaSeleccionadaId = parseInt(reservaItem.dataset.id);
        }
    }

    // Cancelar reserva
    function cancelarReserva() {
        if (!state.reservaSeleccionadaId) {
            Swal.fire('Error', 'Selecciona una reserva primero', 'error');
            return;
        }

        Swal.fire({
            title: '¿Cancelar reserva?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                state.reservas = state.reservas.filter(r => r.id !== state.reservaSeleccionadaId);
                localStorage.setItem('reservas', JSON.stringify(state.reservas));
                state.reservaSeleccionadaId = null;
                actualizarPanelReservas();
                Swal.fire('Cancelada', 'La reserva fue eliminada', 'success');
            }
        });
    }

    // Configurar event listeners
    function configurarEventos() {
        DOM.contenedor.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-reservar')) {
                const card = e.target.closest('.habitacion-card');
                manejarReserva(parseInt(card.dataset.id));
            }
        });

        DOM.btnReservas.addEventListener('click', () => {
            DOM.panelReservas.classList.toggle('active');
        });

        document.getElementById('aplicar-filtros').addEventListener('click', filtrarHabitaciones);
        document.getElementById('cancelar-reserva').addEventListener('click', cancelarReserva);
        document.getElementById('confirmar-reservas').addEventListener('click', () => {
            Swal.fire('¡Reservas confirmadas!', 'Recibirás un email con los detalles.', 'success');
        });

        DOM.reservasItems.addEventListener('click', manejarSeleccionReserva);
    }

    // Inicializar
    await cargarHabitaciones();
    configurarEventos();
    actualizarPanelReservas();
});