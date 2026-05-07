import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true
    },
    descripcion: {
      type: String,
      trim: true,
      default: ''
    },
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente',
      required: true
    },
    estado: {
      type: String,
      enum: ['abierto', 'en progreso', 'cerrado'],
      default: 'abierto'
    },
    prioridad: {
      type: String,
      enum: ['baja', 'media', 'alta'],
      default: 'media'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Ticket', ticketSchema);
