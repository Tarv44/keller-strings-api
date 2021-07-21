module.exports = {
    PORT: process.env.PORT || 5432,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://jonahtarver@localhost/rotation",
    TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || "postgresql://jonahtarver@localhost/rotation-test",
    CLIENT_ORIGIN: "http://localhost:3000" //process.env.CLIENT_ORIGIN || "https://featherreport.biz"
}