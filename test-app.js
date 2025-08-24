#!/usr/bin/env node

/**
 * Quick Testing Script for Hyundai Spare Parts System
 * Run this to test your application endpoints
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

console.log("🧪 Testing Hyundai Spare Parts System...\n");
console.log(`📍 Testing against: ${BASE_URL}\n`);

// Test functions
async function testEndpoint(endpoint, method = "GET", body = null) {
  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`✅ ${method} ${endpoint} - Success`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    } else {
      console.log(`❌ ${method} ${endpoint} - Failed`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error || "Unknown error"}`);
    }
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Error`);
    console.log(`   Error: ${error.message}`);
  }
  console.log("");
}

// Test data for payment creation
const testPaymentData = {
  order_id: `TEST-${Date.now()}`,
  customer_name: "Test Customer",
  customer_email: "test@example.com",
  customer_phone: "+966500000000",
  part_name: "Hyundai Engine Filter",
  parts_cost: 250.0,
  freight_cost: 50.0,
};

// Run tests
async function runTests() {
  console.log("🚀 Starting API Tests...\n");

  // 1. Health Check
  await testEndpoint("/api/health");

  // 2. Test Stripe Config
  await testEndpoint("/api/stripe/config");

  // 3. Test Payment Breakdown
  await testEndpoint("/api/payments/breakdown", "POST", {
    parts_cost: 250.0,
    freight_cost: 50.0,
  });

  // 4. Test Stripe Payment Creation
  await testEndpoint("/api/stripe/create", "POST", testPaymentData);

  // 5. Test Legacy Payment Creation
  await testEndpoint("/api/payments/create", "POST", testPaymentData);

  console.log("🎯 Testing Complete!");
  console.log("\n📋 Next Steps:");
  console.log("1. Check if all endpoints returned expected responses");
  console.log("2. Test the frontend at http://localhost:8080");
  console.log("3. Test payment flow with Stripe test cards");
  console.log("4. Verify webhook handling");
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testEndpoint, runTests };
