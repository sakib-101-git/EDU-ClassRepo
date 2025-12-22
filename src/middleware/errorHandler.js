/**
 * Error Handler Middleware
 * Handles and formats errors for API responses
 */

const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.message);
    
    // Handle database constraint errors
    if (err.code === '23505') {
        return res.status(400).json({ error: 'Duplicate entry - resource already exists' });
    }
    
    if (err.code === '23503') {
        return res.status(400).json({ error: 'Invalid reference - related record not found' });
    }
    
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
    }
    
    // Handle file errors
    if (err.message === 'Invalid file type') {
        return res.status(400).json({ error: 'Invalid file type' });
    }
    
    // Default error response
    res.status(err.status || 500).json({ 
        error: err.message || 'Internal server error' 
    });
};

module.exports = errorHandler;

