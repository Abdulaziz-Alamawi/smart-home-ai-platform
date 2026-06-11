process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test_access_secret";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret";
process.env.JWT_ACCESS_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test?schema=public";
process.env.AI_ENGINE_URL = "http://localhost:8010";
