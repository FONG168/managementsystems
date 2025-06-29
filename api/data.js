// Serverless API for data synchronization
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        switch (req.method) {
            case 'GET':
                return handleGet(req, res);
            case 'POST':
                return handlePost(req, res);
            default:
                res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Handle GET requests - retrieve data
async function handleGet(req, res) {
    try {
        // In a real application, you would retrieve data from a database
        // For this demo, we'll return a success response indicating the endpoint is working
        res.status(200).json({ 
            message: 'Data sync endpoint is ready',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        });
    } catch (error) {
        console.error('GET Error:', error);
        res.status(500).json({ error: 'Failed to retrieve data' });
    }
}

// Handle POST requests - save/sync data
async function handlePost(req, res) {
    try {
        const data = req.body;
        
        // Validate the incoming data structure
        if (!data || typeof data !== 'object') {
            return res.status(400).json({ error: 'Invalid data format' });
        }

        // Basic validation for required fields
        const requiredFields = ['staff', 'logs', 'settings'];
        for (const field of requiredFields) {
            if (!(field in data)) {
                return res.status(400).json({ error: `Missing required field: ${field}` });
            }
        }

        // Validate staff data
        if (!Array.isArray(data.staff)) {
            return res.status(400).json({ error: 'Staff must be an array' });
        }

        // Validate each staff member
        for (const staff of data.staff) {
            if (!staff.id || !staff.name || !staff.email) {
                return res.status(400).json({ error: 'Staff members must have id, name, and email' });
            }
        }

        // Validate logs data
        if (typeof data.logs !== 'object') {
            return res.status(400).json({ error: 'Logs must be an object' });
        }

        // In a real application, you would:
        // 1. Authenticate the user
        // 2. Save data to a database (PostgreSQL, MongoDB, etc.)
        // 3. Implement conflict resolution for concurrent edits
        // 4. Return synchronization metadata

        // For this demo, we'll simulate a successful save
        const syncResult = {
            success: true,
            timestamp: new Date().toISOString(),
            recordsProcessed: {
                staff: data.staff.length,
                logMonths: Object.keys(data.logs).length,
                settings: Object.keys(data.settings).length
            },
            syncId: generateSyncId(),
            message: 'Data synchronized successfully'
        };

        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 100));

        res.status(200).json(syncResult);

    } catch (error) {
        console.error('POST Error:', error);
        res.status(500).json({ error: 'Failed to sync data' });
    }
}

// Generate a unique sync ID
function generateSyncId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Helper function to sanitize data
function sanitizeData(data) {
    // Remove any potentially harmful data
    // This is a basic example - in production, use proper sanitization libraries
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Remove any functions or undefined values
    function cleanObject(obj) {
        for (const key in obj) {
            if (typeof obj[key] === 'function' || obj[key] === undefined) {
                delete obj[key];
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                cleanObject(obj[key]);
            }
        }
    }
    
    cleanObject(sanitized);
    return sanitized;
}
