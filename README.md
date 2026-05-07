## Plan de Ejecución del Proyecto
# IT-CRM: Sistema de Gestión de Clientes y Tickets

Sistema CRM minimalista para gestión de clientes y tickets de problemas, construido con Node.js, Express y MongoDB.

---

## Estructura del Proyecto

```
entorno-desarrollo/
├── package.json              # Dependencias Node.js
├── Dockerfile              # Construcción imagen it-crm:v0.1
├── docker-compose.yaml     # Orquestación de servicios
├── src/
│   ├── app.js            # Servidor Express
│   ├── db.js            # Conexión MongoDB
│   ├── models/
│   │   ├── Cliente.js   # Modelo Cliente
│   │   └── Ticket.js   # Modelo Ticket
│   └── routes/
│       ├── clientes.routes.js # Endpoints REST: /api/clientes
│       └── tickets.routes.js   # Endpoints REST: /api/tickets
└── README.md
```

---


### Paso 1 — Elección de tecnologías

**Node.js 22 + Express**
Se escoge Node.js como runtime porque permite construir APIs REST de forma rápida y con bajo consumo de recursos. Express es el framework web más extendido del ecosistema Node.js: minimalista, sin opiniones forzadas y con amplia documentación. Se usa la versión 22 (LTS) para garantizar estabilidad a largo plazo.

**MongoDB + Mongoose**
Se opta por MongoDB como base de datos porque el proyecto gestiona datos semiestructurados (clientes y tickets) cuyo esquema puede evolucionar sin migraciones costosas. Mongoose actúa como ODM (Object Document Mapper): define esquemas con validaciones, tipos y valores por defecto directamente en el código JavaScript, eliminando la necesidad de SQL o migraciones manuales.

**Docker + Docker Compose**
Todo el stack se conteneriza para que el entorno de desarrollo sea idéntico al de producción, independientemente del sistema operativo del desarrollador. Docker Compose orquesta los tres servicios (app, mongodb, grafana) con un solo comando.

**Grafana**
Se incluye Grafana para monitorización visual del sistema. Al estar en la misma red Docker, puede conectarse a MongoDB sin exponer credenciales al exterior.

---

### Paso 2 — Diseño de la arquitectura de carpetas

Se adopta una estructura en capas dentro de `src/`:

| Capa | Archivo(s) | Responsabilidad |
|------|------------|-----------------|
| Entrada | `app.js` | Inicializar Express, registrar rutas, arrancar el servidor |
| Conexión | `db.js` | Gestionar la conexión a MongoDB de forma aislada |
| Modelos | `models/` | Definir el esquema de datos y las validaciones |
| Rutas | `routes/` | Manejar las peticiones HTTP y devolver respuestas JSON |

Esta separación garantiza que cada archivo tenga **una única responsabilidad**: si cambia la base de datos, solo se toca `db.js` y los modelos; si cambia un endpoint, solo se toca el archivo de rutas correspondiente.

---

### Paso 3 — Definición del modelo de datos

**Cliente** tiene los campos mínimos para un CRM: `nombre`, `email` (único), `telefono` y un flag `activo` para implementar **borrado lógico** (el registro nunca se elimina físicamente, solo se marca como inactivo). Mongoose añade `createdAt` y `updatedAt` automáticamente con `timestamps: true`.

**Ticket** referencia al Cliente mediante un `ObjectId` (relación entre documentos MongoDB). Tiene `estado` con tres valores posibles (`abierto`, `en progreso`, `cerrado`) y `prioridad` (`baja`, `media`, `alta`), ambos con enum de Mongoose para garantizar la integridad de los datos.

---

### Paso 4 — Diseño de la API REST

Se siguen las convenciones REST estándar:

- `GET` para leer, `POST` para crear, `PUT` para actualizar, `DELETE` para baja lógica.
- Todas las rutas devuelven JSON.
- Los errores devuelven el código HTTP apropiado (400 para datos inválidos, 404 para recurso no encontrado, 500 para errores de servidor).
- El DELETE no elimina el registro: pone `activo: false`. Esto preserva el historial de tickets asociados al cliente.

---

### Paso 5 — Contenerización con Docker

