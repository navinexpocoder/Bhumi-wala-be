/**
 * One-time helper: set propertyId on MediaAsset documents that were uploaded without it.
 * Matches media ↔ properties in creation order (first media → first property, etc.).
 *
 * Usage (from Property-Sales-BE): node scripts/link-media-property-ids.js
 * Requires MONGODB_URI in .env
 */
require("dotenv").config();
const mongoose = require("mongoose");
const MediaAsset = require("../models/mediaAssetModel");
const Property = require("../models/propertyModel");

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const needLink = await MediaAsset.find({
    tag: "property",
    $or: [{ propertyId: null }, { propertyId: { $exists: false } }],
  })
    .sort({ createdAt: 1 })
    .select("_id")
    .lean();

  const properties = await Property.find({})
    .sort({ createdAt: 1 })
    .select("_id")
    .lean();

  const n = Math.min(needLink.length, properties.length);
  for (let i = 0; i < n; i++) {
    await MediaAsset.updateOne(
      { _id: needLink[i]._id },
      { $set: { propertyId: properties[i]._id } },
    );
  }

  console.log(`Updated ${n} media asset(s) with propertyId (of ${needLink.length} unlinked, ${properties.length} properties).`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
