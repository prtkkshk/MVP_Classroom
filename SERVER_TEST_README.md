# InfraLearn Platform - Server Readiness Test Suite

## Overview

This test suite is designed to verify that your InfraLearn platform is ready for production use by testing real server API connections and logic without any mocks. It covers all major functionality areas including authentication, course management, materials, announcements, live sessions, assignments, calendar events, enrollment, chat, notifications, search, admin functions, and security features.

## 🚀 Quick Start

### 1. Prerequisites

- Node.js installed (version 14 or higher)
- Your InfraLearn platform running and accessible
- Test user accounts created (admin, professor, student)
- Network access to your server

### 2. Setup

1. **Copy configuration template:**
   ```bash
   cp test-config.env .env
   ```

2. **Update the .env file with your real credentials:**
   ```bash
   # Update these values for your environment
   BASE_URL=https://your-domain.com
   ADMIN_USERNAME=your-admin-username
   ADMIN_PASSWORD=your-admin-password
   PROFESSOR_USERNAME=your-professor-username
   PROFESSOR_PASSWORD=your-professor-password
   STUDENT_USERNAME=your-student-username
   STUDENT_PASSWORD=your-student-password
   ```

3. **Make the test file executable:**
   ```bash
   chmod +x server-readiness-test.js
   ```

### 3. Run the Tests

```bash
# Basic test run
node server-readiness-test.js

# With verbose logging
node server-readiness-test.js --verbose

# Test against a different server
node server-readiness-test.js --base-url https://staging.your-domain.com

# Custom timeout
node server-readiness-test.js --timeout 15000
```

## 📋 What Gets Tested

### 1. **Authentication & Authorization**
- ✅ Multi-role login (admin, professor, student)
- ✅ Invalid credentials handling
- ✅ JWT token validation
- ✅ Role-based access control

### 2. **Course Management**
- ✅ Course creation with auto-code generation
- ✅ Course retrieval and listing
- ✅ Course metadata validation

### 3. **Material Management**
- ✅ Material creation and upload
- ✅ Material retrieval and listing
- ✅ File metadata handling

### 4. **Announcements**
- ✅ Announcement CRUD operations
- ✅ Priority and type handling
- ✅ Course-specific visibility

### 5. **Live Sessions**
- ✅ Session creation and management
- ✅ Session metadata validation
- ✅ Participant limits

### 6. **Assignments**
- ✅ Assignment creation with due dates
- ✅ Points and type handling
- ✅ Status indicators

### 7. **Calendar Events**
- ✅ Event creation and management
- ✅ Date/time handling
- ✅ All-day event support

### 8. **Enrollment System**
- ✅ Student enrollment requests
- ✅ Professor approval workflow
- ✅ Bulk enrollment management

### 9. **Chat System**
- ✅ User search functionality
- ✅ Message sending
- ✅ Real-time communication

### 10. **Notifications**
- ✅ Notification retrieval
- ✅ Mark as read functionality
- ✅ Unread count tracking

### 11. **Search Functionality**
- ✅ Global search across content
- ✅ Result categorization
- ✅ Search query handling

### 12. **Admin Functions**
- ✅ User management
- ✅ Course oversight
- ✅ System administration

### 13. **Security Features**
- ✅ Unauthorized access prevention
- ✅ Token validation
- ✅ Role escalation protection

### 14. **Performance**
- ✅ Response time monitoring
- ✅ Health check validation
- ✅ Timeout handling

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Server URL to test | `http://localhost:3000` |
| `ADMIN_USERNAME` | Admin username | `admin` |
| `ADMIN_PASSWORD` | Admin user password | `admin123` |
| `PROFESSOR_USERNAME` | Professor username | `professor` |
| `PROFESSOR_PASSWORD` | Professor user password | `professor123` |
| `STUDENT_USERNAME` | Student username | `student` |
| `STUDENT_PASSWORD` | Student user password | `student123` |
| `VERBOSE` | Enable verbose logging | `false` |
| `TIMEOUT` | Request timeout in ms | `10000` |