**Dockerfile**
Se usa `node:22-alpine` como imagen base (alpine = mínimo tamaño, sin herramientas innecesarias). Se copian primero solo `package*.json` y se ejecuta `npm ci --omit=dev` antes de copiar el código fuente. Esto aprovecha la caché de capas de Docker: si el código cambia pero las dependencias no, Docker no reinstala los paquetes.

**docker-compose.yaml**
Se definen tres servicios en una red privada `DoD-CRM-NETWORK`. La app declara `depends_on: mongodb` para arrancar después de que el contenedor de MongoDB esté en pie. La variable de entorno `MONGO_URI` se inyecta en la app en tiempo de ejecución, sin hardcodear credenciales en el código.

---

### Paso 6 — Conexión interna entre contenedores (MongoDB ↔ App)

> Este es un punto crítico del proyecto: **la app NO se conecta a MongoDB a través del host (`localhost`), sino a través de la red interna de Docker.**

#### Cómo funciona la red interna de Docker

Cuando Docker Compose levanta los servicios, crea automáticamente la red `DoD-CRM-NETWORK` de tipo `bridge`. Dentro de esa red, **cada servicio es accesible por su nombre de servicio** como si fuera un nombre DNS.

El nombre del servicio MongoDB en `docker-compose.yaml` es `mongodb`. Por tanto, desde dentro del contenedor `app`, la dirección del servidor de base de datos es simplemente `mongodb`, no `localhost` ni ninguna IP.

#### La URI de conexión
MONGO_URI=mongodb://root:DoD_CRM_DATABASE_25@mongodb:27017/crm?authSource=admin
↑
nombre del servicio Docker
(resuelto por DNS interno de la red bridge)


El fragmento `@mongodb:27017` indica:
- `mongodb` → nombre del contenedor en la red `DoD-CRM-NETWORK`, resuelto automáticamente por Docker
- `27017` → puerto interno de MongoDB (no el puerto del host)
- `?authSource=admin` → las credenciales `root` se validan contra la base de datos `admin`, donde MongoDB almacena los usuarios de sistema

#### Diagrama del flujo interno

HOST (tu máquina)
┌──────────────────────────────────────────────────────┐
│ puerto 3000 ──→ contenedor app (DoD) │
│ puerto 3001 ──→ contenedor grafana │
│ puerto 27017 ──→ contenedor mongodb │
│ (expuesto solo para MongoDB Compass) │
│ │
│ Red interna DoD-CRM-NETWORK (bridge) │
│ ┌───────────┐ @mongodb:27017 ┌────────────────┐ │
│ │ app │ ───────────────→ │ mongodb │ │
│ │ :3000 │ (DNS interno) │ :27017 │ │
│ └───────────┘ └────────────────┘ │
│ ↕ misma red bridge ↕ │
│ ┌───────────┐ │
│ │ grafana │ │
│ │ :3000 │ │
│ └───────────┘ │


#### Por qué es seguro y correcto

- La app **nunca usa `localhost`** para conectarse a MongoDB. Si lo hiciera, buscaría MongoDB dentro de su propio contenedor y fallaría con `ECONNREFUSED`.
- El puerto `27017` se expone al host **solo para conveniencia** (ej. usar MongoDB Compass desde el ordenador). La comunicación real app↔MongoDB ocurre por la red interna y nunca sale del host.
- Las credenciales solo viajan dentro de la red Docker, nunca por una red externa.
- `depends_on: mongodb` garantiza que el contenedor de MongoDB arranca antes que la app, evitando errores de conexión en el inicio.

---

## Requisitos del Sistema

| Requisito | Versión |
|-----------|---------|
| Node.js | >=20.0.0 |
| Docker | Latest |
| Docker Compose | >=2.0 |

---

## Configuración de Servicios

### Servicios docker-compose.yaml

| Servicio | Contenedor | Puerto | Descripción |
|----------|-------------|--------|-------------|
| app | DoD | 3000 | Node.js CRM |
| mongodb | mongodb | 27017 | MongoDB |
| grafana | grafana | 3001 | Monitorización |

### Red y Volúmenes

- **Red:** `DoD-CRM-NETWORK` (bridge)
- **Volúmenes:** `mongodb_data`, `grafana_data`

---

## Comandos de Uso

### 1. Preparar el entorno

