// AuthController.js
// Controlador para la gestión de autenticación y autorización

/**
 * Roles disponibles en el sistema
 */
const ROLES = {
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  OPERATOR: 'Operador'
};

/**
 * Verifica el estado de autenticación del usuario actual
 */
function checkUserAuth() {
  try {
    const user = Session.getActiveUser();
    Logger.log('checkUserAuth: Verificando usuario activo');
    
    if (!user || !user.getEmail()) {
      Logger.log('checkUserAuth: No hay usuario activo');
      return { 
        isAuthenticated: false,
        message: 'No hay usuario activo'
      };
    }

    const email = user.getEmail();
    Logger.log('checkUserAuth: Usuario activo - ' + email);

    const userInfo = getUserInfo(email);
    if (!userInfo) {
      Logger.log('checkUserAuth: Usuario no encontrado o inactivo - ' + email);
      return { 
        isAuthenticated: false,
        message: 'Usuario no encontrado o inactivo',
        email: email
      };
    }

    Logger.log('checkUserAuth: Autenticación exitosa - ' + JSON.stringify(userInfo));
    return {
      isAuthenticated: true,
      hasAccess: true,
      email: userInfo.email,
      name: userInfo.name,
      role: userInfo.role,
      message: 'Autenticación exitosa'
    };
  } catch (error) {
    Logger.log('Error en checkUserAuth: ' + error);
    console.error('Error en checkUserAuth:', error);
    return { 
      isAuthenticated: false,
      message: 'Error durante la autenticación: ' + error.message
    };
  }
}

/**
 * Autentica al usuario actual
 */
function authenticateUser() {
  try {
    const user = Session.getActiveUser();
    if (!user || !user.getEmail()) {
      return {
        success: false,
        message: 'No se pudo obtener la información del usuario'
      };
    }

    const email = user.getEmail();
    const userInfo = getUserInfo(email);

    if (!userInfo) {
      return {
        success: false,
        hasAccess: false,
        email: email,
        message: 'Usuario no autorizado'
      };
    }

    // Actualizar última conexión
    updateLastLogin(email);

    return {
      success: true,
      hasAccess: true,
      ...userInfo
    };
  } catch (error) {
    console.error('Error en authenticateUser:', error);
    throw new Error('Error durante la autenticación');
  }
}

/**
 * Obtener el spreadsheet del sistema
 */
