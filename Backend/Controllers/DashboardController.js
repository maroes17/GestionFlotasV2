// DashboardController.js
// Controlador para la gestión del dashboard principal

/**
 * Obtiene todos los datos necesarios para el dashboard
 */
function getDashboardData() {
  try {
    const access = checkUserAccess();
    if (!access.hasAccess) {
      return {
        kpis: {
          activeVehicles: 0,
          activeTrips: 0,
          pendingMaintenance: 0,
          expiringPolicies: 0
        },
        charts: {
          trips: [],
          expenses: []
        },
        recentActivity: []
      };
    }

    return {
      kpis: getKPIs() || {
        activeVehicles: 0,
        activeTrips: 0,
        pendingMaintenance: 0,
        expiringPolicies: 0
      },
      charts: getChartData() || {
        trips: [],
        expenses: []
      },
      recentActivity: getRecentActivity() || []
    };
  } catch (error) {
    console.error('Error en getDashboardData:', error);
    return {
      kpis: {
        activeVehicles: 0,
        activeTrips: 0,
        pendingMaintenance: 0,
        expiringPolicies: 0
      },
      charts: {
        trips: [],
        expenses: []
      },
      recentActivity: []
    };
  }
}

/**
 * Obtiene los KPIs principales
 */
function getKPIs() {
  const ss = getSystemSpreadsheet();
  
  // Por ahora retornamos datos de ejemplo
  // Esto se actualizará cuando implementemos cada módulo
  return {
    activeVehicles: 12,
    activeTrips: 5,
    pendingMaintenance: 3,
    expiringPolicies: 2
  };
}

/**
 * Obtiene los datos para los gráficos
 */
function getChartData() {
  // Por ahora retornamos datos de ejemplo
  // Esto se actualizará cuando implementemos cada módulo
  return {
    trips: {
      labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
      data: [65, 59, 80, 81, 56, 55]
    },
    expenses: {
      labels: ['Combustible', 'Peajes', 'Viáticos', 'Mantenimiento', 'Otros'],
      data: [30, 20, 15, 25, 10]
    }
  };
}

/**
 * Obtiene la actividad reciente
 */
function getRecentActivity() {
  // Por ahora retornamos datos de ejemplo
  // Esto se actualizará cuando implementemos cada módulo
  return [
    {
      date: new Date(),
      type: 'Viaje',
      description: 'Buenos Aires - Córdoba',
      status: 'En Curso'
    },
    {
      date: new Date(Date.now() - 86400000), // Ayer
      type: 'Mantenimiento',
      description: 'Cambio de aceite - Unidad 105',
      status: 'Completado'
    },
    {
      date: new Date(Date.now() - 172800000), // Hace 2 días
      type: 'Póliza',
      description: 'Renovación seguro - Unidad 103',
      status: 'Pendiente'
    },
    {
      date: new Date(Date.now() - 259200000), // Hace 3 días
      type: 'Incidente',
      description: 'Pinchazo de neumático - Unidad 108',
      status: 'Completado'
    }
  ];
}

/**
 * Muestra el dashboard
 */
function showDashboard() {
  const html = HtmlService.createTemplateFromFile('Frontend/html/dashboard')
    .evaluate()
    .setTitle('Dashboard - Sistema de Gestión de Flota')
    .setWidth(1200)
    .setHeight(800);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Dashboard');
} 