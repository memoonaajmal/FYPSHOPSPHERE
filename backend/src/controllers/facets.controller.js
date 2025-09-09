const Product = require('../models/Product');

exports.facets = async function(req, res, next) {
  try {
    const pipeline = [{
      $facet: {
        gender: [{ $group: { _id: '$gender', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        masterCategory: [{ $group: { _id: '$masterCategory', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        subCategory: [{ $group: { _id: '$subCategory', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        articleType: [{ $group: { _id: '$articleType', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        baseColour: [{ $group: { _id: '$baseColour', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        season: [{ $group: { _id: '$season', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        year: [{ $group: { _id: '$year', count: { $sum: 1 } } }, { $sort: { _id: -1 } }],
        usage: [{ $group: { _id: '$usage', count: { $sum: 1 } } }, { $sort: { count: -1 } }]
      }
    }];

    const [result] = await Product.aggregate(pipeline);
    const normalize = arr => (arr || []).filter(x => x._id !== null && x._id !== '').map(x => ({ value: x._id, count: x.count }));
    res.json(Object.fromEntries(Object.entries(result).map(([k,v]) => [k, normalize(v)])));
  } catch (err) { next(err); }
};
