// ConfigController.js
// Controlador para la gestión de configuraciones y datos maestros

function initializeInfoSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let infoSheet = ss.getSheetByName('Info');
  
  // Si la hoja no existe, la creamos
  if (!infoSheet) {
    infoSheet = ss.insertSheet('Info');
  }

  // Definimos las secciones de datos maestros
  const masterDataSections = [
    {
      title: 'Ciudades',
      data: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán']
    },
    {
      title: 'Estados de Vehículos',
      data: ['Activo', 'En Mantenimiento', 'Fuera de Servicio', 'En Viaje']
    },
    {
      title: 'Estados de Choferes',
      data: ['Activo', 'De Licencia', 'Franco', 'En Viaje']
    },
    {
      title: 'Tipos de Mantenimiento',
      data: ['Preventivo', 'Correctivo', 'Revisión Técnica']
    },
    {
      title: 'Estados de Viaje',
      data: ['Planificado', 'En Curso', 'Completado', 'Cancelado']
    },
    {
      title: 'Tipos de Gastos',
      data: ['Combustible', 'Peajes', 'Viáticos', 'Mantenimiento', 'Otros']
    },
    {
      title: 'Tipos de Incidentes',
      data: ['Mecánico', 'Accidente', 'Demora', 'Clima', 'Otros']
    },
    {
      title: 'Estados de Pólizas',
      data: ['Vigente', 'Por Vencer', 'Vencida']
    }
  ];

  // Limpiar la hoja
  infoSheet.clear();

  // Formato inicial
  infoSheet.getRange('A1:H1').setValues([masterDataSections.map(section => section.title)]);
  infoSheet.getRange('A1:H1').setBackground('#4a86e8').setFontColor('white').setFontWeight('bold');

  // Insertar datos
  let maxRows = Math.max(...masterDataSections.map(section => section.data.length));
  for (let i = 0; i < maxRows; i++) {
    let rowData = masterDataSections.map(section => section.data[i] || '');
    infoSheet.getRange(i + 2, 1, 1, masterDataSections.length).setValues([rowData]);
  }

  // Ajustar anchos de columna y formato
  masterDataSections.forEach((_, index) => {
    infoSheet.autoResizeColumn(index + 1);
    let column = infoSheet.getRange(2, index + 1, maxRows, 1);
    column.setBorder(true, true, true, true, true, true);
  });

  // Proteger la hoja pero permitir edición
  let protection = infoSheet.protect();
  protection.setDescription('Datos Maestros - Editar con precaución');
  protection.setWarningOnly(true);
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('Sistema de Gestión');
  
  // Verificar si el usuario tiene acceso
  try {
    const access = checkUserAccess();
    if (access.hasAccess) {
      menu.addItem('Dashboard', 'showDashboard')
          .addSeparator()
          .addItem('Inicializar Hoja Info', 'initializeInfoSheet');
      
      // Opciones de administración solo para administradores
      if (hasRole(ROLES.ADMIN)) {
        menu.addSeparator()
          .addSubMenu(ui.createMenu('Administración')
            .addItem('Inicializar Hoja de Usuarios', 'initializeUsersSheet')
            .addItem('Gestionar Usuarios', 'showUserManagement'));
      }
    } else {
      menu.addItem('Solicitar Acceso', 'showAccessRequest');
    }
  } catch (e) {
    // Si hay error, mostrar solo la opción de inicialización
    menu.addItem('Inicializar Sistema', 'initializeSystem');
  }
  
  menu.addToUi();
}

function initializeSystem() {
  initializeInfoSheet();
  initializeUsersSheet();
  SpreadsheetApp.getUi().alert('Sistema inicializado correctamente');
}

function showAccessRequest() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Solicitud de Acceso',
    'Por favor, contacte al administrador del sistema para solicitar acceso.',
    ui.ButtonSet.OK
  );
}

function showUserManagement() {
  const html = HtmlService.createTemplateFromFile('Frontend/html/userManagement')
    .evaluate()
    .setWidth(800)
    .setHeight(600)
    .setTitle('Gestión de Usuarios');
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Gestión de Usuarios');
}

// Función auxiliar para incluir archivos HTML
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
} 