function getSystemSpreadsheet() {
  // ID del spreadsheet desde .clasp.json
  const SPREADSHEET_ID = '13cTGypTRtdHjRkrBUagMhP9ApT2Qww3n8NqXRGeVSAc';
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Obtiene la información del usuario desde la hoja de usuarios
 */
function getUserInfo(email) {
  try {
    Logger.log('getUserInfo: Buscando información para el usuario: ' + email);
    
    const ss = getSystemSpreadsheet();
    const usersSheet = ss.getSheetByName('Users');
    
    if (!usersSheet) {
      Logger.log('getUserInfo: La hoja de usuarios no está configurada');
      throw new Error('La hoja de usuarios no está configurada');
    }

    const data = usersSheet.getDataRange().getValues();
    const headers = data[0];
    
    // Verificar estructura de la hoja
    const emailCol = headers.indexOf('Email');
    const nameCol = headers.indexOf('Nombre');
    const roleCol = headers.indexOf('Rol');
    const statusCol = headers.indexOf('Estado');

    if (emailCol === -1 || nameCol === -1 || roleCol === -1 || statusCol === -1) {
      Logger.log('getUserInfo: Estructura de hoja inválida. Columnas encontradas: ' + headers.join(', '));
      throw new Error('Estructura de hoja inválida');
    }

    Logger.log('getUserInfo: Buscando en ' + data.length + ' filas');

    for (let i = 1; i < data.length; i++) {
      if (data[i][emailCol] === email) {
        Logger.log('getUserInfo: Usuario encontrado en la fila ' + (i + 1));
        
        if (data[i][statusCol] !== 'Activo') {
          Logger.log('getUserInfo: Usuario inactivo - ' + email);
          return null;
        }

        const userInfo = {
          email: data[i][emailCol],
          name: data[i][nameCol],
          role: data[i][roleCol]
        };
        
        Logger.log('getUserInfo: Información recuperada - ' + JSON.stringify(userInfo));
        return userInfo;
      }
    }

    Logger.log('getUserInfo: Usuario no encontrado - ' + email);
    return null;
  } catch (error) {
    Logger.log('Error en getUserInfo: ' + error);
    console.error('Error en getUserInfo:', error);
    throw error;
  }
}

/**
 * Actualiza la última conexión del usuario
 */
function updateLastLogin(email) {
  const ss = getSystemSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  
  if (!usersSheet) return;

  const data = usersSheet.getDataRange().getValues();
  const headers = data[0];
  const emailCol = headers.indexOf('Email');
  const lastLoginCol = headers.indexOf('Última Conexión');

  if (lastLoginCol === -1) return;

  for (let i = 1; i < data.length; i++) {
    if (data[i][emailCol] === email) {
      usersSheet.getRange(i + 1, lastLoginCol + 1).setValue(new Date());
      break;
    }
  }
}

/**
 * Verifica si el usuario tiene un rol específico
 */
function hasRole(role) {
  try {
    const user = Session.getActiveUser();
    if (!user || !user.getEmail()) {
      Logger.log('hasRole: No hay usuario activo');
      return false;
    }

    const email = user.getEmail();
    Logger.log('hasRole: Verificando rol para usuario: ' + email);

    // Obtener datos directamente de la hoja
    const ss = getSystemSpreadsheet();
    const usersSheet = ss.getSheetByName('Users');
    
    if (!usersSheet) {
      Logger.log('hasRole: Hoja de usuarios no encontrada');
      return false;
    }

    const data = usersSheet.getDataRange().getValues();
    const headers = data[0];
    const emailCol = headers.indexOf('Email');
    const roleCol = headers.indexOf('Rol');
    const statusCol = headers.indexOf('Estado');

    if (emailCol === -1 || roleCol === -1 || statusCol === -1) {
      Logger.log('hasRole: Columnas requeridas no encontradas');
      return false;
    }

    // Buscar el usuario
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailCol] === email) {
        const userRole = data[i][roleCol];
        const userStatus = data[i][statusCol];
        
        Logger.log('hasRole: Usuario encontrado - Role=' + userRole + ', Status=' + userStatus);
        
        // Verificar si el usuario está activo y tiene el rol correcto
        if (userStatus === 'Activo' && userRole === role) {
          Logger.log('hasRole: Usuario tiene el rol requerido y está activo');
          return true;
        } else {
          Logger.log('hasRole: Usuario no cumple los requisitos - Role=' + userRole + ', Status=' + userStatus + ', RoleRequerido=' + role);
          return false;
        }
      }
    }

    Logger.log('hasRole: Usuario no encontrado en la hoja');
    return false;
  } catch (error) {
    Logger.log('Error en hasRole: ' + error);
    console.error('Error en hasRole:', error);
    return false;
  }
}

/**
 * Obtiene la URL del script
 */
function getScriptURL() {
  return ScriptApp.getService().getUrl();
}

/**
 * Inicializa la hoja de usuarios si no existe
 */
