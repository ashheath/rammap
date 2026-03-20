import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import vehicleRoutes from './routes/vehicles.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

// Middleware: CORS
const rawOrigins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:5173'
const allowedOrigins = rawOrigins.split(',').map(s => s.trim()).filter(Boolean)
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (e.g., mobile apps, curl)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('CORS blocked'))
  },
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/vehicles', vehicleRoutes)

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  })
})

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`)
  console.log(`📍 CORS allowed origins: ${allowedOrigins.join(', ')}`)
})
