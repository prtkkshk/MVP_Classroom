#!/usr/bin/env node

/**
 * InfraLearn Platform - Server Readiness Test Suite
 * 
 * This file tests the real server API connections and logic to verify
 * whether the app is ready for production use.
 * 
 * Run with: node server-readiness-test.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration - Update these values for your environment
const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  professorUsername: process.env.PROFESSOR_USERNAME || 'professor',
  professorPassword: process.env.PROFESSOR_PASSWORD || 'professor123',
  studentUsername: process.env.STUDENT_USERNAME || 'student',
  studentPassword: process.env.STUDENT_PASSWORD || 'student123',
  timeout: 10000,
  verbose: process.env.VERBOSE === 'true' || true
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function logVerbose(message) {
  if (CONFIG.verbose) {
    console.log(`  📝 ${message}`);
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'InfraLearn-Server-Test/1.0',
        ...options.headers
      },
      timeout: CONFIG.timeout
    };

    if (options.body) {
      const bodyString = JSON.stringify(options.body);
      requestOptions.headers['Content-Length'] = Buffer.byteLength(bodyString);
    }

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertStatus(response, expectedStatus, message) {
  assert(response.status === expectedStatus, 
    `${message} - Expected status ${expectedStatus}, got ${response.status}`);
}

function assertData(response, message) {
  assert(response.data !== null, `${message} - No data received`);
}

function assertProperty(obj, property, message) {
  assert(obj && obj.hasOwnProperty(property), 
    `${message} - Property '${property}' not found`);
}

// Test runner
async function runTest(testName, testFunction) {
  testResults.total++;
  log(`Running test: ${testName}`);
  
  try {
    const result = await testFunction();
    testResults.passed++;
    log(`✅ Test passed: ${testName}`, 'success');
    testResults.details.push({ name: testName, status: 'PASSED' });
    return result; // Return the result of the test function
  } catch (error) {
    testResults.failed++;
    log(`❌ Test failed: ${testName}`, 'error');
    log(`   Error: ${error.message}`, 'error');
    testResults.details.push({ 
      name: testName, 
      status: 'FAILED', 
      error: error.message 
    });
    throw error; // Re-throw the error so the calling function knows about it
  }
}

// Test functions
async function testServerHealth() {
  const response = await makeRequest(`${CONFIG.baseUrl}/api/health`);
  assertStatus(response, 200, 'Health check should return 200');
  assertData(response, 'Health check should return data');
  logVerbose(`Health response: ${JSON.stringify(response.data)}`);
}

async function testAuthenticationFlow() {
  logVerbose('Testing authentication flow...');
  
  // Test admin login
  const adminLoginResponse = await makeRequest(`${CONFIG.baseUrl}/api/auth/login`, {
    method: 'POST',
    body: {
      username: CONFIG.adminUsername,
      password: CONFIG.adminPassword
    }
  });
  
  assertStatus(adminLoginResponse, 200, 'Admin login should succeed');
  assertData(adminLoginResponse, 'Admin login should return data');
  
  // Log the actual response structure for debugging
  logVerbose(`Admin login response structure: ${JSON.stringify(adminLoginResponse.data, null, 2)}`);
  
  // Check for different possible token field names
  let adminToken = null;
  if (adminLoginResponse.data.token) {
    adminToken = adminLoginResponse.data.token;
  } else if (adminLoginResponse.data.accessToken) {
    adminToken = adminLoginResponse.data.accessToken;
  } else if (adminLoginResponse.data.jwt) {
    adminToken = adminLoginResponse.data.jwt;
  } else if (adminLoginResponse.data.authToken) {
    adminToken = adminLoginResponse.data.authToken;
  } else {
    // If no token field found, log the available fields
    const availableFields = Object.keys(adminLoginResponse.data).join(', ');
    throw new Error(`No token field found in response. Available fields: ${availableFields}`);
  }
  
  logVerbose('Admin login successful');
  
  // Test professor login
  const professorLoginResponse = await makeRequest(`${CONFIG.baseUrl}/api/auth/login`, {
    method: 'POST',
    body: {
      username: CONFIG.professorUsername,
      password: CONFIG.professorPassword
    }
  });
  
  assertStatus(professorLoginResponse, 200, 'Professor login should succeed');
  assertData(professorLoginResponse, 'Professor login should return data');
  
  // Log the actual response structure for debugging
  logVerbose(`Professor login response structure: ${JSON.stringify(professorLoginResponse.data, null, 2)}`);
  
  // Check for different possible token field names
  let professorToken = null;
  if (professorLoginResponse.data.token) {
    professorToken = professorLoginResponse.data.token;
  } else if (professorLoginResponse.data.accessToken) {
    professorToken = professorLoginResponse.data.accessToken;
  } else if (professorLoginResponse.data.jwt) {
    professorToken = professorLoginResponse.data.jwt;
  } else if (professorLoginResponse.data.authToken) {
    professorToken = professorLoginResponse.data.authToken;
  } else {
    // If no token field found, log the available fields
    const availableFields = Object.keys(professorLoginResponse.data).join(', ');
    throw new Error(`No token field found in response. Available fields: ${availableFields}`);
  }
  
  // Check for user role (handle different possible structures)
  let professorRole = null;
  if (professorLoginResponse.data.user && professorLoginResponse.data.user.role) {
    professorRole = professorLoginResponse.data.user.role;
  } else if (professorLoginResponse.data.role) {
    professorRole = professorLoginResponse.data.role;
  } else {
    logVerbose('Warning: No role field found in professor response');
  }
  
  if (professorRole) {
    assert(professorRole === 'professor', `User should have professor role, got: ${professorRole}`);
  }
  
  logVerbose('Professor login successful');
  
  // Test student login
  const studentLoginResponse = await makeRequest(`${CONFIG.baseUrl}/api/auth/login`, {
    method: 'POST',
    body: {
      username: CONFIG.studentUsername,
      password: CONFIG.studentPassword
    }
  });
  
  assertStatus(studentLoginResponse, 200, 'Student login should succeed');
  assertData(studentLoginResponse, 'Student login should return data');
  
  // Log the actual response structure for debugging
  logVerbose(`Student login response structure: ${JSON.stringify(studentLoginResponse.data, null, 2)}`);
  
  // Check for different possible token field names
  let studentToken = null;
  if (studentLoginResponse.data.token) {
    studentToken = studentLoginResponse.data.token;
  } else if (studentLoginResponse.data.accessToken) {
    studentToken = studentLoginResponse.data.accessToken;
  } else if (studentLoginResponse.data.jwt) {
    studentToken = studentLoginResponse.data.jwt;
  } else if (studentLoginResponse.data.authToken) {
    studentToken = studentLoginResponse.data.authToken;
  } else {
    // If no token field found, log the available fields
    const availableFields = Object.keys(studentLoginResponse.data).join(', ', 2);
    throw new Error(`No token field found in response. Available fields: ${availableFields}`);
  }
  
  // Check for user role (handle different possible structures)
  let studentRole = null;
  if (studentLoginResponse.data.user && studentLoginResponse.data.user.role) {
    studentRole = studentLoginResponse.data.user.role;
  } else if (studentLoginResponse.data.role) {
    studentRole = studentLoginResponse.data.role;
  } else {
    logVerbose('Warning: No role field found in student response');
  }
  
  if (studentRole) {
    assert(studentRole === 'student', `User should have student role, got: ${studentRole}`);
  }
  
  logVerbose('Student login successful');
  
  // Test invalid credentials
  const invalidLoginResponse = await makeRequest(`${CONFIG.baseUrl}/api/auth/login`, {
    method: 'POST',
    body: {
      username: 'invaliduser',
      password: 'wrongpassword'
    }
  });
  
  assertStatus(invalidLoginResponse, 401, 'Invalid login should return 401');
  logVerbose('Invalid login test passed');
  
  return { adminToken, professorToken, studentToken };
}

async function testCourseManagement(tokens) {
  logVerbose('Testing course management...');
  
  // Test course creation as professor
  const courseData = {
    title: 'Test Course for API Testing',
    description: 'This is a test course created during API testing',
    subject: 'Computer Science',
    level: 'Intermediate',
    maxStudents: 50
  };
  
  const createCourseResponse = await makeRequest(`${CONFIG.baseUrl}/api/calendar/courses`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokens.professorToken}` },
    body: courseData
  });
  
  assertStatus(createCourseResponse, 201, 'Course creation should succeed');
  assertData(createCourseResponse, 'Course creation should return data');
  assertProperty(createCourseResponse.data, 'id', 'Course should have ID');
  assertProperty(createCourseResponse.data, 'code', 'Course should have auto-generated code');
  
  const courseId = createCourseResponse.data.id;
  const courseCode = createCourseResponse.data.code;
  logVerbose(`Course created with ID: ${courseId}, Code: ${courseCode}`);
  
  // Test course retrieval
  const getCourseResponse = await makeRequest(`${CONFIG.baseUrl}/api/calendar/courses/${courseId}`);
  assertStatus(getCourseResponse, 200, 'Course retrieval should succeed');
  assertData(getCourseResponse, 'Course retrieval should return data');
  assert(getCourseResponse.data.title === courseData.title, 'Course title should match');
  
  // Test course listing
  const listCoursesResponse = await makeRequest(`${CONFIG.baseUrl}/api/calendar/courses`);
  assertStatus(listCoursesResponse, 200, 'Course listing should succeed');
  assertData(listCoursesResponse, 'Course listing should return data');
  assert(Array.isArray(listCoursesResponse.data), 'Course listing should be an array');
  
  logVerbose(`Found ${listCoursesResponse.data.length} courses`);
  
  return { courseId, courseCode };
}

async function testMaterialManagement(tokens, courseId) {
  logVerbose('Testing material management...');
  
  // Test file upload (simulate with metadata)
  const materialData = {
    courseId: courseId,
    title: 'Test Material',
    description: 'Test material description',
    type: 'document',
    url: 'https://example.com/test-material.pdf',
    size: 1024
  };
  
  const createMaterialResponse = await makeRequest(`${CONFIG.baseUrl}/api/calendar/courses/${courseId}/materials`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokens.professorToken}` },
    body: materialData
  });
  
  assertStatus(createMaterialResponse, 201, 'Material creation should succeed');
  assertData(createMaterialResponse, 'Material creation should return data');
  assertProperty(createMaterialResponse.data, 'id', 'Material should have ID');
  
  const materialId = createMaterialResponse.data.id;
  logVerbose(`Material created with ID: ${materialId}`);
  
  // Test material retrieval
  const getMaterialResponse = await makeRequest(`${CONFIG.baseUrl}/api/calendar/courses/${courseId}/materials/${materialId}`);
  assertStatus(getMaterialResponse, 200, 'Material retrieval should succeed');
  assertData(getMaterialResponse, 'Material retrieval should return data');
  
  // Test material listing
  const listMaterialsResponse = await makeRequest(`${CONFIG.baseUrl}/api/calendar/courses/${courseId}/materials`);
  assertStatus(listMaterialsResponse, 200, 'Material listing should succeed');
  assertData(listMaterialsResponse, 'Material listing should return data');
  assert(Array.isArray(listMaterialsResponse.data), 'Material listing should be an array');
  
  logVerbose(`Found ${listMaterialsResponse.data.length} materials`);
  
  return { materialId };
}

async function testAnnouncements(tokens, courseId) {
  logVerbose('Testing announcements...');
  
  const announcementData = {
    courseId: courseId,
    title: 'Test Announcement',
    content: 'This is a test announcement',
    priority: 'medium',
    type: 'general'
  };
  
  const createAnnouncementResponse = await makeRequest(`${CONFIG.baseUrl}/api/calendar/courses/${courseId}/announcements`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokens.professorToken}` },
    body: announcementData
  });
  
  assertStatus(createAnnouncementResponse, 201, 'Announcement creation should succeed');
  assertData(createAnnouncementResponse, 'Announcement creation should return data');
  assertProperty(createAnnouncementResponse.data, 'id', 'Announcement should have ID');
  
  const announcementId = createAnnouncementResponse.data.id;
  logVerbose(`Announcement created with ID: ${announcementId}`);
  
  // Test announcement retrieval
  const getAnnouncementResponse = await makeRequest(`${CONFIG.baseUrl}/api/calendar/courses/${courseId}/announcements/${announcementId}`);
  assertStatus(getAnnouncementResponse, 200, 'Announcement retrieval should succeed');
  assertData(getAnnouncementResponse, 'Announcement retrieval should return data');
  
  // Test announcement listing
  const listAnnouncementsResponse = await makeRequest(`${CONFIG.baseUrl}/api/calendar/courses/${courseId}/announcements`);
  assertStatus(listAnnouncementsResponse, 200, 'Announcement listing should succeed');
  assertData(listAnnouncementsResponse, 'Announcement listing should return data');
  assert(Array.isArray(listAnnouncementsResponse.data), 'Announcement listing should be an array');
  
  logVerbose(`Found ${listAnnouncementsResponse.data.length} announcements`);
  
  return { announcementId };
}

async function testLiveSessions(tokens, courseId) {
  logVerbose('Testing live sessions...');
  
  const sessionData = {
    courseId: courseId,
    title: 'Test Live Session',
    description: 'Test live session description',
    startTime: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
    duration: 60,
    maxParticipants: 30
  };
  
  const createSessionResponse = await makeRequest(`${CONFIG.baseUrl}/api/calendar/courses/${courseId}/live-sessions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokens.professorToken}` },
    body: sessionData
  });
  
  assertStatus(createSessionResponse, 201, 'Live session creation should succeed');
  assertData(createSessionResponse, 'Live session creation should return data');
  assertProperty(createSessionResponse.data, 'id', 'Live session should have ID');
  
  const sessionId = createSessionResponse.data.id;
  logVerbose(`Live session created with ID: ${sessionId}`);
  
  // Test session retrieval
  const getSessionResponse = await makeRequest(`${CONFIG.baseUrl}/api/calendar/courses/${courseId}/live-sessions/${sessionId}`);
  assertStatus(getSessionResponse, 200, 'Live session retrieval should succeed');
  assertData(getSessionResponse, 'Live session retrieval should return data');
  
  // Test session listing
  const listSessionsResponse = await makeRequest(`${CONFIG.baseUrl}/api/calendar/courses/${courseId}/live-sessions`);
  assertStatus(listSessionsResponse, 200, 'Live session listing should succeed');
  assertData(listSessionsResponse, 'Live session listing should return data');
  assert(Array.isArray(listSessionsResponse.data), 'Live session listing should be an array');
  
  logVerbose(`Found ${listSessionsResponse.data.length} live sessions`);
  
  return { sessionId };
}

async function testAssignments(tokens, courseId) {
  logVerbose('Testing assignments...');
  
  const assignmentData = {
    courseId: courseId,
    title: 'Test Assignment',
    description: 'Test assignment description',
    dueDate: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
    points: 100,
    type: 'homework'
  };
  
  const createAssignmentResponse = await makeRequest(`${CONFIG.baseUrl}/api/calendar/courses/${courseId}/assignments`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokens.professorToken}` },
    body: assignmentData
  });
  
  assertStatus(createAssignmentResponse, 201, 'Assignment creation should succeed');
  assertData(createAssignmentResponse, 'Assignment creation should return data');
  assertProperty(createAssignmentResponse.data, 'id', 'Assignment should have ID');
  
  const assignmentId = createAssignmentResponse.data.id;
  logVerbose(`Assignment created with ID: ${assignmentId}`);
  
  // Test assignment retrieval
  const getAssignmentResponse = await makeRequest(`${CONFIG.baseUrl}/api/calendar/courses/${courseId}/assignments/${assignmentId}`);
  assertStatus(getAssignmentResponse, 200, 'Assignment retrieval should succeed');
  assertData(getAssignmentResponse, 'Assignment retrieval should return data');
  
  // Test assignment listing
  const listAssignmentsResponse = await makeRequest(`${CONFIG.baseUrl}/api/calendar/courses/${courseId}/assignments`);
  assertStatus(listAssignmentsResponse, 200, 'Assignment listing should succeed');
  assertData(listAssignmentsResponse, 'Assignment listing should return data');
  assert(Array.isArray(listAssignmentsResponse.data), 'Assignment listing should be an array');
  
  logVerbose(`Found ${listAssignmentsResponse.data.length} assignments`);
  
  return { assignmentId };
}

async function testCalendarEvents(tokens) {
  logVerbose('Testing calendar events...');
  
  const eventData = {
    title: 'Test Calendar Event',
    description: 'Test calendar event description',
    startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    endTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
    type: 'meeting',
    isAllDay: false
  };
  
  const createEventResponse = await makeRequest(`${CONFIG.baseUrl}/api/calendar/events`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokens.professorToken}` },
    body: eventData
  });
  
  assertStatus(createEventResponse, 201, 'Calendar event creation should succeed');
  assertData(createEventResponse, 'Calendar event creation should return data');
  assertProperty(createEventResponse.data, 'id', 'Calendar event should have ID');
  
  const eventId = createEventResponse.data.id;
  logVerbose(`Calendar event created with ID: ${eventId}`);
  
  // Test event retrieval
  const getEventResponse = await makeRequest(`${CONFIG.baseUrl}/api/calendar/events/${eventId}`);
  assertStatus(getEventResponse, 200, 'Calendar event retrieval should succeed');
  assertData(getEventResponse, 'Calendar event retrieval should return data');
  
  // Test event listing
  const listEventsResponse = await makeRequest(`${CONFIG.baseUrl}/api/calendar/events`);
  assertStatus(listEventsResponse, 200, 'Calendar event listing should succeed');
  assertData(listEventsResponse, 'Calendar event listing should return data');
  assert(Array.isArray(listEventsResponse.data), 'Calendar event listing should be an array');
  
  logVerbose(`Found ${listEventsResponse.data.length} calendar events`);
  
  return { eventId };
}

async function testEnrollmentSystem(tokens, courseCode) {
  logVerbose('Testing enrollment system...');
  
  // Test enrollment request as student
  const enrollmentData = {
    courseCode: courseCode,
    message: 'Please enroll me in this course'
  };
  
  const enrollmentRequestResponse = await makeRequest(`${CONFIG.baseUrl}/api/calendar/courses/enroll`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokens.studentToken}` },
    body: enrollmentData
  });
  
  assertStatus(enrollmentRequestResponse, 200, 'Enrollment request should succeed');
  logVerbose('Enrollment request submitted successfully');
  
  // Test enrollment requests listing as professor
  const listEnrollmentRequestsResponse = await makeRequest(`${CONFIG.baseUrl}/api/calendar/courses/enrollments`, {
    headers: { 'Authorization': `Bearer ${tokens.professorToken}` }
  });
  
  assertStatus(listEnrollmentRequestsResponse, 200, 'Enrollment requests listing should succeed');
  assertData(listEnrollmentRequestsResponse, 'Enrollment requests listing should return data');
  assert(Array.isArray(listEnrollmentRequestsResponse.data), 'Enrollment requests should be an array');
  
  logVerbose(`Found ${listEnrollmentRequestsResponse.data.length} enrollment requests`);
  
  return { enrollmentRequests: listEnrollmentRequestsResponse.data };
}

async function testChatSystem(tokens) {
  logVerbose('Testing chat system...');
  
  // Test user search
  const searchUsersResponse = await makeRequest(`${CONFIG.baseUrl}/api/chat/search-users?q=test`, {
    headers: { 'Authorization': `Bearer ${tokens.studentToken}` }
  });
  
  assertStatus(searchUsersResponse, 200, 'User search should succeed');
  assertData(searchUsersResponse, 'User search should return data');
  assert(Array.isArray(searchUsersResponse.data), 'User search should return an array');
  
  logVerbose(`Found ${searchUsersResponse.data.length} users in search`);
  
  // Test sending message
  if (searchUsersResponse.data.length > 0) {
    const targetUserId = searchUsersResponse.data[0].id;
    const messageData = {
      recipientId: targetUserId,
      content: 'Test message from API testing',
      type: 'text'
    };
    
    const sendMessageResponse = await makeRequest(`${CONFIG.baseUrl}/api/chat/send-message`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokens.studentToken}` },
      body: messageData
    });
    
    assertStatus(sendMessageResponse, 200, 'Message sending should succeed');
    logVerbose('Message sent successfully');
  }
}

async function testNotifications(tokens) {
  logVerbose('Testing notifications...');
  
  const notificationsResponse = await makeRequest(`${CONFIG.baseUrl}/api/notifications`, {
    headers: { 'Authorization': `Bearer ${tokens.studentToken}` }
  });
  
  assertStatus(notificationsResponse, 200, 'Notifications retrieval should succeed');
  assertData(notificationsResponse, 'Notifications retrieval should return data');
  assert(Array.isArray(notificationsResponse.data), 'Notifications should be an array');
  
  logVerbose(`Found ${notificationsResponse.data.length} notifications`);
  
  // Test marking notification as read
  if (notificationsResponse.data.length > 0) {
    const notificationId = notificationsResponse.data[0].id;
    const markReadResponse = await makeRequest(`${CONFIG.baseUrl}/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${tokens.studentToken}` }
    });
    
    assertStatus(markReadResponse, 200, 'Mark as read should succeed');
    logVerbose('Notification marked as read successfully');
  }
}

async function testSearchFunctionality(tokens) {
  logVerbose('Testing search functionality...');
  
  const searchResponse = await makeRequest(`${CONFIG.baseUrl}/api/search?q=test`, {
    headers: { 'Authorization': `Bearer ${tokens.studentToken}` }
  });
  
  assertStatus(searchResponse, 200, 'Search should succeed');
  assertData(searchResponse, 'Search should return data');
  assertProperty(searchResponse.data, 'results', 'Search should return results');
  assert(Array.isArray(searchResponse.data.results), 'Search results should be an array');
  
  logVerbose(`Search returned ${searchResponse.data.results.length} results`);
}

async function testAdminFunctions(tokens) {
  logVerbose('Testing admin functions...');
  
  // Test admin users listing
  const usersResponse = await makeRequest(`${CONFIG.baseUrl}/api/admin/users`, {
    headers: { 'Authorization': `Bearer ${tokens.adminToken}` }
  });
  
  assertStatus(usersResponse, 200, 'Admin users listing should succeed');
  assertData(usersResponse, 'Admin users listing should return data');
  assert(Array.isArray(usersResponse.data), 'Users should be an array');
  
  logVerbose(`Admin found ${usersResponse.data.length} users`);
  
  // Test admin courses listing
  const adminCoursesResponse = await makeRequest(`${CONFIG.baseUrl}/api/admin/courses`, {
    headers: { 'Authorization': `Bearer ${tokens.adminToken}` }
  });
  
  assertStatus(adminCoursesResponse, 200, 'Admin courses listing should succeed');
  assertData(adminCoursesResponse, 'Admin courses listing should return data');
  assert(Array.isArray(adminCoursesResponse.data), 'Admin courses should be an array');
  
  logVerbose(`Admin found ${adminCoursesResponse.data.length} courses`);
}

async function testSecurityFeatures(tokens) {
  logVerbose('Testing security features...');
  
  // Test unauthorized access to admin endpoint with student token
  const unauthorizedAdminResponse = await makeRequest(`${CONFIG.baseUrl}/api/admin/users`, {
    headers: { 'Authorization': `Bearer ${tokens.studentToken}` }
  });
  
  assertStatus(unauthorizedAdminResponse, 403, 'Student should not access admin endpoint');
  logVerbose('Unauthorized access properly blocked');
  
  // Test invalid token
  const invalidTokenResponse = await makeRequest(`${CONFIG.baseUrl}/api/admin/users`, {
    headers: { 'Authorization': 'Bearer invalid-token' }
  });
  
  assertStatus(invalidTokenResponse, 401, 'Invalid token should be rejected');
  logVerbose('Invalid token properly rejected');
  
  // Test missing token
  const missingTokenResponse = await makeRequest(`${CONFIG.baseUrl}/api/admin/users`);
  assertStatus(missingTokenResponse, 401, 'Missing token should be rejected');
  logVerbose('Missing token properly rejected');
}

async function testPerformance() {
  logVerbose('Testing performance...');
  
  const startTime = Date.now();
  const response = await makeRequest(`${CONFIG.baseUrl}/api/health`);
  const endTime = Date.now();
  
  const responseTime = endTime - startTime;
  logVerbose(`Health check response time: ${responseTime}ms`);
  
  // Performance threshold: health check should respond within 1 second
  assert(responseTime < 1000, `Health check should respond within 1000ms, took ${responseTime}ms`);
  
  logVerbose('Performance test passed');
}

// Main test execution
async function runAllTests() {
  log('🚀 Starting InfraLearn Platform Server Readiness Tests');
  log(`📍 Testing server at: ${CONFIG.baseUrl}`);
  log(`⏱️  Timeout per request: ${CONFIG.timeout}ms`);
  log('');
  
  try {
    // Basic connectivity tests
    await runTest('Server Health Check', testServerHealth);
    await runTest('Performance Test', testPerformance);
    
    // Authentication tests
    const tokens = await runTest('Authentication Flow', testAuthenticationFlow);
    
    if (tokens) {
      // Core functionality tests
      const courseInfo = await runTest('Course Management', () => testCourseManagement(tokens));
      
      if (courseInfo) {
        await runTest('Material Management', () => testMaterialManagement(tokens, courseInfo.courseId));
        await runTest('Announcements', () => testAnnouncements(tokens, courseInfo.courseId));
        await runTest('Live Sessions', () => testLiveSessions(tokens, courseInfo.courseId));
        await runTest('Assignments', () => testAssignments(tokens, courseInfo.courseId));
        await runTest('Calendar Events', () => testCalendarEvents(tokens));
        await runTest('Enrollment System', () => testEnrollmentSystem(tokens, courseInfo.courseCode));
      }
      
      await runTest('Chat System', () => testChatSystem(tokens));
      await runTest('Notifications', () => testNotifications(tokens));
      await runTest('Search Functionality', () => testSearchFunctionality(tokens));
      await runTest('Admin Functions', () => testAdminFunctions(tokens));
      await runTest('Security Features', () => testSecurityFeatures(tokens));
    }
    
  } catch (error) {
    log(`❌ Critical error during testing: ${error.message}`, 'error');
    testResults.failed++;
  }
  
  // Print summary
  log('');
  log('📊 Test Results Summary');
  log('======================');
  log(`✅ Passed: ${testResults.passed}`);
  log(`❌ Failed: ${testResults.failed}`);
  log(`📊 Total: ${testResults.total}`);
  log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    log('');
    log('❌ Failed Tests:');
    testResults.details
      .filter(test => test.status === 'FAILED')
      .forEach(test => {
        log(`   - ${test.name}: ${test.error}`);
      });
  }
  
  log('');
  if (testResults.failed === 0) {
    log('🎉 All tests passed! The InfraLearn platform appears to be ready for production use.', 'success');
    process.exit(0);
  } else {
    log('⚠️  Some tests failed. Please review the issues above before deploying to production.', 'warning');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
InfraLearn Platform - Server Readiness Test Suite

Usage: node server-readiness-test.js [options]

Options:
  --help, -h          Show this help message
  --verbose           Enable verbose logging
  --base-url <url>   Set base URL for testing (default: http://localhost:3000)
  --timeout <ms>     Set request timeout in milliseconds (default: 10000)

Environment Variables:
  BASE_URL            Base URL for testing
  ADMIN_USERNAME      Admin username for testing
  ADMIN_PASSWORD      Admin password for testing
  PROFESSOR_USERNAME  Professor username for testing
  PROFESSOR_PASSWORD  Professor password for testing
  STUDENT_USERNAME    Student username for testing
  STUDENT_PASSWORD    Student password for testing
  VERBOSE             Enable verbose logging (true/false)

Examples:
  node server-readiness-test.js
  node server-readiness-test.js --verbose
  node server-readiness-test.js --base-url https://your-domain.com
  VERBOSE=true node server-readiness-test.js
`);
  process.exit(0);
}

// Parse command line arguments
process.argv.forEach((arg, index) => {
  if (arg === '--verbose') {
    CONFIG.verbose = true;
  } else if (arg === '--base-url' && process.argv[index + 1]) {
    CONFIG.baseUrl = process.argv[index + 1];
  } else if (arg === '--timeout' && process.argv[index + 1]) {
    CONFIG.timeout = parseInt(process.argv[index + 1]);
  }
});

// Run tests
runAllTests().catch(error => {
  log(`❌ Fatal error: ${error.message}`, 'error');
  process.exit(1);
});