function initializeUsersSheet() {
  const ss = getSystemSpreadsheet();
  let usersSheet = ss.getSheetByName('Users');
  
  if (!usersSheet) {
    usersSheet = ss.insertSheet('Users');
    
    // Configurar encabezados con el nuevo campo de contraseña
    usersSheet.getRange('A1:F1').setValues([['Email', 'Nombre', 'Rol', 'Estado', 'Última Conexión', 'Contraseña']]);
    usersSheet.getRange('A1:F1').setBackground('#4a86e8').setFontColor('white').setFontWeight('bold');
    
    // Agregar el usuario actual como administrador con contraseña por defecto
    const user = Session.getActiveUser();
    const defaultPassword = hashPassword('admin123'); // Contraseña por defecto: admin123
    
    usersSheet.getRange('A2:F2').setValues([[
      user.getEmail(),
      user.getEmail().split('@')[0],
      ROLES.ADMIN,
      'Activo',
      new Date(),
      defaultPassword
    ]]);
    
    // Proteger la hoja
    const protection = usersSheet.protect();
    protection.setDescription('Configuración de Usuarios - Solo Administradores');
    protection.setWarningOnly(false);
    
    // Permitir que solo los administradores editen
    protection.addEditor(user.getEmail());
  } else {
    // Verificar si ya existe la columna de contraseña
    const headers = usersSheet.getRange(1, 1, 1, usersSheet.getLastColumn()).getValues()[0];
    if (!headers.includes('Contraseña')) {
      // Agregar la columna de contraseña si no existe
      const newColIndex = usersSheet.getLastColumn() + 1;
      usersSheet.getRange(1, newColIndex).setValue('Contraseña');
      usersSheet.getRange(1, newColIndex).setBackground('#4a86e8').setFontColor('white').setFontWeight('bold');
      
      // Asignar contraseña por defecto a todos los usuarios existentes
      const defaultPassword = hashPassword('changeme');
      const numRows = usersSheet.getLastRow();
      if (numRows > 1) {
        const passwordRange = usersSheet.getRange(2, newColIndex, numRows - 1, 1);
        const passwordValues = Array(numRows - 1).fill([defaultPassword]);
        passwordRange.setValues(passwordValues);
      }
    }
  }
}

/**
 * Genera un hash seguro para una contraseña
 * Utilizamos SHA-256 con un salt único para cada usuario
 */
function hashPassword(password, salt) {
  if (!salt) {
    // Generar un salt aleatorio si no se proporciona
    salt = Utilities.getUuid();
  }
  
  // Combinar password y salt
  const passwordWithSalt = password + salt;
  
  // Generar hash SHA-256
  const hash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, 
    passwordWithSalt,
    Utilities.Charset.UTF_8
  );
  
  // Convertir el hash a string hexadecimal
  const hashHex = hash.map(function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
  
  // Devolver salt y hash separados por punto y coma
  return salt + ';' + hashHex;
}

/**
 * Verifica si una contraseña coincide con el hash almacenado
 */
function verifyPassword(password, storedHash) {
  try {
    // Si la contraseña almacenada está vacía o es undefined
    if (!storedHash) {
      return false;
    }
    
    // Si la contraseña almacenada es texto plano (no tiene formato de hash)
    if (!storedHash.includes(';')) {
      return password === storedHash;
    }
    
    // Separar el salt del hash
    const parts = storedHash.split(';');
    if (parts.length !== 2) {
      console.error('Formato de hash inválido: ' + storedHash);
      return false; // Formato inválido
    }
    
    const salt = parts[0];
    const hash = parts[1];
    
    // Generar el hash de la contraseña proporcionada con el mismo salt
    const computedHash = hashPassword(password, salt);
    const computedParts = computedHash.split(';');
    
    if (computedParts.length !== 2) {
      console.error('Error al computar el hash');
      return false;
    }
    
    // Comparar los hashes
    return computedParts[1] === hash;
  } catch (error) {
    console.error('Error en verifyPassword:', error);
    return false;
  }
}

/**
 * Actualiza la contraseña de un usuario
 */
function updateUserPassword(email, newPassword) {
  if (!hasRole(ROLES.ADMIN) && Session.getActiveUser().getEmail() !== email) {
    throw new Error('No tienes permisos para cambiar esta contraseña');
  }
  
  const ss = getSystemSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  
  if (!usersSheet) {
    throw new Error('La hoja de usuarios no está configurada');
  }
  
  const data = usersSheet.getDataRange().getValues();
  const headers = data[0];
  const emailCol = headers.indexOf('Email');
  const pwdCol = headers.indexOf('Contraseña');
  
  if (pwdCol === -1) {
    throw new Error('La columna de contraseña no está configurada');
  }
  
  // Buscar al usuario por email
  for (let i = 1; i < data.length; i++) {
    if (data[i][emailCol] === email) {
      // Generar hash de la nueva contraseña
      const hashedPassword = hashPassword(newPassword);
      // Actualizar en la hoja
      usersSheet.getRange(i + 1, pwdCol + 1).setValue(hashedPassword);
      return true;
    }
  }
  
  throw new Error('Usuario no encontrado');
}

