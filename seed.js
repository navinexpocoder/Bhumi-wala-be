const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/userModel');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI|| 'mongodb://localhost:27017/property-selling');
    console.log('MongoDB connected successfully');
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Seed data
const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Clearing existing users...');
    await User.deleteMany({});
    console.log('Existing users cleared');

    // Create Admin Users
    console.log('Creating admin users...');
    const admin1 = await User.create({
      userId: 'ADM001',
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      age: 35,
      contact: '+91-9876543210',
      details: 'Main administrator with full system access',
      role: 'admin',
      isActive: true,
      isBlocked: false,
      lastLogin: new Date(),
      userIdProf: 'https://example.com/admin-id-proof.pdf',
      verified: 'approve',
    });

    const admin2 = await User.create({
      userId: 'ADM002',
      name: 'Super Admin',
      email: 'superadmin@example.com',
      password: 'admin123',
      age: 40,
      contact: '+91-9876543211',
      details: 'Super administrator with complete system control',
      role: 'admin',
      isActive: true,
      isBlocked: false,
      lastLogin: new Date(),
      userIdProf: 'https://example.com/superadmin-id-proof.pdf',
      verified: 'approve',
    });

    // Create Agent Users
    console.log('Creating agent users...');
    const agent1 = await User.create({
      userId: 'AGT001',
      name: 'James Anderson',
      email: 'james.anderson@example.com',
      password: 'agent123',
      age: 38,
      contact: '+91-9876543240',
      details: 'Professional real estate agent with 8 years of experience',
      role: 'agent',
      isActive: true,
      isBlocked: false,
      lastLogin: new Date(),
      userIdProf: 'https://example.com/agent1-id-proof.pdf',
      verified: 'approve',
    });

    const agent2 = await User.create({
      userId: 'AGT002',
      name: 'Patricia White',
      email: 'patricia.white@example.com',
      password: 'agent123',
      age: 33,
      contact: '+91-9876543241',
      details: 'Certified property advisor specializing in commercial real estate',
      role: 'agent',
      isActive: true,
      isBlocked: false,
      lastLogin: new Date(),
      userIdProf: 'https://example.com/agent2-id-proof.pdf',
      verified: 'pending',
    });

    const agent3 = await User.create({
      userId: 'AGT003',
      name: 'Thomas Harris',
      email: 'thomas.harris@example.com',
      password: 'agent123',
      age: 45,
      contact: '+91-9876543242',
      details: 'Senior real estate consultant with luxury property expertise',
      role: 'agent',
      isActive: false,
      isBlocked: false,
      lastLogin: new Date('2024-01-15'),
      userIdProf: null,
      verified: 'reject',
    });

    // Create Seller Users
    console.log('Creating seller users...');
    const seller1 = await User.create({
      userId: 'SEL001',
      name: 'John Smith',
      email: 'john.smith@example.com',
      password: 'seller123',
      age: 32,
      contact: '+91-9876543220',
      details: 'Experienced real estate seller specializing in residential properties',
      role: 'seller',
      isActive: true,
      isBlocked: false,
      lastLogin: new Date(),
      userIdProf: 'https://example.com/seller1-id-proof.pdf',
      verified: 'approve',
    });

    const seller2 = await User.create({
      userId: 'SEL002',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      password: 'seller123',
      age: 28,
      contact: '+91-9876543221',
      details: 'Property consultant with 5 years of experience in commercial real estate',
      role: 'seller',
      isActive: true,
      isBlocked: false,
      lastLogin: new Date('2024-01-20'),
      userIdProf: 'https://example.com/seller2-id-proof.pdf',
      verified: 'approve',
    });

    const seller3 = await User.create({
      userId: 'SEL003',
      name: 'Michael Brown',
      email: 'michael.brown@example.com',
      password: 'seller123',
      age: 45,
      contact: '+91-9876543222',
      details: 'Senior property seller, expert in luxury properties and villas',
      role: 'seller',
      isActive: true,
      isBlocked: false,
      lastLogin: new Date('2024-01-18'),
      userIdProf: 'https://example.com/seller3-id-proof.pdf',
      verified: 'pending',
    });

    const seller4 = await User.create({
      userId: 'SEL004',
      name: 'Emily Davis',
      email: 'emily.davis@example.com',
      password: 'seller123',
      age: 30,
      contact: '+91-9876543223',
      details: 'Real estate broker focusing on apartments and flats in prime locations',
      role: 'seller',
      isActive: true,
      isBlocked: false,
      lastLogin: new Date('2024-01-22'),
      userIdProf: null,
      verified: 'approve',
    });

    const seller5 = await User.create({
      userId: 'SEL005',
      name: 'Christopher Lee',
      email: 'christopher.lee@example.com',
      password: 'seller123',
      age: 52,
      contact: '+91-9876543224',
      details: 'Veteran real estate seller with property development background',
      role: 'seller',
      isActive: false,
      isBlocked: true,
      lastLogin: new Date('2023-12-10'),
      userIdProf: 'https://example.com/seller5-id-proof.pdf',
      verified: 'reject',
    });

    // Create Regular Users (Buyers)
    console.log('Creating regular users...');
    const user1 = await User.create({
      userId: 'USR001',
      name: 'David Wilson',
      email: 'david.wilson@example.com',
      password: 'user123',
      age: 29,
      contact: '+91-9876543230',
      details: 'Looking for a 2-3 BHK apartment in Delhi-NCR region',
      role: 'user',
      isActive: true,
      isBlocked: false,
      lastLogin: new Date(),
      userIdProf: 'https://example.com/user1-id-proof.pdf',
      verified: 'approve',
    });

    const user2 = await User.create({
      userId: 'USR002',
      name: 'Lisa Anderson',
      email: 'lisa.anderson@example.com',
      password: 'user123',
      age: 35,
      contact: '+91-9876543231',
      details: 'Interested in buying a house with garden in Gurgaon',
      role: 'user',
      isActive: true,
      isBlocked: false,
      lastLogin: new Date('2024-01-21'),
      userIdProf: 'https://example.com/user2-id-proof.pdf',
      verified: 'approve',
    });

    const user3 = await User.create({
      userId: 'USR003',
      name: 'Robert Taylor',
      email: 'robert.taylor@example.com',
      password: 'user123',
      age: 42,
      contact: '+91-9876543232',
      details: 'Seeking commercial space for business expansion',
      role: 'user',
      isActive: true,
      isBlocked: false,
      lastLogin: new Date('2024-01-19'),
      userIdProf: null,
      verified: 'pending',
    });

    const user4 = await User.create({
      userId: 'USR004',
      name: 'Jennifer Martinez',
      email: 'jennifer.martinez@example.com',
      password: 'user123',
      age: 26,
      contact: '+91-9876543233',
      details: 'First time homebuyer looking for affordable 1 BHK apartment',
      role: 'user',
      isActive: true,
      isBlocked: false,
      lastLogin: new Date('2024-01-23'),
      userIdProf: 'https://example.com/user4-id-proof.pdf',
      verified: 'pending',
    });

    const user5 = await User.create({
      userId: 'USR005',
      name: 'William Garcia',
      email: 'william.garcia@example.com',
      password: 'user123',
      age: 55,
      contact: '+91-9876543234',
      details: 'Retired professional looking for a peaceful villa in suburbs',
      role: 'user',
      isActive: false,
      isBlocked: false,
      lastLogin: new Date('2024-01-05'),
      userIdProf: 'https://example.com/user5-id-proof.pdf',
      verified: 'approve',
    });

    const user6 = await User.create({
      userId: 'USR006',
      name: 'Angela Rodriguez',
      email: 'angela.rodriguez@example.com',
      password: 'user123',
      age: 31,
      contact: '+91-9876543235',
      details: 'Investor looking for rental properties with good ROI',
      role: 'user',
      isActive: true,
      isBlocked: false,
      lastLogin: new Date('2024-01-20'),
      userIdProf: null,
      verified: 'reject',
    });

    console.log('Users created successfully');

    // Summary
    console.log('\n=== Seeding Summary ===');
    console.log('Admin users: 2');
    console.log('Agent users: 3');
    console.log('Seller users: 5');
    console.log('Regular users: 6');
    console.log('Total users: 16');

    console.log('\n=== Verification Status ===');
    console.log('Approved users: 10');
    console.log('Pending users: 3');
    console.log('Rejected users: 2');
    console.log('Blocked users: 1');

    console.log('\n=== Test Credentials ===');
    console.log('Admin:');
    console.log('  Email: admin@example.com');
    console.log('  Password: admin123');
    console.log('\nAgent:');
    console.log('  Email: james.anderson@example.com');
    console.log('  Password: agent123');
    console.log('\nSeller:');
    console.log('  Email: john.smith@example.com');
    console.log('  Password: seller123');
    console.log('\nRegular User:');
    console.log('  Email: david.wilson@example.com');
    console.log('  Password: user123');

    console.log('\n✅ Database seeded successfully with user data only!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed
seedData();
