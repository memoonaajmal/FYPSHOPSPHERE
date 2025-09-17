const Product = require('../models/Product');
const { getPagination } = require('../utils/pagination');
const { buildImageUrl } = require('../utils/buildImageUrl');

function buildFilters(qs) {
  const allowed = [
    "gender",
    "masterCategory",
    "subCategory",
    "articleType",
    "baseColour",
    "season",
    "year",
    "usage",
  ];

  const filter = {};

  // ✅ Add allowed direct filters
  for (const key of allowed) {
    if (qs[key]) {
      filter[key] = key === "year" ? Number(qs[key]) : qs[key];
    }
  }

  // ✅ Replace `qs.q` with `qs.search` and use regex (LIKE %keyword%)
  if (qs.search) {
    const regex = new RegExp(qs.search.trim(), "i");
    filter.$or = [
      { productDisplayName: regex },
      { articleType: regex },
      { subCategory: regex },
      { masterCategory: regex },
      { baseColour: regex },
      { usage: regex },
    ];
  }

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
exports.getProducts = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 4,
      sort = "newest",
      category,
      priceMin,
      priceMax,
      search,
      gender,
      masterCategory,
      subCategory,
      baseColour,
      season,
      usage,
      year,
    } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    const where = {};

    if (category) where.subCategory = category;
    if (gender) where.gender = gender;
    if (masterCategory) where.masterCategory = masterCategory;
    if (subCategory) where.subCategory = subCategory;
    if (baseColour) where.baseColour = baseColour;
    if (season) where.season = season;
    if (usage) where.usage = usage;
    if (year) where.year = Number(year);

if (qs.search) {
  const regex = new RegExp(qs.search.trim(), "i");
  filter.$or = [
    { productDisplayName: regex },
    { articleType: regex },
    { subCategory: regex },
    { masterCategory: regex },
    { baseColour: regex },
    { usage: regex },
  ];
}


    if (priceMin || priceMax) {
      where.price = {};
      if (priceMin) where.price.$gte = Number(priceMin);
      if (priceMax) where.price.$lte = Number(priceMax);
    }

    const sortOptions =
      sort === "newest"
        ? { createdAt: -1 }
        : sort === "oldest"
        ? { createdAt: 1 }
        : { productDisplayName: 1 };

    const count = await Product.countDocuments(where);
    let totalPages = Math.ceil(count / limit) || 1;

    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;

    const products = await Product.find(where)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);

    // 🔑 Map products to include image URL
    const productsWithImage = products.map((p) => ({
      ...p.toObject(),
      imageUrl: `${req.protocol}://${req.get("host")}/images/${p.imageFilename}`,
    }));

    res.json({
      data: productsWithImage,
      page,
      total: count,
      totalPages,
      hasNext: page < totalPages,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};