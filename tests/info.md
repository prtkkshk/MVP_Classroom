# InfraLearn Platform – Comprehensive Testing Plan

## 🎯 Objective
Define and execute a **complete** testing suite (manual + automated) to verify that the platform behaves exactly as per the specification.

---

## 1. **Authentication & Authorization Tests**
- [ ] Test login for all roles (super_admin, professor, student)
- [ ] Test invalid credentials handling
- [ ] Test institutional email validation for students
- [ ] Test JWT expiration and refresh flow
- [ ] Test unauthorized access to restricted routes
- [ ] Test RLS enforcement in DB

## 2. **Course Management**
- [ ] Create a new course (validate auto-code generation)
- [ ] Edit course details and verify changes
- [ ] Delete a course and ensure related data is handled
- [ ] Search/filter courses
- [ ] Access course details as authorized and unauthorized users

## 3. **Material Management**
- [ ] Upload valid and invalid files
- [ ] Verify file categorization and metadata display
- [ ] Test material search & filter
- [ ] Download materials (ensure access control)

## 4. **Announcements**
- [ ] Create, edit, delete announcements
- [ ] Test all priority levels
- [ ] Verify announcement visibility only to enrolled students
- [ ] Check notification delivery on new announcements

## 5. **Live Session**
- [ ] Create and start a live session
- [ ] Join session as multiple students
- [ ] Submit doubts (anonymous + named)
- [ ] Upvote doubts and verify ordering
- [ ] Pause/end session and check participant counts
- [ ] Verify doubt feed updates in real time

## 6. **Assignments**
- [ ] Create assignments with/without points
- [ ] Test due date handling and status indicators
- [ ] Verify student assignment visibility
- [ ] Check CRUD operations for assignments

## 7. **Calendar**
- [ ] Create events with all types
- [ ] Edit and delete events
- [ ] Test all-day events
- [ ] Verify reminder notifications

## 8. **Enrollment**
- [ ] Student requests enrollment via course code
- [ ] Professor approves/rejects request
- [ ] Bulk approve/reject multiple requests
- [ ] Verify student’s course list updates correctly

## 9. **Analytics**
- [ ] Verify counts for students, courses, doubts, etc.
- [ ] Test data accuracy for charts
- [ ] Check analytics for large datasets

## 10. **Search**
- [ ] Search by keyword across all categories
- [ ] Filter search by category
- [ ] Test keyboard navigation
- [ ] Verify search history persistence

## 11. **Notifications**
- [ ] Trigger each notification type
- [ ] Check real-time delivery
- [ ] Test mark-as-read (single + bulk)
- [ ] Verify unread badge count

## 12. **Settings**
- [ ] Update profile info
- [ ] Change password (with validation)
- [ ] Update learning preferences
- [ ] Update notification preferences

## 13. **UI/UX**
- [ ] Test responsiveness across devices
- [ ] Verify animations work smoothly
- [ ] Check accessibility compliance

## 14. **Security Tests**
- [ ] Attempt role escalation via API
- [ ] Test direct file URL access without permissions
- [ ] SQL injection attempts on forms
- [ ] XSS injection in text fields
- [ ] Session hijacking simulation

## 15. **Real-time**
- [ ] Test live updates for doubts, notifications, participant counts
- [ ] Simulate network delays and verify sync
- [ ] Test reconnection after network loss

## 16. **Performance**
- [ ] Load test for live sessions with many users
- [ ] Measure API response times
- [ ] Test caching effectiveness
- [ ] Verify lazy loading triggers correctly

---

**Deliverable:** Test execution log + pass/fail report + list of defects with severity levels.
