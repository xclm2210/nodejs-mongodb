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
│       ├── clientes.routes.js   # API Clientes
│       └── tickets.routes.js   # API Tickets
└── README.md
```

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
| API Node.js | http://localhost:3000 |
| Health check | http://localhost:3000/health |
| Grafana | http://localhost:3001 |
| MongoDB | localhost:27017 |

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