/**
 * Verifica si el usuario actual tiene acceso al sistema
 */
function checkUserAccess() {
  const user = Session.getActiveUser();
  const userEmail = user.getEmail();
  const ss = getSystemSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  
  if (!usersSheet) {
    throw new Error('La hoja de usuarios no está configurada');
  }
  
  const userData = usersSheet.getDataRange().getValues();
  const userRow = userData.find(row => row[0] === userEmail);
  
  if (!userRow) {
    return {
      hasAccess: false,
      message: 'Usuario no autorizado'
    };
  }
  
  if (userRow[3] !== 'Activo') {
    return {
      hasAccess: false,
      message: 'Usuario inactivo'
    };
  }
  
  // Actualizar última conexión
  const userRowIndex = userData.findIndex(row => row[0] === userEmail) + 1;
  usersSheet.getRange(userRowIndex, 5).setValue(new Date());
  
  return {
    hasAccess: true,
    userInfo: {
      email: userRow[0],
      name: userRow[1],
      role: userRow[2],
      status: userRow[3]
    }
  };
}

/**
 * Obtiene la información del usuario actual
 */
function getCurrentUser() {
  const access = checkUserAccess();
  if (!access.hasAccess) {
    throw new Error('Usuario no autorizado');
  }
  return access.userInfo;
}

/**
 * Obtiene todos los usuarios del sistema
 */
function getUsers() {
  try {
    const user = Session.getActiveUser();
    if (!user || !user.getEmail()) {
      Logger.log('getUsers: No hay usuario activo');
      return null;
    }

    const email = user.getEmail();
    Logger.log('getUsers: Usuario activo: ' + email);
    
    // Obtener datos directamente de la hoja
    const ss = getSystemSpreadsheet();
    const usersSheet = ss.getSheetByName('Users');
    
    if (!usersSheet) {
      Logger.log('getUsers: La hoja "Users" no existe.');
      return null;
    }
    
    const data = usersSheet.getDataRange().getValues();
    const headers = data[0];
    const emailCol = headers.indexOf('Email');
    const nameCol = headers.indexOf('Nombre');
    const roleCol = headers.indexOf('Rol');
    const statusCol = headers.indexOf('Estado');
    const lastLoginCol = headers.indexOf('Última Conexión');

    // Verificar columnas requeridas
    if (emailCol === -1 || nameCol === -1 || roleCol === -1 || statusCol === -1) {
      Logger.log('getUsers: Faltan columnas requeridas');
      return null;
    }

    // Verificar si el usuario actual es administrador
    let isAdmin = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailCol] === email && 
          data[i][statusCol] === 'Activo' && 
          data[i][roleCol] === ROLES.ADMIN) {
        isAdmin = true;
        break;
      }
    }

    if (!isAdmin) {
      Logger.log('getUsers: Usuario no es administrador o no está activo');
      return null;
    }

    // Si es administrador, retornar todos los usuarios
    const users = data.slice(1).map(row => ({
      email: row[emailCol] || '',
      name: row[nameCol] || '',
      role: row[roleCol] || '',
      status: row[statusCol] || '',
      lastLogin: row[lastLoginCol] ? new Date(row[lastLoginCol]).toISOString() : null
    }));

    Logger.log('getUsers: Retornando ' + users.length + ' usuarios');
    return users;

  } catch (error) {
    Logger.log('getUsers: Error inesperado: ' + error);
    console.error('Error en getUsers:', error);
    return null;
  }
}

/**
 * Obtiene un usuario por su email
 */
function getUserByEmail(email) {
  if (!hasRole(ROLES.ADMIN)) {
    throw new Error('No tienes permisos para ver información de usuarios');
  }
  
  const ss = getSystemSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  const data = usersSheet.getDataRange().getValues();
  const userRow = data.find(row => row[0] === email);
  
  if (!userRow) {
    throw new Error('Usuario no encontrado');
  }
  
  return {
    email: userRow[0],
    name: userRow[1],
    role: userRow[2],
    status: userRow[3],
    lastLogin: userRow[4]
  };
}

