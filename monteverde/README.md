# MonteVerde - Guía de Inicio Rápido

Este repositorio contiene la aplicación **MonteVerde**, un sistema web para la gestión académica desarrollado en React (frontend) y Flask (backend) con persistencia en MySQL.

A continuación se detallan los pasos exactos que se deben realizar para configurar e iniciar la aplicación desde cero tras descargar o clonar este repositorio.

---

## Requisitos Previos

Asegúrate de tener instalado y activo en tu sistema:
- **Python 3.10+**
- **Node.js 18+** y **npm**
- Servidor **MySQL** corriendo localmente

---

## Paso 1: Configurar y Ejecutar el Backend (Flask)

1. Abre tu terminal y ve al directorio del backend:
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

4. Instala todas las dependencias necesarias:
   ```bash
   pip install -r requirements.txt
   ```

5. Configura el archivo de entorno `.env`:
   - Crea una copia de `.env.example` y nómbrala `.env`:
     - *En Windows:* `copy .env.example .env` (o `Copy-Item .env.example .env`)
     - *En Linux/macOS:* `cp .env.example .env`
   - Abre el archivo `.env` en tu editor de código y configura:
     - Las credenciales de acceso a tu servidor MySQL local (`DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`).
     - **Clave JWT Obligatoria:** Genera una clave secreta segura y aleatoria de al menos 16 caracteres. Puedes generarla con el siguiente comando:
       ```bash
       python -c "import secrets; print(secrets.token_hex(32))"
       ```
       Copia el hash impreso y asígnalo en el campo:
       ```ini
       JWT_SECRET_KEY=tu_hash_generado
       ```

6. **Inicializa la Base de Datos automáticamente**:
   En lugar de importar scripts SQL manualmente, ejecuta el script de inicialización automática provisto en el backend:
   ```bash
   python init_db.py
   ```
   *Este script se encargará de crear la base de datos en tu servidor MySQL, estructurar las tablas, migrar campos de seguridad e importar los datos semilla/pruebas automáticamente.*

7. Inicia el servidor del backend:
   ```bash
   python app.py
   ```
   *El backend se levantará y estará escuchando peticiones en [http://localhost:5000](http://localhost:5000).*

---

## Paso 2: Configurar y Ejecutar el Frontend (React)

1. Abre una nueva terminal, o pestaña en tu consola, y ve al directorio del frontend:
   ```bash
   cd frontend
   ```

2. Configura el archivo de entorno `.env`:
   - Copia la plantilla `.env.example` a un nuevo archivo `.env`:
     - *En Windows:* `copy .env.example .env`
     - *En Linux/macOS:* `cp .env.example .env`
   - Asegúrate de que apunte correctamente a la URL del backend (`VITE_API_URL=http://localhost:5000`).

3. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```

4. Inicia el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
   *El frontend se compilará y abrirá localmente en tu navegador en [http://localhost:5173](http://localhost:5173).*

---

## Configuración Institucional Persistente

La configuración general de la institución educativa (nombre, rector, período académico, datos de contacto) se persiste de forma segura en la base de datos MySQL/MariaDB en la tabla `configuracion_institucional`.

- **Fuente de verdad:** Base de datos relacional (no archivos JSON locales).
- **Control de acceso:** Consulta pública/autenticada y modificación restringida exclusivamente a usuarios con rol `admin` mediante JWT.
- **Migración para producción:**
  ```bash
  mysql -u <usuario> -p monteverde_db < database/migrations/03_migracion_configuracion_institucional.sql
  ```

---

## Ejecución de Pruebas Unitarias e Integración

Para validar la suite completa de pruebas (109 pruebas de seguridad, autenticación, tareas, circulares y configuración institucional):
```bash
cd backend
python -m pytest -v
```

