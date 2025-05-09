// WebAppController.js
// Controlador principal para la webapp

/**
 * Punto de entrada principal para la webapp
 */
function doGet(e) {
  try {
    // Verificar si se solicita explícitamente el logout
    if (e && e.parameter && e.parameter.action === 'logout') {
      // Simplemente mostrar la pantalla de login
      return HtmlService.createTemplateFromFile('Frontend/html/login')
        .evaluate()
        .setTitle('Login - Sistema de Gestión de Flota')
        .setFaviconUrl('https://www.google.com/images/icons/product/drive-32.png')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    
    // Verificar si se solicita forzar autenticación
    if (e && e.parameter && e.parameter.auth === 'force') {
      return HtmlService.createTemplateFromFile('Frontend/html/login')
        .evaluate()
        .setTitle('Login - Sistema de Gestión de Flota')
        .setFaviconUrl('https://www.google.com/images/icons/product/drive-32.png')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    
    // Forzar página de login primero (siempre por defecto)
    return HtmlService.createTemplateFromFile('Frontend/html/login')
      .evaluate()
      .setTitle('Login - Sistema de Gestión de Flota')
      .setFaviconUrl('https://www.google.com/images/icons/product/drive-32.png')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (error) {
    console.error('Error en doGet:', error);
    return HtmlService.createHtmlOutput(`
      <h1>Error</h1>
      <p>Ha ocurrido un error al cargar la aplicación. Por favor, intenta de nuevo más tarde.</p>
      <p>Si el problema persiste, contacta al administrador del sistema.</p>
    `)
    .setTitle('Error - Sistema de Gestión de Flota');
  }
}

/**
 * Incluye un archivo HTML
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Obtiene la URL base del script
 */
function getBaseUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * Verifica si la aplicación está siendo accedida como webapp
 */
function isWebApp() {
  return typeof ScriptApp.getService().getUrl() !== 'undefined';
}

/**
 * Redirige a la página de inicio de sesión si es necesario
 */
function checkAuth() {
  const access = checkUserAccess();
  return {
    isAuthorized: access.hasAccess,
    userInfo: access.hasAccess ? access.userInfo : null,
    redirectUrl: access.hasAccess ? null : ScriptApp.getService().getUrl()
  };
}

/**
 * Obtiene el HTML del dashboard para cargarlo dinámicamente
 */
function getDashboardHTML() {
  try {
    // Verificar autenticación
    const user = Session.getActiveUser();
    if (!user || !user.getEmail()) {
      throw new Error('No autenticado');
    }

    // Verificar si el usuario tiene acceso
    const userInfo = getUserInfo(user.getEmail());
    if (!userInfo) {
      throw new Error('Usuario no autorizado');
    }

    // Generar el HTML del dashboard
    return HtmlService.createTemplateFromFile('Frontend/html/dashboard')
      .evaluate()
      .getContent();
  } catch (error) {
    console.error('Error en getDashboardHTML:', error);
    throw new Error('Error al cargar el dashboard: ' + error.message);
  }
}

/**
 * Obtiene el HTML de la página de login
 */
function getLoginHTML() {
  try {
    return HtmlService.createTemplateFromFile('Frontend/html/login')
      .evaluate()
      .getContent();
  } catch (error) {
    console.error('Error en getLoginHTML:', error);
    throw new Error('Error al cargar la página de login: ' + error.message);
  }
} 

/**
 * Maneja el cierre de sesión del usuario
 */
function doLogout() {
  try {
    // No hay una función directa para cerrar sesión en GAS
    // pero podemos limpiar variables de sesión si las usamos
    
    // Indicar éxito
    return true;
  } catch (error) {
    console.error('Error en doLogout:', error);
    return false;
  }
} 