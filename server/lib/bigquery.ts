// BigQuery is optional dependency - only available in production
let BigQuery: any;
try {
  BigQuery = require('@google-cloud/bigquery').BigQuery;
} catch (error) {
  // BigQuery not available in development - will use mock data
  console.warn('BigQuery not available - using mock data for development');
}
import { SparePartRequest } from '@shared/types';

interface BigQueryConfig {
  projectId: string;
  datasetId: string;
  tableId: string;
  keyFilename?: string;
  credentials?: object;
}

export class BigQueryService {
  private bigquery: any;
  private datasetId: string;
  private tableId: string;

  constructor(config: BigQueryConfig) {
    if (BigQuery) {
      this.bigquery = new BigQuery({
        projectId: config.projectId,
        keyFilename: config.keyFilename,
        credentials: config.credentials,
      });
    } else {
      // Mock BigQuery for development
      this.bigquery = null;
      console.warn('BigQuery not initialized - using mock data');
    }
    this.datasetId = config.datasetId;
    this.tableId = config.tableId;
  }

  async initialize(): Promise<boolean> {
    if (!this.bigquery) {
      console.warn('BigQuery not available - skipping initialization');
      return false;
    }

    try {
      // Check if dataset exists, create if not
      const [datasets] = await this.bigquery.getDatasets();
      const datasetExists = datasets.some(dataset => dataset.id === this.datasetId);
      
      if (!datasetExists) {
        await this.bigquery.createDataset(this.datasetId);
        console.log(`Dataset ${this.datasetId} created.`);
      }

      const dataset = this.bigquery.dataset(this.datasetId);
      
      // Check if table exists, create if not
      const [tables] = await dataset.getTables();
      const tableExists = tables.some(table => table.id === this.tableId);
      
      if (!tableExists) {
        await this.createSparePartsTable();
        console.log(`Table ${this.tableId} created.`);
      }

      return true;
    } catch (error) {
      console.error('Error initializing BigQuery:', error);
      return false;
    }
  }