### Command Line Options

| Option | Description | Example |
|--------|-------------|---------|
| `--help`, `-h` | Show help message | `node server-readiness-test.js --help` |
| `--verbose` | Enable verbose logging | `node server-readiness-test.js --verbose` |
| `--base-url <url>` | Set server URL | `node server-readiness-test.js --base-url https://api.yourdomain.com` |
| `--timeout <ms>` | Set request timeout | `node server-readiness-test.js --timeout 15000` |

## 📊 Test Results

The test suite provides comprehensive results including:

- **Pass/Fail Summary**: Overall test results
- **Success Rate**: Percentage of passed tests
- **Detailed Logs**: Verbose information about each test
- **Error Details**: Specific failure reasons for debugging
- **Performance Metrics**: Response time measurements

### Example Output

```
🚀 Starting InfraLearn Platform Server Readiness Tests
📍 Testing server at: https://your-domain.com
⏱️  Timeout per request: 10000ms

ℹ️ [2024-01-15T10:30:00.000Z] Running test: Server Health Check
✅ [2024-01-15T10:30:00.500Z] Test passed: Server Health Check

ℹ️ [2024-01-15T10:30:00.501Z] Running test: Authentication Flow
✅ [2024-01-15T10:30:01.200Z] Test passed: Authentication Flow

...

📊 Test Results Summary
======================
✅ Passed: 15
❌ Failed: 0
📊 Total: 15
📈 Success Rate: 100.0%

🎉 All tests passed! The InfraLearn platform appears to be ready for production use.
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Refused**
   - Verify your server is running
   - Check the `BASE_URL` configuration
   - Ensure network connectivity

2. **Authentication Failures**
   - Verify usernames and passwords in `.env`
   - Check if users exist in your system
   - Ensure proper role assignments

3. **API Endpoint Errors**
   - Verify API routes are implemented
   - Check server logs for errors
   - Ensure database connections

4. **Timeout Issues**
   - Increase timeout value: `--timeout 30000`
   - Check server performance
   - Verify network latency

### Debug Mode

Enable verbose logging to see detailed information:

```bash
VERBOSE=true node server-readiness-test.js
```

## 🔒 Security Considerations

- **Never commit real credentials** to version control
- **Use test accounts** specifically created for testing
- **Rotate test passwords** regularly
- **Limit test account permissions** to minimum required
- **Monitor test account activity** for suspicious behavior

## 📝 Customization

### Adding New Tests

To add new test cases, extend the test suite:

```javascript
async function testNewFeature(tokens) {
  logVerbose('Testing new feature...');
  
  const response = await makeRequest(`${CONFIG.baseUrl}/api/new-feature`, {
    headers: { 'Authorization': `Bearer ${tokens.adminToken}` }
  });
  
  assertStatus(response, 200, 'New feature should work');
  // Add more assertions as needed
}

// Add to main test execution
await runTest('New Feature', () => testNewFeature(tokens));
```

### Modifying Test Data

Update test data in the test functions to match your system's requirements:

```javascript
const courseData = {
  title: 'Your Custom Course Title',
  description: 'Your custom description',
  subject: 'Your Subject',
  level: 'Your Level',
  maxStudents: 100
};
```

## 🎯 Success Criteria

Your InfraLearn platform is considered ready when:

- ✅ **All tests pass** without failures
- ✅ **Response times** are within acceptable limits (< 1s for health checks)
- ✅ **Security features** properly block unauthorized access
- ✅ **Data integrity** is maintained across operations
- ✅ **Error handling** works correctly for edge cases

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review server logs for detailed error information
3. Verify your configuration matches the expected format
4. Ensure all required API endpoints are implemented
5. Check database connectivity and permissions

## 📄 License

This test suite is part of the InfraLearn platform and follows the same licensing terms.