/**
 * Agrega un nuevo usuario al sistema
 */
function addUser(userData) {
  if (!hasRole(ROLES.ADMIN)) {
    throw new Error('No tienes permisos para agregar usuarios');
  }

  // Validación de campos obligatorios
  if (!userData.email || !userData.name || !userData.role || !userData.status) {
    throw new Error('Todos los campos (email, nombre, rol, estado) son obligatorios');
  }

  const ss = getSystemSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');

  // Verificar si el email ya existe
  const existingUser = usersSheet.getDataRange()
    .getValues()
    .find(row => row[0] === userData.email);

  if (existingUser) {
    throw new Error('Ya existe un usuario con ese email');
  }

  usersSheet.appendRow([
    userData.email,
    userData.name,
    userData.role,
    userData.status,
    new Date(),
    '' // Contraseña vacía por defecto
  ]);
}

/**
 * Actualiza un usuario existente
 */
function updateUser(userData) {
  if (!hasRole(ROLES.ADMIN)) {
    throw new Error('No tienes permisos para modificar usuarios');
  }
  
  const ss = getSystemSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  const data = usersSheet.getDataRange().getValues();
  const userRowIndex = data.findIndex(row => row[0] === userData.email);
  
  if (userRowIndex === -1) {
    throw new Error('Usuario no encontrado');
  }
  
  // Mantener la última conexión y contraseña sin cambios
  const lastLogin = data[userRowIndex][4];
  const password = data[userRowIndex][5];
  
  usersSheet.getRange(userRowIndex + 1, 1, 1, 6).setValues([[
    userData.email,
    userData.name,
    userData.role,
    userData.status,
    lastLogin,
    password
  ]]);
}

/**
 * Elimina un usuario del sistema
 */
function deleteUser(email) {
  if (!hasRole(ROLES.ADMIN)) {
    throw new Error('No tienes permisos para eliminar usuarios');
  }
  
  const ss = getSystemSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  const data = usersSheet.getDataRange().getValues();
  const userRowIndex = data.findIndex(row => row[0] === email);
  
  if (userRowIndex === -1) {
    throw new Error('Usuario no encontrado');
  }
  
  // No permitir eliminar al último administrador
  const adminCount = data.filter(row => row[2] === ROLES.ADMIN).length;
  if (data[userRowIndex][2] === ROLES.ADMIN && adminCount <= 1) {
    throw new Error('No se puede eliminar al último administrador');
  }
  
  usersSheet.deleteRow(userRowIndex + 1);
}

/**
 * Autentica al usuario con email y contraseña
 */
