/**
 * Seed script for UI Configuration
 * Run: node seed-ui-config.js
 * This populates the database with all configurable UI elements
 */

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const UIConfig = require("./models/uiConfigModel");
const SystemConfig = require("./models/systemConfigModel");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/bhumi";

// Define all UI configuration keys
const UI_CONFIG_KEYS = [
  // Header & Logo
  {
    configKey: "APP_LOGO_URL",
    configValue: "https://via.placeholder.com/150x50?text=Bhoomi+Wala",
    description: "Main logo URL shown in header",
    category: "layout",
  },
  {
    configKey: "APP_NAME",
    configValue: "Bhoomi Wala",
    description: "Application name",
    category: "layout",
  },
  {
    configKey: "APP_TAGLINE",
    configValue: "The easiest way to find, buy, and invest in your dream land.",
    description: "App tagline shown in footer and home",
    category: "layout",
  },

  // Home/Hero Section
  {
    configKey: "HERO_HEADING_MAIN",
    configValue: "Your Piece of",
    description: "Main hero heading - part 1",
    category: "layout",
  },
  {
    configKey: "HERO_HEADING_HIGHLIGHT",
    configValue: "Earth Awaits",
    description: "Main hero heading - highlighted part",
    category: "layout",
  },
  {
    configKey: "HERO_SUBHEADING",
    configValue: "Discover premium land investments in Indore. More valuable than gold, more lasting than time.",
    description: "Hero section subheading",
    category: "layout",
  },
  {
    configKey: "HERO_IMAGE_1",
    configValue: "https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=1920",
    description: "Home hero carousel image 1",
    category: "layout",
  },
  {
    configKey: "HERO_IMAGE_2",
    configValue: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=1920",
    description: "Home hero carousel image 2",
    category: "layout",
  },
  {
    configKey: "HERO_IMAGE_3",
    configValue: "https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?q=80&w=1920",
    description: "Home hero carousel image 3",
    category: "layout",
  },

  // CTA Buttons
  {
    configKey: "BTN_EXPLORE_PROPERTIES",
    configValue: "Explore Properties",
    description: "Explore properties button label",
    category: "layout",
  },
  {
    configKey: "BTN_CONTACT_US",
    configValue: "Contact Us",
    description: "Contact us button label",
    category: "layout",
  },
  {
    configKey: "BTN_POST_PROPERTY",
    configValue: "Post Your Property",
    description: "Post property button label",
    category: "layout",
  },

  // Footer
  {
    configKey: "FOOTER_COPYRIGHT_TEXT",
    configValue: "&copy; 2024 Bhoomi Wala. All rights reserved.",
    description: "Footer copyright text",
    category: "layout",
  },
  {
    configKey: "FOOTER_EMAIL",
    configValue: "info@1bigha.com",
    description: "Footer contact email",
    category: "layout",
  },
  {
    configKey: "FOOTER_PHONE",
    configValue: "+91 9039055488",
    description: "Footer contact phone",
    category: "layout",
  },
  {
    configKey: "FOOTER_ADDRESS",
    configValue: "Gwali Palasia, Mhow Indore, M.P.",
    description: "Footer address",
    category: "layout",
  },

  // Social Media Icons
  {
    configKey: "SOCIAL_INSTAGRAM_URL",
    configValue: "https://instagram.com",
    description: "Instagram link",
    category: "layout",
  },
  {
    configKey: "SOCIAL_FACEBOOK_URL",
    configValue: "https://facebook.com",
    description: "Facebook link",
    category: "layout",
  },
  {
    configKey: "SOCIAL_WHATSAPP_URL",
    configValue: "https://whatsapp.com",
    description: "WhatsApp link",
    category: "layout",
  },
  {
    configKey: "SOCIAL_YOUTUBE_URL",
    configValue: "https://youtube.com",
    description: "YouTube link",
    category: "layout",
  },

  // Theme Colors (Optional)
  {
    configKey: "PRIMARY_COLOR",
    configValue: "#10b981",
    description: "Primary brand color",
    category: "theme",
  },
  {
    configKey: "SECONDARY_COLOR",
    configValue: "#059669",
    description: "Secondary brand color",
    category: "theme",
  },

  // Feature Flags (Optional)
  {
    configKey: "SHOW_BANNER_ANNOUNCEMENT",
    configValue: true,
    description: "Show promotional banner on home",
    category: "feature",
  },
  {
    configKey: "ENABLE_RENT_PROPERTIES",
    configValue: true,
    description: "Enable rent property listings",
    category: "feature",
  },
];

async function seedUIConfig() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing UI configs (optional - comment out to keep existing data)
    // await UIConfig.deleteMany({});
    // console.log("🗑️  Cleared existing UI configs");

    // Seed UI configs
    const upsertedConfigs = [];
    for (const config of UI_CONFIG_KEYS) {
      const result = await UIConfig.findOneAndUpdate(
        { configKey: config.configKey },
        config,
        { upsert: true, new: true, runValidators: true }
      );
      upsertedConfigs.push(result.configKey);
    }

    console.log(`✅ Seeded ${upsertedConfigs.length} UI configurations`);
    console.log("Seeded keys:", upsertedConfigs.join(", "));

    // Verify by fetching all
    const allConfigs = await UIConfig.find({ isActive: true });
    console.log(`\nTotal active UI configs in DB: ${allConfigs.length}`);

    console.log("\nUI Config seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding UI config:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
}

seedUIConfig();
