# 🏢 CEDIVA - Sistema de Control Logístico (Frontend)

Es el frontend operativo de **CEDIVA**, un sistema web de control logístico desarrollado para gestionar inventario, facturas de muelle, auditoría RF, despachos, clientes y usuarios.

## 🛠️ Tecnologías Principales
- **React 19** + **TypeScript**
- **Vite** (Bundler)
- **Axios** (Cliente HTTP)
- **React Hot Toast** (Notificaciones)
- **Lucide React** (Iconografía)
- **html5-qrcode** (Lectura de cámara)
- **react-select** (Búsquedas con filtro)

---

## 🏗️ Arquitectura General

### Punto de Entrada
- `src/main.tsx` monta la aplicación React.
- `src/App.tsx` actúa como:
  - Controlador principal.
  - Gestor de autenticación (JWT en `localStorage`).
  - Gestor de navegación (mediante el estado `vistaActual`, sin React Router aún).
  - Estado global de productos, clientes, facturas e historial.
  - Coordinador de las llamadas a la API.

Las vistas disponibles están definidas en `src/types/cediva.ts`: `inventario`, `clientes`, `despachos`, `historial`, `muelle`, `trazabilidad`, `usuarios`.

---

## 🔐 Roles y Permisos (RBAC)

La navegación y acciones están controladas por `src/components/Sidebar.tsx`. Los roles son: **Administrador**, **Supervisor** y **AuditorBodega**.

| Función | Administrador | Supervisor | AuditorBodega |
| :--- | :---: | :---: | :---: |
| Inventario | Sí | Sí | Sí |
| Verificación de muelle | Sí | Sí | Sí |
| Trazabilidad | Sí | Sí | Sí |
| Crear factura | Sí | Sí | No |
| Reiniciar conteo | Sí | Sí | No |
| Crear producto | Sí | No | No |
| Clientes | Sí | Sí | No |
| Despachos | Sí | Sí | No |
| Historial | Sí | Sí | No |
| Gestión de usuarios | Sí | No | No |

*(Nota: La autorización de estas operaciones también debería estar protegida por el backend; las restricciones del frontend son principalmente de experiencia de usuario).*

---

## ⚙️ Funciones Principales

### 1. Inventario
- Búsqueda por nombre o código.
- Consulta de stock y valor total del inventario.
- Registro de movimientos.
- Creación de productos (solo Administrador).
- **Pistoleo RF**: Integración con cámara para detectar movimientos.

### 2. Verificación de Muelle (Picking & Packing)
El flujo principal de operación logística:
1. Administrador/Supervisor crea una factura.
2. El auditor selecciona la factura y pistolea los códigos de barras (manual o cámara).
3. El sistema compara los códigos contra las líneas de la factura y detecta: *Producto trocado, Cantidad sobrante, Stock insuficiente, Faltantes*.
4. Al coincidir todo, se confirma el packing.
5. La API marca la factura como `auditada_lista_despacho` y descuenta el inventario.

### 3. Trazabilidad y Despachos
- Visualización de facturas auditadas.
- Filtros por estado (pendientes/despachadas).
- Búsqueda por factura, cliente, placa o conductor.
- Registro de datos de transporte (transportadora, placa, conductor).
- Transición de estado a `Despachada`, guardando el historial de quién auditó y quién despachó, con fecha y hora.

### 4. Sincronización entre Dispositivos
`App` consulta las órdenes de muelle cada 5 segundos (Polling). 
- La función `fusionarOrdenesMuelle` conserva las cantidades locales superiores de las facturas pendientes para evitar pérdida de datos si un dispositivo se sincroniza mientras otro está escaneando.

### 5. Usuarios
- CRUD de usuarios y asignación de roles (solo Administrador).
- Validación de contraseñas de al menos 6 caracteres.

---

## 📝 Observaciones Técnicas y Deuda Técnica (Roadmap)

*   **Refactorización de API:** Actualmente, la mayoría de los servicios usan el cliente `api` de `src/services/api.ts` (que inyecta el JWT automáticamente), pero clientes y despachos usan Axios directo. *TODO: Migrar todas las llamadas al cliente compartido.*
*   **Enrutamiento:** Falta implementar React Router para tener URLs reales y proteger rutas de forma persistente.
*   **Seguridad:** Para producción, es recomendable implementar Refresh Tokens y manejar mejor la expiración de la sesión.
*   **Backend:** El sistema depende de la API .NET corriendo en `https://localhost:5001`.

---
*Desarrollado como proyecto de arquitectura Full-Stack aplicando Clean Architecture, DDD y CQRS en el backend.*
