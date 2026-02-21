require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const questionRoutes = require('./routes/questions');
const tournamentRoutes = require('./routes/tournaments');
const matchRoutes = require('./routes/matches');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB - حل و حلي'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/questions', questionRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/matches', matchRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'حل و حلي server is running 🌙' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌙 حل و حلي server running on port ${PORT}`);
});