function authenticateWithPassword(email, password) {
  try {
    if (!email || !password) {
      return {
        success: false,
        message: 'Debes proporcionar email y contraseña'
      };
    }

    // Buscar el usuario en la hoja
    const ss = getSystemSpreadsheet();
    const usersSheet = ss.getSheetByName('Users');
    
    if (!usersSheet) {
      return {
        success: false,
        message: 'La hoja de usuarios no está configurada'
      };
    }

    const data = usersSheet.getDataRange().getValues();
    const headers = data[0];
    const emailCol = headers.indexOf('Email');
    const nameCol = headers.indexOf('Nombre');
    const roleCol = headers.indexOf('Rol');
    const statusCol = headers.indexOf('Estado');
    const pwdCol = headers.indexOf('Contraseña');

    // Verificar si existe la columna de contraseña
    if (pwdCol === -1) {
      // Si no existe, inicializar la columna de contraseñas
      initializePasswordColumn(usersSheet, data);
      
      // Permitir el acceso por esta vez con la contraseña proporcionada
      for (let i = 1; i < data.length; i++) {
        if (data[i][emailCol] === email && data[i][statusCol] === 'Activo') {
          updateLastLogin(email);
          return {
            success: true,
            hasAccess: true,
            email: data[i][emailCol],
            name: data[i][nameCol],
            role: data[i][roleCol],
            message: 'Primera autenticación exitosa. Se ha configurado tu contraseña.'
          };
        }
      }
      
      return {
        success: false,
        message: 'Usuario no encontrado o inactivo'
      };
    }

    // Buscar usuario por email
    let userRow = null;
    let userRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailCol] === email) {
        userRow = data[i];
        userRowIndex = i;
        break;
      }
    }

    if (!userRow) {
      return {
        success: false,
        message: 'Usuario no encontrado'
      };
    }

    // Verificar estado del usuario
    if (userRow[statusCol] !== 'Activo') {
      return {
        success: false,
        message: 'Usuario inactivo'
      };
    }

    // Verificar contraseña
    let storedHash = userRow[pwdCol];
    let authenticated = false;
    
    // Caso 1: No hay contraseña almacenada (usuario nuevo o migración)
    if (!storedHash || storedHash === '') {
      // Configurar la nueva contraseña y permitir acceso
      const hashedPassword = hashPassword(password);
      usersSheet.getRange(userRowIndex + 1, pwdCol + 1).setValue(hashedPassword);
      authenticated = true;
      
      console.log('Primera configuración de contraseña para: ' + email);
    } 
    // Caso 2: La contraseña es texto plano (durante migración)
    else if (!storedHash.includes(';')) {
      // Si la contraseña almacenada es texto plano y coincide
      if (storedHash === password) {
        // Convertir a formato hash para futuras autenticaciones
        const hashedPassword = hashPassword(password);
        usersSheet.getRange(userRowIndex + 1, pwdCol + 1).setValue(hashedPassword);
        authenticated = true;
        
        console.log('Migración de contraseña texto plano a hash para: ' + email);
      }
    } 
    // Caso 3: Contraseña hasheada normal
    else {
      authenticated = verifyPassword(password, storedHash);
    }

    if (!authenticated) {
      console.log('Fallo de autenticación para: ' + email);
      return {
        success: false,
        message: 'Contraseña incorrecta'
      };
    }

    // Actualizar última conexión
    updateLastLogin(email);

    // Autenticación exitosa
    return {
      success: true,
      hasAccess: true,
      email: userRow[emailCol],
      name: userRow[nameCol],
      role: userRow[roleCol]
    };
  } catch (error) {
    console.error('Error en authenticateWithPassword:', error);
    return {
      success: false,
      message: 'Error durante la autenticación: ' + error.message
    };
  }
}

/**
 * Inicializa la columna de contraseñas si no existe
 */
function initializePasswordColumn(usersSheet, data) {
  // Agregar la columna de contraseña
  const newColIndex = usersSheet.getLastColumn() + 1;
  usersSheet.getRange(1, newColIndex).setValue('Contraseña');
  usersSheet.getRange(1, newColIndex).setBackground('#4a86e8').setFontColor('white').setFontWeight('bold');
  
  // No asignar contraseñas por defecto - los usuarios establecerán la suya en el primer login
  console.log('Columna de contraseñas inicializada');
}

/**
 * Configura una contraseña en texto plano (temporal, para migración)
 * Esta función debe usarse solo para configurar contraseñas iniciales
 */
function setPlainTextPassword(email, plainPassword) {
  if (!hasRole(ROLES.ADMIN)) {
    throw new Error('No tienes permisos para configurar contraseñas');
  }
  
  const ss = getSystemSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  
  if (!usersSheet) {
    throw new Error('La hoja de usuarios no está configurada');
  }
  
  const data = usersSheet.getDataRange().getValues();
  const headers = data[0];
  const emailCol = headers.indexOf('Email');
  const pwdCol = headers.indexOf('Contraseña');
  
  if (pwdCol === -1) {
    // Si no existe la columna, crearla
    const newColIndex = usersSheet.getLastColumn() + 1;
    usersSheet.getRange(1, newColIndex).setValue('Contraseña');
    usersSheet.getRange(1, newColIndex).setBackground('#4a86e8').setFontColor('white').setFontWeight('bold');
    
    // Buscar al usuario y establecer la contraseña
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailCol] === email) {
        usersSheet.getRange(i + 1, newColIndex).setValue(plainPassword);
        return true;
      }
    }
  } else {
    // Buscar al usuario y establecer la contraseña
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailCol] === email) {
        usersSheet.getRange(i + 1, pwdCol + 1).setValue(plainPassword);
        return true;
      }
    }
  }
  
  throw new Error('Usuario no encontrado');
}

