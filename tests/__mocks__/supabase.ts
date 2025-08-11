export const mockSupabaseClient = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(),
    refreshSession: jest.fn().mockResolvedValue({ data: { session: { access_token: 'new-token' } }, error: null }),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    then: jest.fn().mockResolvedValue({ data: null, error: null }),
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      download: jest.fn(),
      remove: jest.fn(),
      getPublicUrl: jest.fn(),
    })),
  },
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn(),
  })),
}

export const createClient = jest.fn(() => mockSupabaseClient)

// Helper function to create mock query builders with specific data
export const createMockQueryBuilder = (data: any, error: any = null) => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  like: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  then: jest.fn().mockResolvedValue({ data, error }),
})

// Mock specific table responses
export const mockTableResponses = {
  users: {
    admin: { id: 'admin-1', username: 'admin', role: 'super_admin', email: 'admin@institute.edu' },
    professor: { id: 'prof-1', username: 'professor', role: 'professor', email: 'professor@institute.edu' },
    student: { id: 'student-1', username: 'student', role: 'student', email: 'student@institute.edu' },
  },
  courses: {
    course1: { id: 'course-1', title: 'Test Course', code: 'TEST101', professor_id: 'prof-1' },
    course2: { id: 'course-2', title: 'Advanced Course', code: 'ADV201', professor_id: 'prof-2' },
  },
  materials: {
    material1: { id: 'material-1', name: 'Test Material', course_id: 'course-1' },
    material2: { id: 'material-2', name: 'Advanced Material', course_id: 'course-2' },
  },
}
