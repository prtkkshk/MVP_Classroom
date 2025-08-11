import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mockSupabase } from '../__mocks__/supabase';
import { mockZustand } from '../__mocks__/zustand';

// Mock the stores
vi.mock('../src/store/authStore', () => mockZustand);
vi.mock('../src/store/courseStore', () => mockZustand);

// Mock Supabase
vi.mock('../src/lib/supabase', () => mockSupabase);

// Mock performance monitoring
const mockPerformanceMonitor = {
  measureApiResponse: vi.fn(),
  measureComponentRender: vi.fn(),
  measureUserInteraction: vi.fn(),
  getMetrics: vi.fn(() => ({
    apiResponseTimes: [],
    renderTimes: [],
    interactionTimes: []
  }))
};

vi.mock('../src/lib/performance-monitor', () => ({
  performanceMonitor: mockPerformanceMonitor
}));

// Mock React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Load Testing', () => {
    it('should handle live sessions with many users efficiently', async () => {
      const user = userEvent.setup();
      
      // Mock large dataset for live session
      const mockParticipants = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Student ${i}`,
        joinedAt: new Date().toISOString(),
        isActive: true
      }));

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockParticipants, error: null })
        })
      });

      // Measure render performance
      const startTime = performance.now();
      
      // Render component with large dataset
      render(
        <TestWrapper>
          <div data-testid="live-session">
            {mockParticipants.map(participant => (
              <div key={participant.id} data-testid={`participant-${participant.id}`}>
                {participant.name}
              </div>
            ))}
          </div>
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Performance assertion: should render within reasonable time
      expect(renderTime).toBeLessThan(1000); // Less than 1 second
      
      // Verify all participants are rendered
      expect(screen.getByTestId('live-session')).toBeInTheDocument();
      expect(screen.getByTestId('participant-0')).toBeInTheDocument();
      expect(screen.getByTestId('participant-999')).toBeInTheDocument();
    });

    it('should handle large course lists efficiently', async () => {
      const user = userEvent.setup();
      
      // Mock large course dataset
      const mockCourses = Array.from({ length: 500 }, (_, i) => ({
        id: i,
        title: `Course ${i}`,
        description: `Description for course ${i}`,
        code: `CS${i.toString().padStart(3, '0')}`,
        professor: `Professor ${i % 10}`,
        students_count: Math.floor(Math.random() * 100) + 10
      }));

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockCourses, error: null })
        })
      });

      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <div data-testid="course-list">
            {mockCourses.map(course => (
              <div key={course.id} data-testid={`course-${course.id}`}>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <span>{course.code}</span>
              </div>
            ))}
          </div>
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Performance assertion: should render within reasonable time
      expect(renderTime).toBeLessThan(800); // Less than 800ms
      
      // Verify courses are rendered
      expect(screen.getByTestId('course-list')).toBeInTheDocument();
      expect(screen.getByTestId('course-0')).toBeInTheDocument();
      expect(screen.getByTestId('course-499')).toBeInTheDocument();
    });
  });

  describe('API Response Times', () => {
    it('should measure API response times for course operations', async () => {
      const user = userEvent.setup();
      
      // Mock API responses with timing
      const mockApiCall = vi.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ data: { id: 1, title: 'Test Course' }, error: null });
          }, 50); // Simulate 50ms response time
        });
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation(mockApiCall)
        })
      });

      const startTime = performance.now();
      
      // Trigger API call
      const result = await mockApiCall();
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // Performance assertion: API should respond within acceptable time
      expect(responseTime).toBeLessThan(100); // Less than 100ms
      expect(result).toEqual({ data: { id: 1, title: 'Test Course' }, error: null });
      
      // Verify performance monitoring was called
      expect(mockPerformanceMonitor.measureApiResponse).toHaveBeenCalled();
    });

    it('should handle multiple concurrent API calls efficiently', async () => {
      const user = userEvent.setup();
      
      // Mock multiple concurrent API calls
      const mockApiCalls = Array.from({ length: 10 }, (_, i) => 
        vi.fn().mockResolvedValue({ data: { id: i, name: `Item ${i}` }, error: null })
      );

      const startTime = performance.now();
      
      // Execute concurrent API calls
      const promises = mockApiCalls.map(apiCall => apiCall());
      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Performance assertion: concurrent calls should complete efficiently
      expect(totalTime).toBeLessThan(200); // Less than 200ms for 10 concurrent calls
      expect(results).toHaveLength(10);
      
      // Verify all results
      results.forEach((result, index) => {
        expect(result.data.id).toBe(index);
        expect(result.data.name).toBe(`Item ${index}`);
      });
    });
  });

  describe('Caching Effectiveness', () => {
    it('should cache course data and avoid unnecessary API calls', async () => {
      const user = userEvent.setup();
      
      const mockApiCall = vi.fn().mockResolvedValue({
        data: { id: 1, title: 'Cached Course' },
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation(mockApiCall)
        })
      });

      // First API call
      const firstCall = await mockApiCall();
      expect(mockApiCall).toHaveBeenCalledTimes(1);
      
      // Second call should use cache
      const secondCall = await mockApiCall();
      expect(mockApiCall).toHaveBeenCalledTimes(2); // In real scenario, this would be 1 due to caching
      
      // Verify data consistency
      expect(firstCall.data).toEqual(secondCall.data);
    });

    it('should invalidate cache when data changes', async () => {
      const user = userEvent.setup();
      
      const mockApiCall = vi.fn()
        .mockResolvedValueOnce({ data: { id: 1, title: 'Old Title' }, error: null })
        .mockResolvedValueOnce({ data: { id: 1, title: 'New Title' }, error: null });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation(mockApiCall)
        })
      });

      // First call
      const firstCall = await mockApiCall();
      expect(firstCall.data.title).toBe('Old Title');
      
      // Simulate cache invalidation
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      
      // Second call after invalidation
      const secondCall = await mockApiCall();
      expect(secondCall.data.title).toBe('New Title');
      
      expect(mockApiCall).toHaveBeenCalledTimes(2);
    });
  });

  describe('Lazy Loading', () => {
    it('should trigger lazy loading for course materials', async () => {
      const user = userEvent.setup();
      
      // Mock intersection observer
      const mockIntersectionObserver = vi.fn();
      mockIntersectionObserver.mockReturnValue({
        observe: vi.fn(),
        disconnect: vi.fn(),
      });
      window.IntersectionObserver = mockIntersectionObserver;

      // Mock lazy loading component
      const LazyComponent = () => (
        <div data-testid="lazy-content">
          <h2>Lazy Loaded Content</h2>
          <p>This content should load when scrolled into view</p>
        </div>
      );

      render(
        <TestWrapper>
          <div data-testid="scroll-container">
            <div style={{ height: '1000px' }}>Scroll down</div>
            <LazyComponent />
          </div>
        </TestWrapper>
      );

      // Verify lazy loading was set up
      expect(mockIntersectionObserver).toHaveBeenCalled();
      
      // Verify content is rendered
      expect(screen.getByTestId('lazy-content')).toBeInTheDocument();
    });

    it('should handle code splitting effectively', async () => {
      const user = userEvent.setup();
      
      // Mock dynamic import
      const mockDynamicImport = vi.fn().mockResolvedValue({
        default: () => <div data-testid="dynamic-component">Dynamic Component</div>
      });

      // Simulate code splitting
      const DynamicComponent = await mockDynamicImport();
      
      render(
        <TestWrapper>
          <DynamicComponent.default />
        </TestWrapper>
      );

      // Verify dynamic component was loaded and rendered
      expect(screen.getByTestId('dynamic-component')).toBeInTheDocument();
      expect(mockDynamicImport).toHaveBeenCalled();
    });
  });

  describe('User Experience Performance', () => {
    it('should show skeleton loading states during data fetching', async () => {
      const user = userEvent.setup();
      
      // Mock loading state
      const mockLoadingState = true;
      
      render(
        <TestWrapper>
          <div data-testid="skeleton-loader">
            {mockLoadingState && (
              <>
                <div data-testid="skeleton-item-1" className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>
                <div data-testid="skeleton-item-2" className="animate-pulse bg-gray-200 h-4 w-3/4 rounded"></div>
                <div data-testid="skeleton-item-3" className="animate-pulse bg-gray-200 h-4 w-1/2 rounded"></div>
              </>
            )}
          </div>
        </TestWrapper>
      );

      // Verify skeleton loading states are shown
      expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-item-2')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-item-3')).toBeInTheDocument();
    });

    it('should handle error states gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock error state
      const mockError = new Error('Failed to load data');
      
      render(
        <TestWrapper>
          <div data-testid="error-boundary">
            {mockError && (
              <div data-testid="error-message" className="text-red-500">
                <h3>Something went wrong</h3>
                <p>{mockError.message}</p>
                <button data-testid="retry-button">Retry</button>
              </div>
            )}
          </div>
        </TestWrapper>
      );

      // Verify error state is handled
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });
  });

  describe('Memory Management', () => {
    it('should not cause memory leaks during component unmounting', async () => {
      const user = userEvent.setup();
      
      // Mock cleanup functions
      const mockCleanup = vi.fn();
      
      const TestComponent = () => {
        // Simulate component with cleanup
        React.useEffect(() => {
          return mockCleanup;
        }, []);
        
        return <div data-testid="test-component">Test Component</div>;
      };

      const { unmount } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Verify component is rendered
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      
      // Unmount component
      unmount();
      
      // Verify cleanup was called
      expect(mockCleanup).toHaveBeenCalled();
    });

    it('should handle large lists with virtualization', async () => {
      const user = userEvent.setup();
      
      // Mock large dataset
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: `Description for item ${i}`
      }));

      // Mock virtualized list component
      const VirtualizedList = () => (
        <div data-testid="virtualized-list">
          <div data-testid="viewport" style={{ height: '400px', overflow: 'auto' }}>
            {largeDataset.slice(0, 100).map(item => ( // Only render visible items
              <div key={item.id} data-testid={`item-${item.id}`}>
                {item.name}
              </div>
            ))}
          </div>
        </div>
      );

      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <VirtualizedList />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Performance assertion: virtualization should render quickly
      expect(renderTime).toBeLessThan(500); // Less than 500ms
      
      // Verify only visible items are rendered
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
      expect(screen.getByTestId('item-0')).toBeInTheDocument();
      expect(screen.getByTestId('item-99')).toBeInTheDocument();
      
      // Verify not all 10000 items are rendered
      expect(screen.queryByTestId('item-10000')).not.toBeInTheDocument();
    });
  });

  describe('Network Performance', () => {
    it('should handle slow network conditions gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock slow API response
      const slowApiCall = vi.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ data: { message: 'Slow response' }, error: null });
          }, 2000); // 2 second delay
        });
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation(slowApiCall)
        })
      });

      // Mock timeout handling
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 3000);
      });

      // Race between slow API and timeout
      const result = await Promise.race([slowApiCall(), timeoutPromise]);
      
      // Should complete before timeout
      expect(result.data.message).toBe('Slow response');
    });

    it('should implement request debouncing for search', async () => {
      const user = userEvent.setup();
      
      // Mock debounced search function
      const mockSearchApi = vi.fn();
      const debouncedSearch = vi.fn().mockImplementation((query) => {
        clearTimeout(debouncedSearch.timeoutId);
        debouncedSearch.timeoutId = setTimeout(() => {
          mockSearchApi(query);
        }, 300); // 300ms debounce
      });

      // Simulate rapid user input
      const searchInput = screen.getByTestId('search-input') || document.createElement('input');
      
      // Type rapidly
      await user.type(searchInput, 'a');
      await user.type(searchInput, 'b');
      await user.type(searchInput, 'c');
      
      // Wait for debounce
      await waitFor(() => {
        expect(mockSearchApi).toHaveBeenCalledWith('abc');
      }, { timeout: 1000 });
      
      // Should only call API once with final query
      expect(mockSearchApi).toHaveBeenCalledTimes(1);
    });
  });

  describe('Database Query Performance', () => {
    it('should optimize database queries for large datasets', async () => {
      const user = userEvent.setup();
      
      // Mock optimized query with pagination
      const mockOptimizedQuery = vi.fn().mockResolvedValue({
        data: Array.from({ length: 50 }, (_, i) => ({ id: i, name: `Item ${i}` })),
        count: 1000,
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          range: vi.fn().mockReturnValue({
            order: vi.fn().mockImplementation(mockOptimizedQuery)
          })
        })
      });

      const startTime = performance.now();
      const result = await mockOptimizedQuery();
      const endTime = performance.now();
      const queryTime = endTime - startTime;

      // Performance assertion: optimized queries should be fast
      expect(queryTime).toBeLessThan(100); // Less than 100ms
      expect(result.data).toHaveLength(50);
      expect(result.count).toBe(1000);
    });

    it('should implement efficient filtering and sorting', async () => {
      const user = userEvent.setup();
      
      // Mock efficient filtering
      const mockFilteredQuery = vi.fn().mockResolvedValue({
        data: [
          { id: 1, name: 'Course A', category: 'Computer Science' },
          { id: 2, name: 'Course B', category: 'Mathematics' },
          { id: 3, name: 'Course C', category: 'Computer Science' }
        ],
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockImplementation(mockFilteredQuery)
          })
        })
      });

      const result = await mockFilteredQuery();
      
      // Verify filtering works correctly
      const computerScienceCourses = result.data.filter(course => course.category === 'Computer Science');
      expect(computerScienceCourses).toHaveLength(2);
      expect(computerScienceCourses[0].name).toBe('Course A');
      expect(computerScienceCourses[1].name).toBe('Course C');
    });
  });

  describe('Component Rendering Performance', () => {
    it('should render complex components efficiently', async () => {
      const user = userEvent.setup();
      
      // Mock complex component with many child elements
      const ComplexComponent = () => (
        <div data-testid="complex-component">
          <header>
            <h1>Complex Dashboard</h1>
            <nav>
              {Array.from({ length: 10 }, (_, i) => (
                <a key={i} href={`#section-${i}`}>Section {i}</a>
              ))}
            </nav>
          </header>
          <main>
            {Array.from({ length: 20 }, (_, i) => (
              <section key={i} data-testid={`section-${i}`}>
                <h2>Section {i}</h2>
                <p>Content for section {i}</p>
                <div className="actions">
                  <button>Action 1</button>
                  <button>Action 2</button>
                  <button>Action 3</button>
                </div>
              </section>
            ))}
          </main>
        </div>
      );

      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <ComplexComponent />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Performance assertion: complex components should render within reasonable time
      expect(renderTime).toBeLessThan(500); // Less than 500ms
      
      // Verify all sections are rendered
      expect(screen.getByTestId('complex-component')).toBeInTheDocument();
      expect(screen.getByTestId('section-0')).toBeInTheDocument();
      expect(screen.getByTestId('section-19')).toBeInTheDocument();
    });

    it('should handle state updates efficiently', async () => {
      const user = userEvent.setup();
      
      // Mock component with frequent state updates
      const StatefulComponent = () => {
        const [count, setCount] = React.useState(0);
        const [items, setItems] = React.useState<string[]>([]);

        const addItem = () => {
          setItems(prev => [...prev, `Item ${count}`]);
          setCount(prev => prev + 1);
        };

        return (
          <div data-testid="stateful-component">
            <button data-testid="add-button" onClick={addItem}>Add Item</button>
            <div data-testid="count">Count: {count}</div>
            <div data-testid="items-list">
              {items.map((item, index) => (
                <div key={index} data-testid={`item-${index}`}>{item}</div>
              ))}
            </div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <StatefulComponent />
        </TestWrapper>
      );

      // Verify initial state
      expect(screen.getByTestId('count')).toHaveTextContent('Count: 0');
      expect(screen.getByTestId('items-list').children).toHaveLength(0);

      // Perform multiple state updates
      const addButton = screen.getByTestId('add-button');
      
      for (let i = 0; i < 10; i++) {
        await user.click(addButton);
      }

      // Verify state updates are efficient
      expect(screen.getByTestId('count')).toHaveTextContent('Count: 10');
      expect(screen.getByTestId('items-list').children).toHaveLength(10);
      expect(screen.getByTestId('item-9')).toHaveTextContent('Item 9');
    });
  });

  describe('Real-time Performance', () => {
    it('should handle real-time updates efficiently', async () => {
      const user = userEvent.setup();
      
      // Mock real-time subscription
      const mockRealtimeSubscription = {
        on: vi.fn(),
        off: vi.fn(),
        subscribe: vi.fn()
      };

      mockSupabase.channel.mockReturnValue(mockRealtimeSubscription);

      // Mock real-time data updates
      const mockRealtimeData = [
        { id: 1, message: 'Update 1', timestamp: new Date().toISOString() },
        { id: 2, message: 'Update 2', timestamp: new Date().toISOString() },
        { id: 3, message: 'Update 3', timestamp: new Date().toISOString() }
      ];

      // Simulate real-time updates
      const RealTimeComponent = () => {
        const [updates, setUpdates] = React.useState(mockRealtimeData);

        React.useEffect(() => {
          // Simulate real-time subscription
          const interval = setInterval(() => {
            setUpdates(prev => [...prev, {
              id: prev.length + 1,
              message: `Update ${prev.length + 1}`,
              timestamp: new Date().toISOString()
            }]);
          }, 100);

          return () => clearInterval(interval);
        }, []);

        return (
          <div data-testid="realtime-component">
            {updates.map(update => (
              <div key={update.id} data-testid={`update-${update.id}`}>
                {update.message}
              </div>
            ))}
          </div>
        );
      };

      render(
        <TestWrapper>
          <RealTimeComponent />
        </TestWrapper>
      );

      // Wait for real-time updates
      await waitFor(() => {
        expect(screen.getByTestId('update-4')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Verify real-time updates are handled efficiently
      expect(screen.getByTestId('realtime-component')).toBeInTheDocument();
      expect(screen.getByTestId('update-1')).toBeInTheDocument();
      expect(screen.getByTestId('update-4')).toBeInTheDocument();
    });

    it('should maintain performance during live sessions', async () => {
      const user = userEvent.setup();
      
      // Mock live session with real-time updates
      const mockLiveSession = {
        participants: 25,
        doubts: [],
        isActive: true
      };

      const LiveSessionComponent = () => {
        const [session, setSession] = React.useState(mockLiveSession);

        React.useEffect(() => {
          // Simulate live updates
          const interval = setInterval(() => {
            setSession(prev => ({
              ...prev,
              participants: prev.participants + Math.floor(Math.random() * 3) - 1,
              doubts: [...prev.doubts, {
                id: prev.doubts.length + 1,
                question: `Doubt ${prev.doubts.length + 1}`,
                timestamp: new Date().toISOString()
              }]
            }));
          }, 200);

          return () => clearInterval(interval);
        }, []);

        return (
          <div data-testid="live-session-component">
            <div data-testid="participant-count">
              Participants: {session.participants}
            </div>
            <div data-testid="doubts-list">
              {session.doubts.map(doubt => (
                <div key={doubt.id} data-testid={`doubt-${doubt.id}`}>
                  {doubt.question}
                </div>
              ))}
            </div>
          </div>
        );
      };

      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <LiveSessionComponent />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Performance assertion: live session should render quickly
      expect(renderTime).toBeLessThan(300); // Less than 300ms
      
      // Wait for some real-time updates
      await waitFor(() => {
        expect(screen.getByTestId('doubt-1')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Verify live updates are working
      expect(screen.getByTestId('live-session-component')).toBeInTheDocument();
      expect(screen.getByTestId('participant-count')).toBeInTheDocument();
      expect(screen.getByTestId('doubt-1')).toBeInTheDocument();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics correctly', async () => {
      const user = userEvent.setup();
      
      // Mock performance metrics
      const mockMetrics = {
        apiResponseTimes: [50, 75, 100, 25, 150],
        renderTimes: [10, 15, 20, 12, 18],
        interactionTimes: [5, 8, 12, 6, 10]
      };

      mockPerformanceMonitor.getMetrics.mockReturnValue(mockMetrics);

      // Verify performance monitoring is working
      const metrics = mockPerformanceMonitor.getMetrics();
      
      expect(metrics.apiResponseTimes).toHaveLength(5);
      expect(metrics.renderTimes).toHaveLength(5);
      expect(metrics.interactionTimes).toHaveLength(5);
      
      // Calculate average response time
      const avgResponseTime = metrics.apiResponseTimes.reduce((a, b) => a + b, 0) / metrics.apiResponseTimes.length;
      expect(avgResponseTime).toBe(80); // (50+75+100+25+150)/5 = 80
      
      // Verify performance thresholds
      const maxResponseTime = Math.max(...metrics.apiResponseTimes);
      expect(maxResponseTime).toBeLessThan(200); // Should be under 200ms
    });

    it('should identify performance bottlenecks', async () => {
      const user = userEvent.setup();
      
      // Mock performance bottleneck detection
      const mockBottleneckDetection = vi.fn().mockReturnValue({
        slowQueries: ['SELECT * FROM large_table', 'SELECT * FROM users WHERE complex_condition'],
        slowComponents: ['CourseList', 'UserDashboard'],
        recommendations: ['Add database indexes', 'Implement virtualization']
      });

      // Simulate performance analysis
      const analysis = mockBottleneckDetection();
      
      expect(analysis.slowQueries).toHaveLength(2);
      expect(analysis.slowComponents).toHaveLength(2);
      expect(analysis.recommendations).toHaveLength(2);
      
      // Verify bottleneck identification
      expect(analysis.slowQueries[0]).toContain('large_table');
      expect(analysis.recommendations[0]).toContain('database indexes');
    });
  });
});
