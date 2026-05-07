import express from 'express';
import conectarDB from './db.js';
import clientesRoutes from './routes/clientes.routes.js';
import ticketsRoutes from './routes/tickets.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'IT-CRM',
    version: '0.1.0'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.use('/api/clientes', clientesRoutes);
app.use('/api/tickets', ticketsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

async function iniciarServidor() {
  await conectarDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor IT-CRM escuchando en puerto ${PORT}`);
  });
}

iniciarServidor().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error.message);
  process.exit(1);
});