  private async createSparePartsTable(): Promise<void> {
    const schema = [
      { name: 'request_id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
      { name: 'customer_name', type: 'STRING', mode: 'REQUIRED' },
      { name: 'phone_number', type: 'STRING', mode: 'REQUIRED' },
      { name: 'email', type: 'STRING', mode: 'REQUIRED' },
      { name: 'vehicle_estamra', type: 'STRING', mode: 'REQUIRED' },
      { name: 'vin_number', type: 'STRING', mode: 'REQUIRED' },
      { name: 'part_name', type: 'STRING', mode: 'REQUIRED' },
      { name: 'part_photo_url', type: 'STRING', mode: 'NULLABLE' },
      { name: 'status', type: 'STRING', mode: 'REQUIRED' },
      { name: 'price', type: 'FLOAT', mode: 'NULLABLE' },
      { name: 'payment_link', type: 'STRING', mode: 'NULLABLE' },
      { name: 'payment_status', type: 'STRING', mode: 'REQUIRED' },
      { name: 'notes', type: 'STRING', mode: 'NULLABLE' },
      { name: 'whatsapp_sent', type: 'BOOLEAN', mode: 'REQUIRED' },
      { name: 'dispatched_on', type: 'TIMESTAMP', mode: 'NULLABLE' },
    ];

    const options = {
      schema: schema,
      location: 'US', // or your preferred location
    };

    const [table] = await this.bigquery
      .dataset(this.datasetId)
      .createTable(this.tableId, options);

    console.log(`Table ${table.id} created.`);
  }

  async insertRequest(request: SparePartRequest): Promise<boolean> {
    try {
      const rows = [{
        request_id: request.request_id,
        timestamp: new Date(request.timestamp),
        customer_name: request.customer_name,
        phone_number: request.phone_number,
        email: request.email,
        vehicle_estamra: request.vehicle_estamra,
        vin_number: request.vin_number,
        part_name: request.part_name,
        part_photo_url: request.part_photo_url || null,
        status: request.status,
        price: request.price || null,
        payment_link: request.payment_link || null,
        payment_status: request.payment_status,
        notes: request.notes || null,
        whatsapp_sent: request.whatsapp_sent,
        dispatched_on: request.dispatched_on ? new Date(request.dispatched_on) : null,
      }];

      await this.bigquery
        .dataset(this.datasetId)
        .table(this.tableId)
        .insert(rows);

      console.log(`Inserted request ${request.request_id} into BigQuery`);
      return true;
    } catch (error) {
      console.error('Error inserting request:', error);
      return false;
    }
  }

  async getRequests(filters?: {
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ requests: SparePartRequest[]; total: number }> {
    try {
      let query = `
        SELECT *
        FROM \`${this.bigquery.projectId}.${this.datasetId}.${this.tableId}\`
      `;

      const params: any = {};
      const conditions: string[] = [];

      if (filters?.search) {
        conditions.push(`
          (LOWER(customer_name) LIKE LOWER(@search) OR
           LOWER(vin_number) LIKE LOWER(@search) OR
           LOWER(part_name) LIKE LOWER(@search) OR
           LOWER(request_id) LIKE LOWER(@search))
        `);
        params.search = `%${filters.search}%`;
      }

      if (filters?.status && filters.status !== 'all') {
        conditions.push('status = @status');
        params.status = filters.status;
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ` ORDER BY timestamp DESC`;

      if (filters?.limit) {
        query += ` LIMIT @limit`;
        params.limit = filters.limit;

        if (filters?.offset) {
          query += ` OFFSET @offset`;
          params.offset = filters.offset;
        }
      }

      const options = {
        query: query,
        params: params,
      };

      const [rows] = await this.bigquery.query(options);
      
      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total
        FROM \`${this.bigquery.projectId}.${this.datasetId}.${this.tableId}\`
      `;
      
      if (conditions.length > 0) {
        countQuery += ` WHERE ${conditions.join(' AND ')}`;
      }

      const [countRows] = await this.bigquery.query({
        query: countQuery,
        params: params,
      });

      const total = countRows[0]?.total || 0;

      const requests: SparePartRequest[] = rows.map(row => ({
        request_id: row.request_id,
        timestamp: row.timestamp?.value || row.timestamp,
        customer_name: row.customer_name,
        phone_number: row.phone_number,
        email: row.email,
        vehicle_estamra: row.vehicle_estamra,
        vin_number: row.vin_number,
        part_name: row.part_name,
        part_photo_url: row.part_photo_url,
        status: row.status,
        price: row.price,
        payment_link: row.payment_link,
        payment_status: row.payment_status,
        notes: row.notes,
        whatsapp_sent: row.whatsapp_sent,
        dispatched_on: row.dispatched_on?.value || row.dispatched_on,
      }));

      return { requests, total };
    } catch (error) {
      console.error('Error fetching requests:', error);
      return { requests: [], total: 0 };
    }
  }

  async updateRequest(
    requestId: string,
    updates: Partial<SparePartRequest>
  ): Promise<boolean> {
    try {
      const updateFields: string[] = [];
      const params: any = { request_id: requestId };

      Object.entries(updates).forEach(([key, value], index) => {
        if (value !== undefined) {
          const paramName = `param${index}`;
          updateFields.push(`${key} = @${paramName}`);
          params[paramName] = value;
        }
      });

      if (updateFields.length === 0) {
        return true; // Nothing to update
      }

      const query = `
        UPDATE \`${this.bigquery.projectId}.${this.datasetId}.${this.tableId}\`
        SET ${updateFields.join(', ')}
        WHERE request_id = @request_id
      `;

      await this.bigquery.query({
        query: query,
        params: params,
      });

      console.log(`Updated request ${requestId} in BigQuery`);
      return true;
    } catch (error) {
      console.error('Error updating request:', error);
      return false;
    }
  }

  async deleteRequest(requestId: string): Promise<boolean> {
    try {
      const query = `
        DELETE FROM \`${this.bigquery.projectId}.${this.datasetId}.${this.tableId}\`
        WHERE request_id = @request_id
      `;

      await this.bigquery.query({
        query: query,
        params: { request_id: requestId },
      });

      console.log(`Deleted request ${requestId} from BigQuery`);
      return true;
    } catch (error) {
      console.error('Error deleting request:', error);
      return false;
    }
  }

  async getStats(): Promise<{
    total_requests: number;
    pending_requests: number;
    pending_payments: number;
    dispatched_orders: number;
  }> {
    try {
      const query = `
        SELECT
          COUNT(*) as total_requests,
          COUNTIF(status = 'Pending') as pending_requests,
          COUNTIF(payment_status = 'Pending' AND status = 'Available') as pending_payments,
          COUNTIF(status = 'Dispatched') as dispatched_orders
        FROM \`${this.bigquery.projectId}.${this.datasetId}.${this.tableId}\`
      `;

      const [rows] = await this.bigquery.query({ query });
      const stats = rows[0] || {};

      return {
        total_requests: Number(stats.total_requests) || 0,
        pending_requests: Number(stats.pending_requests) || 0,
        pending_payments: Number(stats.pending_payments) || 0,
        dispatched_orders: Number(stats.dispatched_orders) || 0,
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        total_requests: 0,
        pending_requests: 0,
        pending_payments: 0,
        dispatched_orders: 0,
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.bigquery.getDatasets();
      console.log('BigQuery connection successful');
      return true;
    } catch (error) {
      console.error('BigQuery connection failed:', error);
      return false;
    }
  }
}

// Singleton instance
let bigQueryInstance: BigQueryService | null = null;

export function initializeBigQuery(config: BigQueryConfig): BigQueryService {
  bigQueryInstance = new BigQueryService(config);
  return bigQueryInstance;
}

export function getBigQueryInstance(): BigQueryService | null {
  return bigQueryInstance;
}
