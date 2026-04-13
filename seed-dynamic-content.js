/**
 * Seed script for initializing dynamic configuration
 * Run: node seed-dynamic-config.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const DynamicConfig = require('./models/dynamicConfigModel');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const seedConfigs = async () => {
  try {
    // Clear existing configs
    await DynamicConfig.deleteMany({});
    console.log('🗑️  Cleared existing configurations');

    // Seed theme configuration
    const themeConfig = await DynamicConfig.create({
      configKey: 'theme',
      configType: 'theme',
      description: 'Global theme configuration for the website',
      theme: {
        primaryColor: '#FF6B6B',
        secondaryColor: '#4ECDC4',
        accentColor: '#95E1D3',
        darkMode: false,
        fontFamily: {
          heading: 'Poppins, sans-serif',
          body: 'Open Sans, sans-serif',
        },
        fontSize: {
          small: '12px',
          medium: '14px',
          large: '16px',
          xl: '20px',
        },
      },
      isActive: true,
    });
    console.log('✅ Theme configuration seeded');

    // Seed feature flags
    const featuresConfig = await DynamicConfig.create({
      configKey: 'features',
      configType: 'feature',
      description: 'Feature flags for enabling/disabling features',
      features: {
        enableBlog: true,
        enableTestimonials: true,
        enableNewsLetter: true,
        enableSocialSharing: true,
        enableChat: true,
        maintenanceMode: false,
      },
      isActive: true,
    });
    console.log('✅ Feature flags seeded');

    // Seed API configuration
    const apiConfig = await DynamicConfig.create({
      configKey: 'api',
      configType: 'other',
      description: 'API configuration settings',
      apiConfig: {
        rateLimit: 100,
        cacheTTL: 3600,
        enableCORS: true,
      },
      isActive: true,
    });
    console.log('✅ API configuration seeded');

    // Seed SEO configuration
    const seoConfig = await DynamicConfig.create({
      configKey: 'seo',
      configType: 'seo',
      description: 'SEO and brand configuration',
      brand: {
        name: 'Bhumi',
        description: 'Premium Property Marketplace',
        tagline: 'Find Your Dream Property',
        website: 'https://bhumi.com',
      },
      seoConfig: {
        siteName: 'Bhumi',
        siteDescription: 'Discover premium properties across India',
        defaultMetaKeywords: ['property', 'real estate', 'listings', 'homes', 'apartments'],
        socialMedia: {
          facebook: 'https://facebook.com/bhumi',
          twitter: 'https://twitter.com/bhumi',
          instagram: 'https://instagram.com/bhumi',
          linkedin: 'https://linkedin.com/company/bhumi',
        },
      },
      isActive: true,
    });
    console.log('✅ SEO configuration seeded');

    // Seed email configuration
    const emailConfig = await DynamicConfig.create({
      configKey: 'email',
      configType: 'email',
      description: 'Email service configuration',
      emailConfig: {
        fromEmail: process.env.EMAIL_FROM || 'noreply@bhumi.com',
        fromName: 'Bhumi',
        replyTo: 'support@bhumi.com',
      },
      isActive: true,
    });
    console.log('✅ Email configuration seeded');

    console.log('\n✅ All configurations seeded successfully!');
    console.log('\n📊 Seeded Configurations:');
    console.log('- Theme Settings (colors, fonts, sizes)');
    console.log('- Feature Flags (blog, chat, newsletter, etc.)');
    console.log('- API Settings (rate limiting, caching)');
    console.log('- SEO & Brand Information');
    console.log('- Email Configuration');
    console.log('\n💡 Next steps:');
    console.log('1. Create pages with /api/pages endpoint');
    console.log('2. Upload images with /api/media/upload endpoint');
    console.log('3. Create content blocks with /api/content-blocks endpoint');
    console.log('4. Test APIs with Postman or curl');

  } catch (error) {
    console.error('❌ Seeding error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

const main = async () => {
  await connectDB();
  await seedConfigs();
};

main();
