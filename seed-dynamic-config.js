require('dotenv').config();
const mongoose = require('mongoose');
const UIConfig = require('./models/uiConfigModel');
const SystemConfig = require('./models/systemConfigModel');
const db = require('./config/db');

// Initial UI Configurations
const initialUIConfigs = [
  {
    configKey: 'menuConfig',
    configValue: [
      {
        id: 'home',
        label: 'Home',
        path: '/',
        roles: ['guest', 'user', 'buyer', 'seller', 'agent', 'admin'],
      },
      {
        id: 'buyerDashboard',
        label: 'Buyer Dashboard',
        path: '/buyer/dashboard',
        roles: ['buyer', 'user'],
      },
      {
        id: 'sellerDashboard',
        label: 'Seller Dashboard',
        path: '/seller/dashboard',
        roles: ['seller'],
      },
      {
        id: 'agentDashboard',
        label: 'Agent Dashboard',
        path: '/agent/dashboard',
        roles: ['agent'],
      },
      {
        id: 'adminDashboard',
        label: 'Admin Dashboard',
        path: '/admin',
        roles: ['admin'],
      },
    ],
    category: 'menu',
    description: 'Main navigation menu configuration',
    isActive: true,
  },
  {
    configKey: 'themeConfig',
    configValue: {
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      logoUrl: '/images/logo.png',
      faviconUrl: '/images/favicon.ico',
    },
    category: 'theme',
    description: 'UI theme configuration',
    isActive: true,
  },
  {
    configKey: 'featureFlags',
    configValue: {
      enableGeoSearch: true,
      enableLeadManagement: true,
      enableChatNotification: true,
      enableEmailVerification: true,
    },
    category: 'feature',
    description: 'Feature flags for enabling/disabling features',
    isActive: true,
  },
];

// Initial System Configurations
const initialSystemConfigs = [
  {
    configKey: 'ROLES',
    configValues: [
      { value: 'admin', label: 'Admin', description: 'System administrator' },
      { value: 'seller', label: 'Seller', description: 'Property seller' },
      { value: 'agent', label: 'Agent', description: 'Real estate agent' },
      { value: 'user', label: 'User', description: 'Regular buyer' },
    ],
    category: 'role',
    description: 'Available user roles',
    isActive: true,
  },
  {
    configKey: 'PROPERTY_TYPES',
    configValues: [
      { value: 'Farmhouse', label: 'Farmhouse', description: 'Farmhouse' },
      { value: 'Farmland', label: 'Farmland', description: 'Farmland' },
      { value: 'Agriculture Land', label: 'Agriculture Land', description: 'Agriculture land' },
      { value: 'Resort', label: 'Resort', description: 'Resort / agri resort' },
      { value: 'Flat', label: 'Flat', description: 'Apartment/Flat' },
      { value: 'House', label: 'House', description: 'Independent house' },
      { value: 'Plot', label: 'Plot', description: 'Land plot' },
      { value: 'Villa', label: 'Villa', description: 'Villa/Bungalow' },
      { value: 'Apartment', label: 'Apartment', description: 'Multi-unit apartment' },
      { value: 'Commercial', label: 'Commercial', description: 'Commercial space' },
      { value: 'Other', label: 'Other', description: 'Other property type' },
    ],
    category: 'propertyType',
    description: 'Available property types',
    isActive: true,
  },
  {
    configKey: 'PROPERTY_STATUS',
    configValues: [
      { value: 'pending', label: 'Pending', description: 'Awaiting approval' },
      { value: 'approved', label: 'Approved', description: 'Approved by admin' },
      { value: 'sold', label: 'Sold', description: 'Property sold' },
    ],
    category: 'status',
    description: 'Property status values',
    isActive: true,
  },
  {
    configKey: 'VERIFICATION_STATUS',
    configValues: [
      { value: 'pending', label: 'Pending', description: 'Verification pending' },
      { value: 'approve', label: 'Approved', description: 'User verified' },
      { value: 'reject', label: 'Rejected', description: 'Verification rejected' },
    ],
    category: 'status',
    description: 'User verification status values',
    isActive: true,
  },
  {
    configKey: 'LEAD_STATUS',
    configValues: [
      { value: 'viewed', label: 'Viewed', description: 'Property viewed' },
      { value: 'interested', label: 'Interested', description: 'Buyer interested' },
      { value: 'contacted', label: 'Contacted', description: 'Buyer contacted' },
      { value: 'uninterested', label: 'Uninterested', description: 'Buyer not interested' },
    ],
    category: 'status',
    description: 'Lead status values',
    isActive: true,
  },
];

const seedConfigs = async () => {
  try {
    await db;
    console.log('Connected to database');

    // Clear existing configs (optional - comment out if you want to keep them)
    // await UIConfig.deleteMany({});
    // await SystemConfig.deleteMany({});

    // Insert UI Configs
    const uiInsertResult = await UIConfig.insertMany(initialUIConfigs, { ordered: false }).catch(() => {
      console.log('Some UI configs already exist, skipping duplicates');
      return [];
    });

    if (uiInsertResult.length > 0) {
      console.log(`✓ Inserted ${uiInsertResult.length} UI configurations`);
    }

    // Insert System Configs
    const systemInsertResult = await SystemConfig.insertMany(initialSystemConfigs, { ordered: false }).catch(() => {
      console.log('Some system configs already exist, skipping duplicates');
      return [];
    });

    if (systemInsertResult.length > 0) {
      console.log(`✓ Inserted ${systemInsertResult.length} system configurations`);
    }

    console.log('\n✓ Configuration seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding configurations:', error.message);
    process.exit(1);
  }
};

seedConfigs();
