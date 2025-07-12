
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, select: false },
    gender: {
        type: String,
        enum: ['male', 'female', 'unisex'],
        default: 'unisex'
    },
    birthday: {
        type: Date,
        default: null,
    },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    avatar: { type: String, default: 'https://res.cloudinary.com/trendsetter/image/upload/v1752307340/tl_kao2lo.webp' }, // URL mặc định cho avatar
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    shippingAddresses: [
        {
            fullName: { type: String, required: true },
            phone: { type: String, required: true },
            streetDetails: { type: String, required: true },
            ward: { type: String, required: true },
            district: { type: String, required: true },
            city: { type: String, required: true },
            isDefault: { type: Boolean, default: false }
        }
    ]
}, { timestamps: true, optimisticConcurrency: true });


// Mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method so sánh mật khẩu khi login (nếu mở rộng)
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};
module.exports = mongoose.model('User', userSchema);
