# MonteVerde - Guía de Inicio Rápido

Este repositorio contiene la aplicación **MonteVerde**, un sistema web desarrollado en React (frontend) y Flask (backend) con almacenamiento en MySQL.

A continuación, se describen los pasos exactos para configurar y poner en marcha el proyecto desde cero tras descargar o clonar el repositorio.

---

## Requisitos Previos

Asegúrate de tener instalado en tu sistema:
- **Python 3.10+**
- **Node.js 18+** y **npm**
- Servidor **MySQL** activo

---

## Paso 1: Configurar la Base de Datos MySQL

1. Abre tu gestor de base de datos MySQL (por ejemplo, MySQL Workbench, phpMyAdmin o la consola de MySQL).
2. Crea una nueva base de datos llamada `monteverde_db`:
   ```sql
   CREATE DATABASE monteverde_db;
   ```
3. Importa el archivo del dump de la base de datos ubicado en:
   [`database/monteverde_db.sql`](file:///c:/Users/janus/Documents/Oscar%20Uniminuto/semestre%208/software%20seguro/prototipo-monteverde-react-main/prototipo-monteverde-react-main/monteverde/database/monteverde_db.sql)
   
   *Ejemplo desde consola:*
   ```bash
   mysql -u tu_usuario -p monteverde_db < database/monteverde_db.sql
   ```

---

## Paso 2: Configurar y Ejecutar el Backend (Flask)

1. Abre una terminal y dirígete al directorio del backend:
   ```bash
   cd backend
   ```
2. Crea un entorno virtual de Python:
   ```bash
   python -m venv venv
   ```
3. Activa el entorno virtual:
   - **En Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **En Windows (CMD):**
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   - **En Linux/macOS:**
     ```bash
     source venv/bin/activate
     ```
4. Instala las dependencias necesarias:
   ```bash
   pip install -r requirements.txt
   ```
5. Configura el archivo de entorno:
   - Copia el archivo plantilla `.env.example` y renómbralo como `.env`:
     - *En Windows (PowerShell):* `Copy-Item .env.example .env`
     - *En Linux/macOS/Git Bash:* `cp .env.example .env`
   - Abre el archivo `.env` creado y configura las credenciales de tu base de datos MySQL (`DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`).
   - **Importante (Seguridad):** Debes generar y configurar una clave secreta segura para la variable `JWT_SECRET_KEY`. No uses claves por defecto. Puedes generar una ejecutando:
     ```bash
     python -c "import secrets; print(secrets.token_hex(32))"
     ```
     Copia el hash obtenido y asígnalo en `.env`:
     ```ini
     JWT_SECRET_KEY=tu_hash_generado_aqui
     ```
6. Inicia el servidor del backend:
   ```bash
   python app.py
   ```
   *El backend estará corriendo en [http://localhost:5000](http://localhost:5000).*

---

## Paso 3: Configurar y Ejecutar el Frontend (React + Vite)

1. Abre una nueva pestaña/ventana de tu terminal y ve al directorio del frontend:
   ```bash
   cd frontend
   ```
2. Configura el archivo de entorno del frontend:
   - Copia la plantilla `.env.example` a `.env`:
     - *En Windows (PowerShell):* `Copy-Item .env.example .env`
     - *En Linux/macOS/Git Bash:* `cp .env.example .env`
   - Verifica que el archivo `.env` apunte a la URL correcta del backend (`VITE_API_URL=http://localhost:5000`).
3. Instala las dependencias de Node.js:
   ```bash
   npm install
   ```
4. Inicia el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
   *El frontend estará disponible en tu navegador en [http://localhost:5173](http://localhost:5173).*

---

## Pruebas de Calidad y Seguridad (Opcional)

Si deseas validar el backend ejecutando la suite de pruebas unitarias y de integración, navega a la carpeta `backend`, activa tu entorno virtual y ejecuta:
```bash
python -m unittest discover -s tests
```
