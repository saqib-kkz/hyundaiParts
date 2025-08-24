import { RequestHandler } from "express";
import { SparePartRequest } from "@shared/types";

// This should be the same mockDatabase from requests.ts
// In a real app, you'd import from a shared data store
let mockDatabase: SparePartRequest[] = [
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

// Sample data identifiers - these are the demo/sample records
const SAMPLE_REQUEST_IDS = ["REQ-2024-001", "REQ-2024-002"];

// Clear sample/demo data only
export const clearSampleData: RequestHandler = async (req, res) => {
  try {
    const initialCount = mockDatabase.length;
    
    // Remove only sample data
    mockDatabase = mockDatabase.filter(req => !SAMPLE_REQUEST_IDS.includes(req.request_id));
    
    const removedCount = initialCount - mockDatabase.length;
    
    // In production, this would delete from BigQuery:
    // await bigQueryService.deleteRequests(SAMPLE_REQUEST_IDS);
    
    res.json({
      success: true,
      message: `${removedCount} sample records deleted successfully`,
      removedCount,
      remainingCount: mockDatabase.length
    });
  } catch (error) {
    console.error("Error clearing sample data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear sample data"
    });
  }
};

// Clear ALL request data
export const clearAllRequests: RequestHandler = async (req, res) => {
  try {
    const totalCount = mockDatabase.length;
    
    // Clear all data
    mockDatabase.length = 0;
    
    // In production, this would truncate the BigQuery table:
    // await bigQueryService.truncateTable();
    
    res.json({
      success: true,
      message: `All ${totalCount} requests deleted successfully`,
      deletedCount: totalCount
    });
  } catch (error) {
    console.error("Error clearing all requests:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear all requests"
    });
  }
};

// Complete database reset
export const resetDatabase: RequestHandler = async (req, res) => {
  try {
    // Clear all data
    mockDatabase.length = 0;
    
    // Reset to initial sample data (optional)
    const shouldKeepSampleData = req.body.keepSampleData !== false;
    
    if (shouldKeepSampleData) {
      mockDatabase.push(
        {
          request_id: "REQ-2024-001",
          timestamp: new Date().toISOString(),
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
          timestamp: new Date().toISOString(),
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
        }
      );
    }
    
    // In production, this would:
    // 1. Drop and recreate BigQuery table
    // 2. Reset user settings
    // 3. Clear cache
    // 4. Reset integrations
    
    res.json({
      success: true,
      message: "Database reset successfully",
      currentRecords: mockDatabase.length,
      sampleDataRestored: shouldKeepSampleData
    });
  } catch (error) {
    console.error("Error resetting database:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset database"
    });
  }
};

// Export all data as CSV
export const exportAllData: RequestHandler = async (req, res) => {
  try {
    // In production, this would query BigQuery for all data
    const allData = [...mockDatabase];
    
    // Generate CSV content
    const csvHeaders = [
      'Request ID',
      'Timestamp',
      'Customer Name',
      'Phone',
      'Email',
      'Vehicle Estamra',
      'VIN',
      'Part Name',
      'Part Photo URL',
      'Status',
      'Price',
      'Payment Link',
      'Payment Status',
      'Notes',
      'WhatsApp Sent',
      'Dispatched On'
    ];
    
    const csvRows = allData.map(req => [
      req.request_id,
      req.timestamp,
      req.customer_name,
      req.phone_number,
      req.email,
      req.vehicle_estamra,
      req.vin_number,
      req.part_name,
      req.part_photo_url || '',
      req.status,
      req.price || '',
      req.payment_link || '',
      req.payment_status,
      req.notes || '',
      req.whatsapp_sent,
      req.dispatched_on || ''
    ]);
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => 
        typeof field === 'string' && field.includes(',') 
          ? `"${field.replace(/"/g, '""')}"` 
          : field
      ).join(','))
    ].join('\n');
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="hyundai-all-data-${new Date().toISOString().split('T')[0]}.csv"`);
    
    res.send(csvContent);
  } catch (error) {
    console.error("Error exporting data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to export data"
    });
  }
};

// Get data statistics
export const getDataStats: RequestHandler = async (req, res) => {
  try {
    const stats = {
      totalRequests: mockDatabase.length,
      sampleRequests: mockDatabase.filter(req => SAMPLE_REQUEST_IDS.includes(req.request_id)).length,
      realRequests: mockDatabase.filter(req => !SAMPLE_REQUEST_IDS.includes(req.request_id)).length,
      statusBreakdown: {
        pending: mockDatabase.filter(req => req.status === "Pending").length,
        available: mockDatabase.filter(req => req.status === "Available").length,
        paid: mockDatabase.filter(req => req.status === "Paid").length,
        dispatched: mockDatabase.filter(req => req.status === "Dispatched").length,
      },
      databaseSize: "2.4 MB", // This would be calculated in production
      lastUpdate: new Date().toISOString()
    };
    
    res.json(stats);
  } catch (error) {
    console.error("Error getting data stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get data statistics"
    });
  }
};

// Bulk operations
export const bulkDeleteRequests: RequestHandler = async (req, res) => {
  try {
    const { requestIds } = req.body;
    
    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid request IDs provided"
      });
    }
    
    const initialCount = mockDatabase.length;
    mockDatabase = mockDatabase.filter(req => !requestIds.includes(req.request_id));
    const deletedCount = initialCount - mockDatabase.length;
    
    // In production: await bigQueryService.deleteRequests(requestIds);
    
    res.json({
      success: true,
      message: `${deletedCount} requests deleted successfully`,
      deletedCount,
      remainingCount: mockDatabase.length
    });
  } catch (error) {
    console.error("Error in bulk delete:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete requests"
    });
  }
};

// Data validation and cleanup
export const validateAndCleanData: RequestHandler = async (req, res) => {
  try {
    let issuesFound = 0;
    let issuesFixed = 0;
    const issues: string[] = [];
    
    // Check for data integrity issues
    mockDatabase.forEach((request, index) => {
      // Check for missing required fields
      if (!request.request_id) {
        issues.push(`Record ${index}: Missing request ID`);
        issuesFound++;
      }
      
      // Check for invalid email formats
      if (request.email && !request.email.includes('@')) {
        issues.push(`${request.request_id}: Invalid email format`);
        issuesFound++;
      }
      
      // Check for invalid phone numbers
      if (!request.phone_number.match(/^\+966[0-9]{9}$/)) {
        issues.push(`${request.request_id}: Invalid phone number format`);
        issuesFound++;
      }
      
      // Add more validation rules as needed
    });
    
    res.json({
      success: true,
      issuesFound,
      issuesFixed,
      issues: issues.slice(0, 10), // Limit to first 10 issues
      message: `Data validation completed. Found ${issuesFound} issues.`
    });
  } catch (error) {
    console.error("Error validating data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to validate data"
    });
  }
};
