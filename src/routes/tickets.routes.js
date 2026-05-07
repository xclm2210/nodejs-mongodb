import express from 'express';
import Cliente from '../models/Cliente.js';
import Ticket from '../models/Ticket.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('cliente', 'nombre email telefono')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate('cliente', 'nombre email telefono');
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { clienteId, ...datosTicket } = req.body;
    const cliente = await Cliente.findById(clienteId);

    if (!cliente || !cliente.activo) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const ticket = await Ticket.create({
      ...datosTicket,
      cliente: clienteId
    });
    const ticketCompleto = await Ticket.findById(ticket._id).populate('cliente', 'nombre email telefono');

    res.status(201).json(ticketCompleto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('cliente', 'nombre email telefono');
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