Antes de ejecutar los contenedores, asegúrate de tener Docker Desktop abierto y funcionando.

```bash
docker --version
docker compose version
```

### 2. Instalar dependencias localmente (opcional)

Este paso solo es necesario si quieres ejecutar o revisar la aplicación Node.js fuera de Docker.

```bash
npm install
```

### 3. Montar la aplicación

Este comando construye la imagen `it-crm:v0.1` a partir del `Dockerfile`.

```bash
docker compose build
```

### 4. Ejecutar la aplicación

Levanta la aplicación Node.js, MongoDB y Grafana en segundo plano.

```bash
docker compose up -d
```

### 5. Verificar que todo funciona

```bash
# Ver contenedores activos
docker ps

# Ver logs de todos los servicios
docker compose logs

# Ver logs solo de la aplicación
docker compose logs app

# Probar API Node.js
curl http://localhost:3000/health

# Probar Grafana
curl http://localhost:3001
```

### 6. Acceder a los servicios

| Servicio | URL |
|----------|-----|
| API Node.js | http://localhost:3000 |  Punto de entrada principal
| Health check | http://localhost:3000/health | Verificación de estado
| Grafana | http://localhost:3001 | Panel de monitorización
| MongoDB | localhost:27017 |Solo para herramientas como MongoDB Compass

### 7. Cerrar la aplicación

Detiene y elimina los contenedores, pero mantiene los datos de MongoDB y Grafana en los volúmenes.

```bash
docker compose down
```

### 8. Cerrar y borrar datos persistentes

Usa este comando solo si quieres eliminar también los datos guardados en los volúmenes.

```bash
docker compose down -v
```

### 9. Reconstruir después de cambios

Si modificas el código o el `Dockerfile`, reconstruye y levanta de nuevo los servicios.

```bash
docker compose down
docker compose build
docker compose up -d
```

---

## API Endpoints

### Health Check

```
GET /              → Estado del servicio
GET /health        → Health check
```

### Clientes

```
GET    /api/clientes         → Listar clientes
GET    /api/clientes/:id   → Obtener cliente
POST   /api/clientes       → Crear cliente
PUT    /api/clientes/:id   → Actualizar cliente
DELETE /api/clientes/:id   → Eliminar cliente
```

### Tickets

```
GET    /api/tickets        → Listar tickets
GET    /api/tickets/:id   → Obtener ticket
POST   /api/tickets       → Crear ticket
PUT    /api/tickets/:id   → Actualizar ticket
```

---

## Ejemplos de Uso

### Crear Cliente

```bash
curl --location 'http://localhost:3000/api/clientes' \
--header 'Content-Type: application/json' \
--data-raw '{
    "nombre": "Empresa S.A.",
    "email": "contacto@empresa.com",
    "telefono": "+34 600 000 000"
}'
```

### Crear Ticket

```bash
curl --location 'http://localhost:3000/api/tickets' \
--header 'Content-Type: application/json' \
--data '{
    "titulo": "No puedo acceder al sistema",
    "descripcion": "Error de autenticación",
    "clienteId": "69f74f4a5c20e02d673f07e5",
    "prioridad": "alta"
  }'
```

---

## Grafana

### Acceso

- **URL:** http://localhost:3001
- **Usuario:** admin
- **Contraseña:** 123456

### Visualización de Tags

![Tag 1](./tag-1.png)
![Tag 2](./tag-2.png)
![Tag 3](./tag-3.png)
![Tag 4](./tag-4.png)

### Contenedor "grafito"

Para crear un contenedor adicional de Grafana llamado "grafito":

```bash
docker run -d --name grafito -p 3000:3000 grafana/grafana:latest
```

Esto crea un segundo contenedor de Grafana independiente del definido en docker-compose:
- **Nombre del contenedor:** grafito
- **Puerto del host:** 3000
- **Puerto del contenedor:** 3000
- **Imagen:** grafana/grafana:latest

---

## Tecnologías

| Tecnología | Propósito |
|------------|----------|
| Node.js 22 | Runtime JavaScript |
| Express | Framework web |
| Mongoose | ODM MongoDB |
| MongoDB | Base de datos |
| Grafana | Monitorización |
| Docker | Contenedores |
