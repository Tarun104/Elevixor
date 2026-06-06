require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');
const quoteRoutes = require('./routes/quote');
const newsletterRoutes = require('./routes/newsletter');
const dashboardRoutes = require('./routes/dashboard');
const placeholderRoutes = require('./routes/placeholders');
const serviceInquiryRoutes = require('./routes/serviceInquiry');

const app = express();

connectDB();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle malformed JSON payloads from express.json()
app.use((err, req, res, next) => {
	if (err && err instanceof SyntaxError && err.status === 400 && 'body' in err) {
		console.error('Malformed JSON received:', err.message);
		return res.status(400).json({ success: false, message: 'Invalid JSON format' });
	}
	next(err);
});

app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/quote', quoteRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/placeholder', placeholderRoutes);
app.use('/submit-service-inquiry', serviceInquiryRoutes);

// Legacy/compat routes so existing frontend forms (unchanged) keep working
app.use('/', authRoutes); // exposes /register and /login
app.use('/contact', contactRoutes);
app.use('/request-quote', quoteRoutes);
app.use('/quote-request', quoteRoutes);
app.use('/subscribe', newsletterRoutes);

// Serve existing frontend without modification
app.use(express.static(path.join(__dirname, '..')));

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
