import { RequestHandler } from "express";
import multer from "multer";
import { SparePartRequest, RequestStatus } from "@shared/types";

// Configure multer for this route
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Mock BigQuery implementation
// In production, this would use @google-cloud/bigquery
const mockDatabase: SparePartRequest[] = [
  {
    request_id: "REQ-2024-001",
    timestamp: "2024-01-15T10:30:00Z",
    customer_name: "Ahmed Al-Rashid",
    phone_number: "+966551234567",
    email: "ahmed@example.com",
    vehicle_estamra: "ABC123",
    vin_number: "KMHXX00XXXX000001",
    part_name: "Front brake pads for Hyundai Sonata 2022",
    status: "Pending",
    payment_status: "Pending",
    whatsapp_sent: false,
  },
  {
    request_id: "REQ-2024-002",
    timestamp: "2024-01-15T14:20:00Z", 
    customer_name: "Fatima Al-Zahra",
    phone_number: "+966559876543",
    email: "fatima@example.com",
    vehicle_estamra: "XYZ789",
    vin_number: "KMHXX00XXXX000002",
    part_name: "Side mirror assembly - passenger side",
    status: "Available",
    price: 450.00,
    payment_link: "https://pay.example.com/abc123",
    payment_status: "Pending",
    whatsapp_sent: true,
  },
];

// Create new spare part request with multer middleware
export const createRequest: RequestHandler = async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    console.log('Received files:', (req as any).files);
    
    let requestData;
    let requestId;
    
    // Handle FormData request
    if (req.body.data) {
      try {
        requestData = JSON.parse(req.body.data);
        requestId = requestData.request_id;
      } catch (parseError) {
        console.error('Error parsing FormData JSON:', parseError);
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON data in FormData'
        });
      }
    } else {
      // Direct JSON request
      requestData = req.body;
      requestId = requestData.request_id || requestData.requestId;
    }
    
    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: 'Request ID is required'
      });
    }
    
    const newRequest: SparePartRequest = {
      request_id: requestId,
      timestamp: new Date().toISOString(),
      customer_name: requestData.customer_name,
      phone_number: requestData.phone_number,
      email: requestData.email,
      vehicle_estamra: requestData.vehicle_estamra,
      vin_number: requestData.vin_number,
      part_name: requestData.part_name,
      status: "Pending",
      payment_status: "Pending",
      whatsapp_sent: false,
    };

    // In production: Insert into BigQuery
    // const bigquery = new BigQuery();
    // await bigquery.dataset('spare_parts').table('requests').insert([newRequest]);
    
    mockDatabase.push(newRequest);
    
    console.log('Request created successfully:', newRequest);
    
    res.status(201).json({ 
      success: true, 
      requestId,
      message: "Request submitted successfully" 
    });
  } catch (error) {
    console.error("Error creating request:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create request" 
    });
  }
};

// Get all requests with filtering
export const getRequests: RequestHandler = async (req, res) => {
  try {
    const { search, status, limit = "50", offset = "0" } = req.query;
    
    console.log('getRequests called with query:', req.query);
    console.log('Current mockDatabase length:', mockDatabase.length);
    console.log('MockDatabase contents:', mockDatabase);
    
    let filtered = [...mockDatabase];
    
    // Apply search filter
    if (search && typeof search === "string") {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(req => 
        req.customer_name.toLowerCase().includes(searchLower) ||
        req.vin_number.toLowerCase().includes(searchLower) ||
        req.part_name.toLowerCase().includes(searchLower) ||
        req.request_id.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (status && status !== "all") {
      filtered = filtered.filter(req => req.status === status);
    }
    
    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginated = filtered.slice(offsetNum, offsetNum + limitNum);
    
    // Sort by timestamp (newest first)
    paginated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    const response = {
      success: true,
      data: paginated,
      total: filtered.length,
      limit: limitNum,
      offset: offsetNum
    };
    
    console.log('getRequests response:', response);
    
    res.json(response);
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ 
      error: "Failed to fetch requests" 
    });
  }
};

// Update request status and details
export const updateRequest: RequestHandler = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, price, notes, payment_status } = req.body;
    
    const requestIndex = mockDatabase.findIndex(req => req.request_id === requestId);
    
    if (requestIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: "Request not found" 
      });
    }
    
    // Update the request
    const updatedRequest = {
      ...mockDatabase[requestIndex],
      ...(status && { status }),
      ...(price !== undefined && { price }),
      ...(notes !== undefined && { notes }),
      ...(payment_status && { payment_status }),
    };
    
    // Auto-generate payment link when status changes to Available
    if (status === "Available" && price) {
      updatedRequest.payment_link = `https://pay.example.com/${requestId}`;
      updatedRequest.payment_status = "Pending";
      
      // Trigger WhatsApp notification
      // await sendWhatsAppNotification(requestId, "availability");
    }
    
    // Update dispatch timestamp when status changes to Dispatched
    if (status === "Dispatched") {
      updatedRequest.dispatched_on = new Date().toISOString();
    }
    
    mockDatabase[requestIndex] = updatedRequest;
    
    res.json({ 
      success: true, 
      request: updatedRequest,
      message: "Request updated successfully" 
    });
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update request" 
    });
  }
};

// Get single request by ID
export const getRequestById: RequestHandler = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = mockDatabase.find(req => req.request_id === requestId);
    
    if (!request) {
      return res.status(404).json({ 
        error: "Request not found" 
      });
    }
    
    res.json(request);
  } catch (error) {
    console.error("Error fetching request:", error);
    res.status(500).json({ 
      error: "Failed to fetch request" 
    });
  }
};

// Delete request (admin only)
export const deleteRequest: RequestHandler = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const requestIndex = mockDatabase.findIndex(req => req.request_id === requestId);
    
    if (requestIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: "Request not found" 
      });
    }
    
    mockDatabase.splice(requestIndex, 1);
    
    res.json({ 
      success: true, 
      message: "Request deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting request:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to delete request" 
    });
  }
};

// Get dashboard statistics
export const getDashboardStats: RequestHandler = async (req, res) => {
  try {
    const stats = {
      total_requests: mockDatabase.length,
      pending_requests: mockDatabase.filter(req => req.status === "Pending").length,
      pending_payments: mockDatabase.filter(req => req.payment_status === "Pending" && req.status === "Available").length,
      dispatched_orders: mockDatabase.filter(req => req.status === "Dispatched").length,
    };
    
    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ 
      error: "Failed to fetch dashboard stats" 
    });
  }
};
