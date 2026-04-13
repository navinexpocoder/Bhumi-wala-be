/**
 * Migration script to create database indexes for chat system
 * Run: node migrate-chat-indexes.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const Conversation = require('./models/conversationModel');
const Message = require('./models/messageModel');

async function createIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ Connected to MongoDB');

    // Create Conversation indexes
    console.log('\n📑 Creating Conversation indexes...');

    await Conversation.collection.createIndex({ participants: 1 });
    console.log('  ✓ Index on participants');

    await Conversation.collection.createIndex({ property: 1 });
    console.log('  ✓ Index on property');

    await Conversation.collection.createIndex({ status: 1 });
    console.log('  ✓ Index on status');

    await Conversation.collection.createIndex({ createdAt: -1 });
    console.log('  ✓ Index on createdAt (descending)');

    await Conversation.collection.createIndex({ 'lastMessage.timestamp': -1 });
    console.log('  ✓ Index on lastMessage.timestamp');

    await Conversation.collection.createIndex(
      { participants: 1, property: 1 },
      { unique: true }
    );
    console.log('  ✓ Unique index on participants + property');

    // Create Message indexes
    console.log('\n💬 Creating Message indexes...');

    await Message.collection.createIndex({ conversationId: 1, createdAt: -1 });
    console.log('  ✓ Compound index on conversationId + createdAt');

    await Message.collection.createIndex({ sender: 1 });
    console.log('  ✓ Index on sender');

    await Message.collection.createIndex({ 'content.type': 1 });
    console.log('  ✓ Index on content.type');

    await Message.collection.createIndex({ status: 1 });
    console.log('  ✓ Index on status');

    await Message.collection.createIndex({ isDeleted: 1 });
    console.log('  ✓ Index on isDeleted');

    // Full-text search index
    await Message.collection.createIndex({ searchText: 'text' });
    console.log('  ✓ Full-text search index on searchText');

    // Geospatial index for location messages
    await Message.collection.createIndex({ 'content.location.coordinates': '2dsphere' });
    console.log('  ✓ Geospatial index on location.coordinates');

    console.log(
      '\n✅ All indexes created successfully!\n'
    );

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();
