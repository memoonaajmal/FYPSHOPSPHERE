exports.buildImageUrl = function(imageFilename) {
  if (!imageFilename) return null;
  return (process.env.IMAGES_BASE_URL || '/static/images') + '/' + imageFilename;
};
