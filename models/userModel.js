
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
    avatar: {
        type: String,
        default: 'https://example.com/default-avatar.png'
        // default: 'https://res.cloudinary.com/trendsetter-app/image/upload/v1752860727/default-avatar.webp'
    },
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
