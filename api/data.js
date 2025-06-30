// Serverless API for data synchronization
// Simple in-memory storage for cross-browser sync (demo purposes)
let sharedData = {
    staff: [],
    logs: {},
    lastUpdated: new Date().toISOString()
};

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
            case 'PUT':
                return handlePut(req, res);
            default:
                res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Handle GET requests - retrieve shared data
async function handleGet(req, res) {
    try {
        const { type } = req.query;
        
        if (type === 'staff') {
            res.status(200).json({ 
                success: true,
                data: sharedData.staff,
                lastUpdated: sharedData.lastUpdated
            });
        } else if (type === 'logs') {
            res.status(200).json({ 
                success: true,
                data: sharedData.logs,
                lastUpdated: sharedData.lastUpdated
            });
        } else if (type === 'hash') {
            // Return a more reliable hash of the data for change detection
            const staffLength = sharedData.staff ? sharedData.staff.length : 0;
            const logsKeys = sharedData.logs ? Object.keys(sharedData.logs).length : 0;
            const dataString = JSON.stringify({
                staffCount: staffLength,
                logsCount: logsKeys,
                lastUpdated: sharedData.lastUpdated
            });
            
            // Create a simple but reliable hash
            let hash = 0;
            for (let i = 0; i < dataString.length; i++) {
                const char = dataString.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            
            const finalHash = `${Math.abs(hash)}_${staffLength}_${logsKeys}_${sharedData.lastUpdated}`;
            
            res.status(200).json({ 
                success: true,
                hash: finalHash,
                lastUpdated: sharedData.lastUpdated,
                metadata: {
                    staffCount: staffLength,
                    logsCount: logsKeys
                }
            });
        } else {
            // Return all data
            res.status(200).json({ 
                success: true,
                data: sharedData,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('GET Error:', error);
        res.status(500).json({ error: 'Failed to retrieve data' });
    }
}

// Handle POST requests - save/sync data
async function handlePost(req, res) {
    try {
        const { type, data } = req.body;
        
        if (!type || data === undefined) {
            return res.status(400).json({ 
                success: false,
                error: 'Missing type or data in request body' 
            });
        }
        
        if (type === 'staff') {
            if (!Array.isArray(data)) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Staff data must be an array' 
                });
            }
            
            sharedData.staff = data;
            sharedData.lastUpdated = new Date().toISOString();
            res.status(200).json({ 
                success: true,
                message: 'Staff data synchronized successfully',
                count: data.length,
                lastUpdated: sharedData.lastUpdated
            });
        } else if (type === 'logs') {
            if (typeof data !== 'object' || data === null) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Logs data must be an object' 
                });
            }
            
            sharedData.logs = data;
            sharedData.lastUpdated = new Date().toISOString();
            res.status(200).json({ 
                success: true,
                message: 'Logs data synchronized successfully',
                logCount: Object.keys(data).length,
                lastUpdated: sharedData.lastUpdated
            });
        } else {
            res.status(400).json({ 
                success: false,
                error: `Invalid data type: ${type}. Supported types: staff, logs` 
            });
        }
    } catch (error) {
        console.error('POST Error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error while saving data' 
        });
    }
}

// Handle PUT requests - update entire dataset
async function handlePut(req, res) {
    try {
        const { staff, logs } = req.body;
        
        if (staff !== undefined) {
            sharedData.staff = staff;
        }
        if (logs !== undefined) {
            sharedData.logs = logs;
        }
        
        sharedData.lastUpdated = new Date().toISOString();
        
        res.status(200).json({ 
            success: true,
            message: 'All data synchronized',
            staff: sharedData.staff.length,
            logs: Object.keys(sharedData.logs).length,
            lastUpdated: sharedData.lastUpdated
        });
    } catch (error) {
        console.error('PUT Error:', error);
        res.status(500).json({ error: 'Failed to update data' });
    }
}