/**
 * Configura todas las contraseñas a un valor predeterminado (solo para migración)
 */
function resetAllPasswordsToDefault() {
  if (!hasRole(ROLES.ADMIN)) {
    throw new Error('No tienes permisos para restablecer contraseñas');
  }
  
  const ss = getSystemSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  
  if (!usersSheet) {
    throw new Error('La hoja de usuarios no está configurada');
  }
  
  const data = usersSheet.getDataRange().getValues();
  const headers = data[0];
  const pwdCol = headers.indexOf('Contraseña');
  
  if (pwdCol === -1) {
    // Si no existe la columna, crearla
    const newColIndex = usersSheet.getLastColumn() + 1;
    usersSheet.getRange(1, newColIndex).setValue('Contraseña');
    usersSheet.getRange(1, newColIndex).setBackground('#4a86e8').setFontColor('white').setFontWeight('bold');
    
    // Establecer la contraseña predeterminada para todos los usuarios
    for (let i = 1; i < data.length; i++) {
      usersSheet.getRange(i + 1, newColIndex).setValue('123456');
    }
  } else {
    // Establecer la contraseña predeterminada para todos los usuarios
    for (let i = 1; i < data.length; i++) {
      usersSheet.getRange(i + 1, pwdCol + 1).setValue('123456');
    }
  }
  
  return {
    success: true,
    message: 'Todas las contraseñas han sido restablecidas a "123456"'
  };
}

/**
 * Obtiene la lista de roles desde la hoja 'Roles'
 */
function getRoles() {
  var ss = getSystemSpreadsheet();
  var rolesSheet = ss.getSheetByName('Roles');
  if (!rolesSheet) {
    return [];
  }
  var data = rolesSheet.getRange(1, 1, rolesSheet.getLastRow(), 1).getValues();
  // Filtrar vacíos y devolver como array plano
  return data.map(function(row) { return row[0]; }).filter(function(role) { return role && role.toString().trim() !== ''; });
}

/**
 * Inicializa la hoja de roles si no existe
 */
function initializeRolesSheet() {
  var ss = getSystemSpreadsheet();
  var rolesSheet = ss.getSheetByName('Roles');
  if (!rolesSheet) {
    rolesSheet = ss.insertSheet('Roles');
    rolesSheet.getRange('A1:A3').setValues([
      ['Administrador'],
      ['Supervisor'],
      ['Operador']
    ]);
    rolesSheet.getRange('A1:A3').setFontWeight('bold');
  }
  return true;
}

/**
 * Función de diagnóstico para verificar el estado del usuario
 */
function diagnosticUserStatus() {
  try {
    const user = Session.getActiveUser();
    const email = user ? user.getEmail() : 'N/A';
    
    Logger.log('=== DIAGNÓSTICO DE USUARIO ===');
    Logger.log('Usuario activo: ' + email);
    
    // Verificar si el usuario existe
    const userInfo = getUserInfo(email);
    Logger.log('Información del usuario: ' + JSON.stringify(userInfo));
    
    // Verificar rol de administrador
    const isAdmin = hasRole(ROLES.ADMIN);
    Logger.log('¿Es administrador?: ' + isAdmin);
    
    // Verificar estado de autenticación
    const authStatus = checkUserAuth();
    Logger.log('Estado de autenticación: ' + JSON.stringify(authStatus));
    
    return {
      email: email,
      userInfo: userInfo,
      isAdmin: isAdmin,
      authStatus: authStatus
    };
  } catch (error) {
    Logger.log('Error en diagnóstico: ' + error);
    return {
      error: error.message,
      stack: error.stack
    };
  }
}

// Para depuración: mostrar la salida de getUsers en los logs
Logger.log(getUsers()); 