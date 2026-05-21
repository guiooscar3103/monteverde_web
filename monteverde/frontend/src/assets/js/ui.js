// Mostrar/ocultar sidebar en móvil
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.querySelector('.sidebar');
const overlay = document.createElement('div');
overlay.classList.add('sidebar-overlay');
document.body.appendChild(overlay);

menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
});

overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
});

// Mostrar botón solo en móviles
if (window.innerWidth <= 991.98) {
  menuToggle.style.display = 'block';
}
window.addEventListener('resize', () => {
  if (window.innerWidth <= 991.98) {
    menuToggle.style.display = 'block';
  } else {
    menuToggle.style.display = 'none';
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  }
});