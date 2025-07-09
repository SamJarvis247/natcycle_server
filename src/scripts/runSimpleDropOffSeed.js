#!/usr/bin/env node

/**
 * Quick test script to run SimpleDropOffLocation seeding
 * Usage: npm run seed:simple-dropoffs
 */

console.log('🌱 Starting SimpleDropOffLocation seeding...');
console.log('📍 Target: 20 locations with 4 near Happy Food Bakery, Ada George');
console.log('🗺️  Distribution: PH (10), Lagos (3), Abuja (2), International (5)');
console.log('');

require('./seedSimpleDropOffLocations.js');
