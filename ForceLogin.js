/**
 * Punto de entrada forzado para login
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('Frontend/html/login')
    .evaluate()
    .setTitle('Login - Sistema de Gestión de Flota')
    .setFaviconUrl('https://www.google.com/images/icons/product/drive-32.png')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
} 