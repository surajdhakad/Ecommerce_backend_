const mongoose = require("mongoose")

const mongoDbUrl = 'mongodb+srv://Suraj034:4dgMVnpiOEaa7mDo@ecomerce.zeslu58.mongodb.net/?retryWrites=true&w=majority'
const connectDb = () => {
    return mongoose.connect(mongoDbUrl)
}

module.exports = { connectDb }