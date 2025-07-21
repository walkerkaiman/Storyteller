const ChapterAgent = require('../agent-base/ChapterAgent');

// Create and start the chapter agent
const agent = new ChapterAgent({
    port: process.env.PORT || 8080
});

// Start the agent
agent.start().catch(error => {
    console.error('Failed to start chapter agent:', error);
    process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down chapter agent...');
    agent.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down chapter agent...');
    agent.stop();
    process.exit(0);
}); 