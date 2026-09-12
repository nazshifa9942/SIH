/**
 * Global Jest setup that replaces the real ML and optimization HTTP clients
 * with in-process test doubles. Without this, every integration suite that
 * touches forecasting or vessel planning would try to reach the Python
 * services on localhost:8000/8001 and fail with "fetch failed".
 */

jest.mock('../src/integrations/ml/ml.client', () =>
  require('./mocks/ml.client')
);

jest.mock(
  '../src/integrations/optimization/optimization.client',
  () => require('./mocks/optimization.client')
);
