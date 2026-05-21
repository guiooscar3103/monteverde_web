

export async function loadHeader(path, userLabel) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Error al cargar ${path}: ${response.status} ${response.statusText}`);
    }
    const html = await response.text();
    document.getElementById('header-placeholder').innerHTML = html;

    // Insertar el usuario activo
    const userEl = document.querySelector('.header-user');
    if (userEl) {
      userEl.textContent = userLabel;
    }

    // Añadir funcionalidad al botón de salir (si existe)
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.onclick = () => {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
          window.location.href = '../index.html';
        }
      };
    }

  } catch (error) {
    console.error("❌ Error al cargar el header:", error);
    document.getElementById('header-placeholder').innerHTML = `
      <header class="app-header">
        <div class="logo"><strong>Colegio MonteVerde</strong></div>
        <div class="header-user">Error de carga</div>
      </header>
    `;
  }
}

/**
 * Carga el contenido del sidebar desde un archivo HTML externo
 * y resalta el enlace de la página actual con la clase .is-active.
 * 
 * @param {string} path - Ruta del archivo sidebar-*.html
 * @param {string} currentPage - Nombre del archivo actual (ej: 'calificaciones.html')
 * @returns {Promise<void>}
 */
export async function loadSidebar(path, currentPage) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Error al cargar ${path}: ${response.status} ${response.statusText}`);
    }
    const html = await response.text();
    document.getElementById('sidebar-placeholder').innerHTML = html;

    // Resaltar el enlace activo
    const link = document.querySelector(`#sidebar-placeholder a[href="${currentPage}"]`);
    if (link) {
      link.classList.add('is-active');
    } else {
      console.warn(`⚠️ No se encontró el enlace activo para: ${currentPage}`);
    }

  } catch (error) {
    console.error("❌ Error al cargar el sidebar:", error);
    document.getElementById('sidebar-placeholder').innerHTML = `
      <aside class="sidebar">
        <ul><li>Menú no disponible</li></ul>
      </aside>
    `;
  }
}