const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const { LOCAL_URI, MONGO_URI } = require('./config');

const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const brandRoutes = require('./routes/brandRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
// Thanh toán
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// app.use(express.json());
app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Serve thư mục uploads để truy cập ảnh upload
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Phân tích JSON body
app.use(bodyParser.json());

// Kết nối MongoDB (thay đổi chuỗi kết nối phù hợp)
mongoose.connect(LOCAL_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Mount route
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
// Cho thanh toán
app.use('/api/payments', paymentRoutes);

// Lắng nghe server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
