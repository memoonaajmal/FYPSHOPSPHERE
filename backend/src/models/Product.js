const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true, index: true },
  gender: { type: String, enum: ['Men','Women','Boys','Girls','Unisex'], index: true },
  masterCategory: { type: String, index: true },
  subCategory: { type: String, index: true },
  articleType: { type: String, index: true },
  baseColour: { type: String, index: true },
  season: { type: String, index: true },
  year: { type: Number, index: true },
  usage: { type: String, index: true },
  productDisplayName: { type: String },
  imageFilename: { type: String }
}, { timestamps: true });

ProductSchema.virtual('imageUrl').get(function() {
  if (!this.imageFilename) return null;
  return (process.env.IMAGES_BASE_URL || '/static/images') + '/' + this.imageFilename;
});

ProductSchema.index({ gender: 1, masterCategory: 1, subCategory: 1 });
ProductSchema.index({ baseColour: 1 });
ProductSchema.index({ year: 1 });
ProductSchema.index({ productDisplayName: 'text' });

module.exports = require('mongoose').model('Product', ProductSchema);
