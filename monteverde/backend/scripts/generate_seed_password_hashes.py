#!/usr/bin/env python
"""
Script seguro para generar hashes de contraseñas semilla (seed) compatibles con la base de datos y el backend.
"""
import sys
import getpass

# Intentar importar werkzeug.security
try:
    from werkzeug.security import generate_password_hash
except ImportError:
    print("❌ Error: 'werkzeug' no está instalado en el entorno de Python actual.")
    print("Por favor, asegúrate de activar el entorno virtual o instalar los requerimientos con:")
    print("  pip install -r requirements.txt")
    sys.exit(1)

def main():
    print("=" * 60)
    print("   GENERADOR SEGURO DE HASHES DE CONTRASEÑA DE DESARROLLO")
    print("=" * 60)
    print("⚠️  ADVERTENCIA IMPORTANTE:")
    print("   Este script está destinado UNICAMENTE para generar hashes")
    print("   de contraseñas de prueba/desarrollo (seed).")
    print("   NO ejecutes este script utilizando contraseñas reales de producción.")
    print("   No guardes contraseñas reales en archivos de texto ni en el historial del shell.")
    print("-" * 60)

    try:
        # Prompt seguro para la contraseña
        password = getpass.getpass("Ingrese la contraseña a hashear: ")
        if not password:
            print("❌ Error: La contraseña no puede estar vacía.")
            sys.exit(1)

        # Generar hash utilizando la configuración por defecto (scrypt en Werkzeug moderno)
        hashed_password = generate_password_hash(password)
        
        print("\n✅ Hash generado exitosamente:")
        print(f"{hashed_password}")
        print("\nCopia y pega este valor en el archivo 'monteverde_db.sql' o la base de datos.")
    except (KeyboardInterrupt, SystemExit):
        print("\n⚠️ Operación cancelada por el usuario.")
    except Exception as e:
        print(f"\n❌ Ocurrió un error inesperado: {e}")

if __name__ == "__main__":
    main()
