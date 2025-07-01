document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const reservasBtn = document.getElementById('reservas-btn');
    const reservasPanel = document.getElementById('reservas-panel');
    const contenedorHabitaciones = document.getElementById('contenedor-habitaciones');
    const reservasItems = document.getElementById('reservas-items');
    const totalReserva = document.getElementById('total-reserva');
    const btnCancelarReserva = document.getElementById('cancelar-reserva');
    const btnConfirmarReservas = document.getElementById('confirmar-reservas');
    const tipoHabitacionSelect = document.getElementById('tipo-habitacion');
    const precioMaxInput = document.getElementById('precio-max');
    const aplicarFiltrosBtn = document.getElementById('aplicar-filtros');

    // Instancia del sistema de reservas
    const sistemaReservas = new SistemaReservas();

    // Variables de estado
    let reservaSeleccionadaId = null;
    let panelAbierto = JSON.parse(localStorage.getItem('panelReservasAbierto')) || false;

    // Inicializar la aplicación
    function init() {
        renderizarHabitaciones(sistemaReservas.habitaciones);
        actualizarPanelReservas();
        if (panelAbierto) {
            reservasPanel.classList.add('active');
        }
    }

    // Renderizar las habitaciones disponibles
    function renderizarHabitaciones(habitaciones) {
        contenedorHabitaciones.innerHTML = '';
        
        habitaciones.forEach(habitacion => {
            const habitacionCard = document.createElement('div');
            habitacionCard.className = 'habitacion-card';
            habitacionCard.innerHTML = `
                <img src="${habitacion.imagen}" alt="${habitacion.tipo}" class="habitacion-img">
                <div class="habitacion-info">
                    <h3>Habitación ${habitacion.tipo.charAt(0).toUpperCase() + habitacion.tipo.slice(1)}</h3>
                    <p>${habitacion.descripcion}</p>
                    <span class="habitacion-precio">$${habitacion.precio} por noche</span>
                    <button class="btn-reservar" data-id="${habitacion.id}">Reservar</button>
                </div>
            `;
            contenedorHabitaciones.appendChild(habitacionCard);
        });

        // Agregar eventos a los botones de reserva
        document.querySelectorAll('.btn-reservar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const habitacionId = parseInt(e.target.getAttribute('data-id'));
                mostrarFormularioReserva(habitacionId);
            });
        });
    }

    // Mostrar formulario para realizar una reserva
    function mostrarFormularioReserva(habitacionId) {
        const habitacion = sistemaReservas.habitaciones.find(h => h.id === habitacionId);
        
        Swal.fire({
            title: `Reservar Habitación ${habitacion.tipo}`,
            html: `
                <div class="swal-habitacion-info">
                    <img src="${habitacion.imagen}" alt="${habitacion.tipo}" style="max-width: 100%; border-radius: 8px; margin-bottom: 1rem;">
                    <p>${habitacion.descripcion}</p>
                    <p><strong>Precio por noche: $${habitacion.precio}</strong></p>
                </div>
                <input type="text" id="nombre-huesped" class="swal2-input" placeholder="Nombre completo">
                <input type="email" id="email-huesped" class="swal2-input" placeholder="Email">
                <input type="date" id="fecha-inicio" class="swal2-input" placeholder="Fecha de entrada">
                <input type="date" id="fecha-fin" class="swal2-input" placeholder="Fecha de salida">
            `,
            focusConfirm: false,
            preConfirm: () => {
                const huesped = document.getElementById('nombre-huesped').value;
                const email = document.getElementById('email-huesped').value;
                const fechaInicio = document.getElementById('fecha-inicio').value;
                const fechaFin = document.getElementById('fecha-fin').value;
                
                if (!huesped || !email || !fechaInicio || !fechaFin) {
                    Swal.showValidationMessage('Por favor complete todos los campos');
                    return false;
                }
                
                if (new Date(fechaFin) <= new Date(fechaInicio)) {
                    Swal.showValidationMessage('La fecha de salida debe ser posterior a la de entrada');
                    return false;
                }
                
                return { huesped, email, fechaInicio, fechaFin };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const { huesped, email, fechaInicio, fechaFin } = result.value;
                const reserva = sistemaReservas.agregarReserva(
                    habitacion, 
                    fechaInicio, 
                    fechaFin, 
                    { nombre: huesped, email }
                );
                
                Swal.fire(
                    '¡Reserva agregada!',
                    `Has reservado la habitación ${habitacion.tipo} desde ${fechaInicio} hasta ${fechaFin}`,
                    'success'
                );
                
                actualizarPanelReservas();
                renderizarHabitaciones(sistemaReservas.habitaciones);
            }
        });
    }

    // Actualizar el panel de reservas
    function actualizarPanelReservas() {
        reservasItems.innerHTML = '';
        
        if (sistemaReservas.reservas.length === 0) {
            reservasItems.innerHTML = '<p>No tienes reservas pendientes</p>';
            totalReserva.textContent = 'Total: $0';
            return;
        }
        
        sistemaReservas.reservas.forEach(reserva => {
            const reservaItem = document.createElement('div');
            reservaItem.className = 'reserva-item';
            reservaItem.dataset.id = reserva.id;
            reservaItem.innerHTML = `
                <h4>Habitación ${reserva.habitacion.tipo.charAt(0).toUpperCase() + reserva.habitacion.tipo.slice(1)}</h4>
                <p><strong>Huésped:</strong> ${reserva.huesped.nombre}</p>
                <p><strong>Check-in:</strong> ${new Date(reserva.fechaInicio).toLocaleDateString()}</p>
                <p><strong>Check-out:</strong> ${new Date(reserva.fechaFin).toLocaleDateString()}</p>
                <p><strong>Noches:</strong> ${Math.ceil((new Date(reserva.fechaFin) - new Date(reserva.fechaInicio)) / (1000 * 60 * 60 * 24))}</p>
                <p class="reserva-precio">Total: $${reserva.total}</p>
            `;
            
            reservaItem.addEventListener('click', () => {
                document.querySelectorAll('.reserva-item').forEach(item => {
                    item.classList.remove('selected');
                });
                reservaItem.classList.add('selected');
                reservaSeleccionadaId = reserva.id;
            });
            
            reservasItems.appendChild(reservaItem);
        });
        
        totalReserva.textContent = `Total: $${sistemaReservas.calcularTotalReservas()}`;
    }

    // Evento para abrir/cerrar el panel de reservas
    reservasBtn.addEventListener('click', () => {
        panelAbierto = !panelAbierto;
        reservasPanel.classList.toggle('active');
        localStorage.setItem('panelReservasAbierto', JSON.stringify(panelAbierto));
    });

    // Evento para cancelar una reserva
    btnCancelarReserva.addEventListener('click', () => {
        if (!reservaSeleccionadaId) {
            Swal.fire('Error', 'Por favor selecciona una reserva para cancelar', 'error');
            return;
        }
        
        Swal.fire({
            title: '¿Cancelar reserva?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No, mantener'
        }).then((result) => {
            if (result.isConfirmed) {
                const cancelada = sistemaReservas.cancelarReserva(reservaSeleccionadaId);
                if (cancelada) {
                    Swal.fire(
                        'Cancelada',
                        'Tu reserva ha sido cancelada',
                        'success'
                    );
                    reservaSeleccionadaId = null;
                    actualizarPanelReservas();
                    renderizarHabitaciones(sistemaReservas.habitaciones);
                }
            }
        });
    });

    // Evento para confirmar todas las reservas
    btnConfirmarReservas.addEventListener('click', () => {
        if (sistemaReservas.reservas.length === 0) {
            Swal.fire('Error', 'No hay reservas para confirmar', 'error');
            return;
        }
        
        Swal.fire({
            title: '¿Confirmar todas las reservas?',
            text: `Total a pagar: $${sistemaReservas.calcularTotalReservas()}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, confirmar y pagar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                sistemaReservas.confirmarReservas();
                Swal.fire(
                    '¡Reservas confirmadas!',
                    'Gracias por tu reserva. Te hemos enviado un email con los detalles.',
                    'success'
                );
                actualizarPanelReservas();
                renderizarHabitaciones(sistemaReservas.habitaciones);
            }
        });
    });

    // Evento para aplicar filtros
    aplicarFiltrosBtn.addEventListener('click', () => {
        const tipo = tipoHabitacionSelect.value;
        const precioMax = precioMaxInput.value ? parseInt(precioMaxInput.value) : null;
        const habitacionesFiltradas = sistemaReservas.filtrarHabitaciones(tipo, precioMax);
        renderizarHabitaciones(habitacionesFiltradas);
    });

    // Inicializar la aplicación
    init();
});