process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.DATABASE_URL = 'postgresql://sih26006:sih26006@localhost:5432/sih26006_test?schema=public';
process.env.JWT_SECRET = 'test-jwt-secret-key-32chars-min';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.LOG_LEVEL = 'error';
