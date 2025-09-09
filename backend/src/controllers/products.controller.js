const Product = require('../models/Product');
const { getPagination } = require('../utils/pagination');
const { buildImageUrl } = require('../utils/buildImageUrl');

function buildFilters(qs) {
  const allowed = ['gender','masterCategory','subCategory','articleType','baseColour','season','year','usage'];
  const filter = {};
  for (const key of allowed) {
    if (qs[key]) filter[key] = key === 'year' ? Number(qs[key]) : qs[key];
  }
  if (qs.q) filter.$text = { $search: qs.q };
  return filter;
}

function projectImage(doc) {
  const obj = doc.toObject({ virtuals: true });
  obj.imageUrl = buildImageUrl(obj.imageFilename);
  return obj;
}

exports.list = async function(req, res, next) {
  try {
    const filter = buildFilters(req.query);
    const { page, limit, skip } = getPagination(req.query);
    const sort = req.query.sort || '';
    const sortObj = {};
    if (sort) {
      for (const token of String(sort).split(',')) {
        const dir = token.startsWith('-') ? -1 : 1;
        const field = token.replace(/^[-+]/, '');
        sortObj[field] = dir;
      }
    } else sortObj.createdAt = -1;

    const [data, total] = await Promise.all([
      Product.find(filter).sort(sortObj).skip(skip).limit(limit),
      Product.countDocuments(filter)
    ]);

    res.json({ data: data.map(projectImage), page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.getOne = async function(req, res, next) {
  try {
    const product = await Product.findOne({ productId: req.params.productId });
    if (!product) return res.status(404).json({ error: { message: 'Product not found', code: 'NOT_FOUND' }});
    res.json(projectImage(product));
  } catch (err) { next(err); }
};

exports.create = async function(req, res, next) {
  try {
    const created = await Product.create(req.body);
    res.status(201).json(projectImage(created));
  } catch (err) { next(err); }
};

exports.update = async function(req, res, next) {
  try {
    const updated = await Product.findOneAndUpdate({ productId: req.params.productId }, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: { message: 'Product not found', code: 'NOT_FOUND' }});
    res.json(projectImage(updated));
  } catch (err) { next(err); }
};

exports.remove = async function(req, res, next) {
  try {
    const deleted = await Product.findOneAndDelete({ productId: req.params.productId });
    if (!deleted) return res.status(404).json({ error: { message: 'Product not found', code: 'NOT_FOUND' }});
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};
