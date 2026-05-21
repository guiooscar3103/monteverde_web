# 🎓 MonteVerde - Sistema de Gestión Educativa

> **Plataforma web para gestión académica integral con Flask + React + MySQL**

***

## 🏗️ Estructura del Proyecto

```
prototipo-monteverde-react/
└── monteverde/
    ├── backend/             # 🐍 API Flask (Python)
    │   ├── src/            # Código fuente del backend
    │   ├── venv/           # Entorno virtual Python
    │   ├── app.py          # Aplicación principal
    │   └── config.py       # Configuración
    ├── frontend/           # ⚛️ Aplicación React
    │   ├── src/            # Código fuente del frontend
    │   ├── public/         # Archivos públicos
    │   └── package.json    # Dependencias Node.js
    └── database/           # 🗄️ Base de datos MySQL
        └── monteverde_db.sql
```


***

## 📋 Prerrequisitos

Antes de empezar, asegúrate de tener instalado:

### ✅ Requisitos Obligatorios:

- **Python 3.8+** - [Descargar aquí](https://www.python.org/downloads/)
- **Node.js 16+** - [Descargar aquí](https://nodejs.org/)
- **MySQL 8.0+** - [Descargar aquí](https://dev.mysql.com/downloads/)
- **Git** - [Descargar aquí](https://git-scm.com/)


### 🔧 Verificar instalación:

```bash
python --version    # Debe mostrar 3.8+
node --version      # Debe mostrar v16+
mysql --version     # Debe mostrar 8.0+
git --version       # Cualquier versión reciente
```


***

## 🚀 Instalación Paso a Paso

### **PASO 1: 📥 Clonar el Repositorio**

```bash
# Clonar el proyecto
git clone https://github.com/[tu-usuario]/prototipo-monteverde-react.git

# Navegar al directorio
cd prototipo-monteverde-react/monteverde
```


### **PASO 2: 🗄️ Configurar Base de Datos**

#### 2.1 Crear la base de datos:

```bash
# Conectar a MySQL (te pedirá la contraseña de root)
mysql -u root -p
```

```sql
-- Crear base de datos
CREATE DATABASE monteverde_db;
exit;
```


#### 2.2 Importar datos:

```bash
# Importar estructura y datos de prueba
mysql -u root -p monteverde_db < database/monteverde_db.sql
```


#### 2.3 Verificar instalación:

```sql
mysql -u root -p
USE monteverde_db;
SHOW TABLES;
SELECT COUNT(*) FROM usuarios;  -- Debe mostrar usuarios creados
exit;
```


### **PASO 3: 🐍 Configurar Backend (Flask)**

#### 3.1 Navegar al backend:

```bash
cd backend
```


#### 3.2 Crear entorno virtual:

**En Windows:**

```bash
python -m venv venv
venv\Scripts\activate
```

**En macOS/Linux:**

```bash
python3 -m venv venv
source venv/bin/activate
```


#### 3.3 Instalar dependencias:

```bash
# Instalar librerías Python
pip install -r requirements.txt
```


#### 3.4 Configurar conexión a BD:

Edita `config.py` y actualiza las credenciales de MySQL:

```python
MYSQL_HOST = 'localhost'
MYSQL_USER = 'root'          # Tu usuario MySQL
MYSQL_PASSWORD = 'tu_password'  # Tu contraseña MySQL
MYSQL_DB = 'monteverde_db'
```


#### 3.5 Probar backend:

```bash
# Ejecutar servidor Flask
python app.py
```

**✅ Deberías ver:** `Running on http://localhost:5000`

### **PASO 4: ⚛️ Configurar Frontend (React)**

#### 4.1 Abrir nueva terminal y navegar:

```bash
cd frontend
```


#### 4.2 Instalar dependencias:

```bash
# Instalar librerías Node.js
npm install
```


#### 4.3 Ejecutar frontend:

```bash
# Iniciar servidor de desarrollo
npm run dev
```

**✅ Deberías ver:** `Local: http://localhost:5173`

***

## 🎯 Acceso al Sistema

Una vez que ambos servidores estén corriendo:

1. **Abrir navegador:** `http://localhost:5173`
2. **Usar credenciales de prueba:**

### 👥 Usuarios de Prueba

| Rol | Email | Contraseña | Funcionalidades |
| :-- | :-- | :-- | :-- |
| **👨‍🏫 Docente** | `maria@monteverde.com` | `123456` | Calificaciones, Asistencia, Observador, Mensajes |
| **👨‍👩‍👧‍👦 Familia** | `familia@gmail.com` | `123456` | Reportes académicos, Mensajes, Consultas |
| **👑 Admin** | `admin@monteverde.com` | `admin123` | Panel administrativo |


***

## 🛠️ Comandos Útiles

### Backend (Flask):

```bash
cd backend
# Activar entorno virtual
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Ejecutar servidor
python app.py

# Instalar nueva dependencia
pip install nombre-libreria
pip freeze > requirements.txt
```


### Frontend (React):

```bash
cd frontend
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm run build

# Instalar nueva dependencia
npm install nombre-libreria
```


### Base de Datos:

```bash
# Backup de BD
mysqldump -u root -p monteverde_db > backup.sql

# Restaurar BD
mysql -u root -p monteverde_db < backup.sql

# Conectar a BD
mysql -u root -p monteverde_db
```


***

## 📱 Funcionalidades Implementadas

### 🎓 **Panel Docente:**

- ✅ **Dashboard** con resumen de cursos y tareas
- ✅ **Gestión de Calificaciones** por asignatura y período
- ✅ **Control de Asistencia** diario
- ✅ **Observador del Alumno** con anotaciones
- ✅ **Sistema de Mensajes** con familias


### 👨‍👩‍👧‍👦 **Panel Familia:**

- ✅ **Dashboard** con información del estudiante
- ✅ **Reporte Académico** con calificaciones
- ✅ **Historial de Asistencia**
- ✅ **Comunicación** con docentes


### 👑 **Panel Admin:**

- ✅ **Dashboard administrativo**
- 🔄 *Gestión de usuarios (en desarrollo)*
- 🔄 *Reportes institucionales (en desarrollo)*

***

## 🗂️ Estructura de Datos

### 📊 **Tablas Principales:**

- **usuarios** - Docentes, familias y administradores
- **estudiantes** - Información estudiantil
- **cursos** - Grados y secciones
- **calificaciones** - Notas por asignatura
- **asistencia** - Control diario de presencia
- **observaciones** - Anotaciones comportamentales
- **mensajes** - Sistema de comunicación

***

## 🔧 Solución de Problemas

### ❌ **Error: "Module not found"**

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend  
cd frontend
npm install
```


### ❌ **Error: "Can't connect to MySQL"**

1. Verificar que MySQL esté corriendo
2. Revisar credenciales en `config.py`
3. Confirmar que la BD existe: `USE monteverde_db;`

### ❌ **Error: "Port 5000 already in use"**

```bash
# Cambiar puerto en config.py o finalizar proceso
# Windows
netstat -ano | findstr :5000
taskkill /PID [número] /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```


### ❌ **Error: "CORS policy"**

- Verificar que el backend esté corriendo en `localhost:5000`
- Frontend debe estar en `localhost:5173`

***

## 📞 Soporte

### 🐛 **¿Encontraste un error?**

1. Verificar que todos los servicios estén corriendo
2. Revisar la consola del navegador (F12)
3. Revisar logs del terminal del backend

### 💡 **¿Necesitas ayuda?**

- Revisar este README paso a paso
- Verificar que los prerrequisitos estén instalados
- Comprobar las credenciales de la base de datos

***

## 🎉 ¡Listo para Usar!

Si seguiste todos los pasos correctamente, deberías tener:

✅ **Backend Flask** corriendo en `http://localhost:5000`
✅ **Frontend React** corriendo en `http://localhost:5173`
✅ **Base de datos MySQL** con datos de prueba
✅ **Sistema completo** listo para demostración

***

<div align="center">

**🎓 Desarrollado para el curso de Ingeniería Web II**  
*Universidad Minuto de Dios - UNIMINUTO*


</div>

***

## 📝 Notas Adicionales

- **Puerto Backend:** 5000 (Flask)
- **Puerto Frontend:** 5173 (Vite)
- **Base de Datos:** MySQL en puerto 3306
- **Entorno:** Desarrollo local

