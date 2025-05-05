const config = {
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb+srv://typing_test_admin:TypingTest2024Secure!@cluster0.mongodb.net/typing-test?retryWrites=true&w=majority'
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'typing-test-secure-key-2024-production'
    }
};

module.exports = config; 