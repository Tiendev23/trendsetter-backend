const User = require('../models/userModel');
const Order = require('../models/orderModel');
const OrderDetail = require('../models/orderDetailModel');
const { getEnrichedVariants } = require('../helpers/enrichVariant');
const { applyProfileUpdates, updateDefaultMark } = require('../helpers/userHelper');

exports.getAllUsers = async (req, res) => {
    try {
        // const users = await User.find({}, '-password').sort({ createdAt: -1 });
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// register api
exports.createUser = async (req, res) => {
    try {
        const { username, password, email, fullName, role } = req.body;

        // Kiểm tra username hoặc email tồn tại
        const existUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existUser) {
            return res.status(400).json({ message: 'Tên đăng nhập hoặc email đã tồn tại' });
        }

        const user = new User({ username, password, email, fullName, role });
        const savedUser = await user.save();
        const userData = savedUser.toObject();
        delete userData.password;
        res.status(201).json(userData);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { username, password, email, fullName, role } = req.body;

        const updateData = { username, email, fullName, role };
        if (password) updateData.password = password; // Mật khẩu sẽ được hash bởi pre save

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User không tồn tại' });

        Object.assign(user, updateData);
        const savedUser = await user.save();

        const userData = savedUser.toObject();
        delete userData.password;
        res.json(userData);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: 'User không tồn tại' });
        res.json({ message: 'User đã được xóa' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.getUserFavorites = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User không tồn tại' });
        const filter = { _id: { $in: user.favorites } };
        const enrichedVariants = await getEnrichedVariants(filter);

        res.json(enrichedVariants);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addFavorite = async (req, res) => {
    try {
        const userId = req.params.id;
        const variantId = req.body.variantId;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User không tồn tại' });

        if (!user.favorites.includes(variantId)) {
            user.favorites.push(variantId);
            await user.save();
        }
        res.json({ message: 'Đã thêm sản phẩm vào yêu thích', favorite: variantId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.removeFavorite = async (req, res) => {
    try {
        const userId = req.params.userId;
        const variantId = req.params.variantId;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User không tồn tại' });
        user.favorites = user.favorites.filter(id => id.toString() !== variantId);
        await user.save();
        res.json({ message: 'Đã xóa sản phẩm khỏi yêu thích' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUserAddresses = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User không tồn tại' });
        const {addressId} = req.query;
        if (addressId) {
            const address = user.shippingAddresses.find(addr => addr._id.toString() === addressId);
            if (!address) return res.status(404).json({message:"Không tìm thấy địa chỉ này"});
            return res.json(address);
        }
        res.json(user.shippingAddresses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addShippingAddress = async (req, res) => {
    try {
        const userId = req.params.id;
        const address = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User không tồn tại' });
        updateDefaultMark(user, address.isDefault);

        user.shippingAddresses.push(address);
        await user.save();

        res.json({ message: 'Đã thêm mới địa chỉ giao hàng', address });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateShippingAddress = async (req, res) => {
    try {
        const userId = req.params.userId;
        const addressId = req.params.addressId
        const { fullName, phone, streetDetails, ward, district, city, isDefault } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User không tồn tại' });

        const address = user.shippingAddresses.find(a => a._id.toString() === addressId);
        if (!address) return res.status(404).json({ message: 'Địa chỉ không tồn tại' });
        address.fullName = fullName;
        address.phone = phone;
        address.streetDetails = streetDetails;
        address.ward = ward;
        address.district = district;
        address.city = city;
        updateDefaultMark(user, isDefault);
        address.isDefault = isDefault;

        await user.save();
        res.json({ message: 'Đã cập nhật địa chỉ giao hàng', address});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.removeShippingAddress = async (req, res) => {
    try {
        const userId = req.params.userId;
        const addressId = req.params.addressId;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User không tồn tại' });
        user.shippingAddresses = user.shippingAddresses
            .filter(address => address._id.toString() !== addressId);
        await user.save();
        res.json({ message: 'Đã xóa địa chỉ giao hàng' });
    } catch (error) {
        res.status(500).json({ message: error.message }); s
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const props = req.body; // props là { username, fullName, gender, birthday }
        const avatar = req.files?.avatar?.[0] || null;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User không tồn tại' });
        const updated = await applyProfileUpdates(user, props, avatar);
        res.json({
            message: 'Cập nhật thông tin thành công',
            user: updated
        });
    } catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ message: error.message });
    }
};

exports.getOrdersById = async (req, res) => {
    try {
        const user = req.params.userId;
        const orders = await Order.find({ user })
            .populate('user', 'username fullName email')
            .populate('transaction')
            .sort({ createdAt: -1 })
            .lean();

        const enrichedOrders = await Promise.all(orders.map(async order => {
            const items = await OrderDetail.find({ order: order._id }).lean();
            return {
                ...order,
                items
            };
        }));

        res.json(enrichedOrders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// verify password
exports.verifyPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu không đúng' });
        }

        res.json({ message: 'Xác thực thành công' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// changePassword
exports.changePassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
