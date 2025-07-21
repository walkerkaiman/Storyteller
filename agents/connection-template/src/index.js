const ConnectionAgent = require('../agent-base/ConnectionAgent');

// Create and start the connection agent
const agent = new ConnectionAgent({
    port: process.env.PORT || 8080
});

// Start the agent
agent.start().catch(error => {
    console.error('Failed to start connection agent:', error);
    process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down connection agent...');
    agent.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down connection agent...');
    agent.stop();
    process.exit(0);
}); 