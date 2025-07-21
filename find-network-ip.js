#!/usr/bin/env node

const os = require('os');

console.log('🌐 Storyteller Network Information');
console.log('==================================');
console.log();

const networkInterfaces = os.networkInterfaces();

console.log('Available network interfaces:');
console.log();

Object.keys(networkInterfaces).forEach((interfaceName) => {
    const interfaces = networkInterfaces[interfaceName];
    
    interfaces.forEach((interface) => {
        if (interface.family === 'IPv4' && !interface.internal) {
            console.log(`📡 ${interfaceName}:`);
            console.log(`   IP Address: ${interface.address}`);
            console.log(`   Netmask: ${interface.netmask}`);
            console.log(`   MAC Address: ${interface.mac}`);
            console.log();
            
            console.log('   Access URLs:');
            console.log(`   • Dashboard: http://${interface.address}:3000/dashboard`);
            console.log(`   • Portal: http://${interface.address}:3000`);
            console.log(`   • Agents: http://${interface.address}:8080`);
            console.log();
        }
    });
});

console.log('💡 Tips:');
console.log('• Use these URLs to access Storyteller from other devices on your network');
console.log('• Make sure your firewall allows connections on ports 3000 and 8080');
console.log('• All devices must be connected to the same WiFi network');
console.log();
console.log('🔐 Dashboard Login: admin / 1234'); 