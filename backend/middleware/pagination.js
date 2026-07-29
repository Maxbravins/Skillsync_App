export const paginate = (model) => {
  return async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await model.countDocuments();
    const pages = Math.ceil(total / limit);

    req.pagination = {
      page,
      limit,
      skip,
      total,
      pages,
    };

    next();
  };
};