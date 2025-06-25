const Category = require("../models/category.model");
const Product = require("../models/product.model");

// Create a new product
async function createProduct(reqData) {
  let topLevel = await Category.findOne({ name: reqData.topLavelCategory });

  if (!topLevel) {
    const topLavelCategory = new Category({
      name: reqData.topLavelCategory,
      level: 1,
    });
    topLevel = await topLavelCategory.save();
  }

  let secondLevel = await Category.findOne({
    name: reqData.secondLavelCategory,
    parentCategory: topLevel._id,
  });

  if (!secondLevel) {
    const secondLavelCategory = new Category({
      name: reqData.secondLavelCategory,
      parentCategory: topLevel._id,
      level: 2,
    });
    secondLevel = await secondLavelCategory.save();
  }

  let thirdLevel = await Category.findOne({
    name: reqData.thirdLavelCategory,
    parentCategory: secondLevel._id,
  });

  if (!thirdLevel) {
    const thirdLavelCategory = new Category({
      name: reqData.thirdLavelCategory,
      parentCategory: secondLevel._id,
      level: 3,
    });
    thirdLevel = await thirdLavelCategory.save();
  }

  const product = new Product({
    title: reqData.title,
    color: reqData.color,
    description: reqData.description,
    discountedPrice: reqData.discountedPrice,
    discountPersent: reqData.discountPersent,
    imageUrl: reqData.imageUrl,
    brand: reqData.brand,
    price: reqData.price,
    sizes: reqData.size,
    quantity: reqData.quantity,
    category: thirdLevel._id,
  });

  return await product.save();
}

// Delete a product by ID
async function deleteProduct(productId) {
  const product = await findProductById(productId);
  if (!product) throw new Error("Product not found with id - " + productId);
  await Product.findByIdAndDelete(productId);
  return "Product deleted successfully";
}

// Update a product by ID
async function updateProduct(productId, reqData) {
  return await Product.findByIdAndUpdate(productId, reqData, { new: true });
}

// Find a product by ID
async function findProductById(id) {
  const product = await Product.findById(id).populate("category").exec();
  if (!product) throw new Error("Product not found with id " + id);
  return product;
}

// Get all products with filtering and pagination
async function getAllProducts(reqQuery) {
  let {
    category,
    colors = [],
    sizes = [],
    minPrice = 0,
    maxPrice = 100000,
    minDiscount = 0,
    sort = "price_low",
    stock,
    pageNumber = 1,
    pageSize = 10,
  } = reqQuery;

  pageNumber = parseInt(pageNumber);
  pageSize = parseInt(pageSize);

  const filter = {};

  // Handle category filter (case-insensitive match)
  if (category) {
    const existCategory = await Category.findOne({
      name: new RegExp(`^${category}$`, "i"),
    });
    if (existCategory) {
      filter.category = existCategory._id;
    } else {
      return { content: [], currentPage: pageNumber, totalPages: 1 };
    }
  }

  // Parse colors (ensure it's array if passed as comma string)
  if (typeof colors === "string") {
    colors = colors.split(",").map((c) => c.trim());
  }
  if (colors.length > 0) {
    filter.color = { $in: colors };
  }

  // Parse sizes (ensure it's array if passed as comma string)
  if (typeof sizes === "string") {
    sizes = sizes.split(",").map((s) => s.trim());
  }
  if (sizes.length > 0) {
    filter["sizes.name"] = { $in: sizes };
  }

  // Price filter
  filter.discountedPrice = { $gte: minPrice, $lte: maxPrice };

  // Discount filter
  if (minDiscount > 0) {
    filter.discountPersent = { $gte: minDiscount };
  }

  // Stock
  if (stock === "in_stock") {
    filter.quantity = { $gt: 0 };
  } else if (stock === "out_of_stock") {
    filter.quantity = { $eq: 0 };
  }

  // Sort option
  const sortOption = sort === "price_high" ? { discountedPrice: -1 } : { discountedPrice: 1 };

  const totalProducts = await Product.countDocuments(filter);

  const products = await Product.find(filter)
    .populate("category")
    .sort(sortOption)
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize);

  return {
    content: products,
    currentPage: pageNumber,
    totalPages: Math.ceil(totalProducts / pageSize),
  };
}

// Create multiple products
async function createMultipleProduct(products) {
  for (let product of products) {
    await createProduct(product);
  }
}

module.exports = {
  createProduct,
  deleteProduct,
  updateProduct,
  getAllProducts,
  findProductById,
  createMultipleProduct,
};
