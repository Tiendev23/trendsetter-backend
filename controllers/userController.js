
const { resError, throwError } = require('../helpers/errorHelper');
const { getEnrichedVariants, getEnrichedCartItems } = require('../helpers/productHelper');
const { applyProfileUpdates, updateDefaultMark } = require('../helpers/userHelper');
const { User, CartItem, Order, VariantSize, OrderItem, ProductVariant, Favorite, Address } = require('../models');
const { validateExistence } = require('../utils/validates');

exports.getAllUsers = async (req, res) => {
    try {
        // const users = await User.find({}, '-password').sort({ createdAt: -1 });
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        const status = error.statusCode || 500;
        res.status(status).json({ message: error.message });
    }
};

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
    } catch (err) {
        const status = error.statusCode || 500;
        res.status(status).json({ message: error.message });
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
    } catch (err) {
        const status = error.statusCode || 500;
        res.status(status).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: 'User không tồn tại' });
        res.json({ message: 'User đã được xóa' });
    } catch (err) {
        const status = error.statusCode || 500;
        res.status(status).json({ message: error.message });
    }
};

exports.getUserFavorites = async (req, res) => {
    try {
        const userId = await validateExistence(User, req.params.userId);
        const variantIds = (await Favorite.find({ user: userId })
            .select('variant -_id'))
            .map(doc => doc.variant);
        const filter = { _id: { $in: variantIds } };
        const enrichedVariants = await getEnrichedVariants(filter);

        res.json({ data: enrichedVariants });
    } catch (err) {
        resError(res, err, {
            defaultCode: "FAV.FETCH",
            defaultMessage: "Lấy dữ liệu yêu thích thất bại"
        })
    }
};

exports.addFavorite = async (req, res) => {
    try {
        const userId = await validateExistence(User, req.params.userId);
        const variantId = await validateExistence(ProductVariant, req.body.variantId);

        await Favorite.create({
            user: userId,
            variant: variantId,
        });

        res.json({ message: 'Đã thêm sản phẩm vào yêu thích' });
    } catch (err) {
        resError(res, err, {
            defaultCode: "FAV.ADD",
            defaultMessage: "Thêm sản phẩm vào yêu thích thất bại"
        })
    }
};

exports.removeFavorite = async (req, res) => {
    try {
        const userId = await validateExistence(User, req.params.userId);
        const variantId = await validateExistence(ProductVariant, req.params.variantId);

        await Favorite.findOneAndDelete({
            user: userId,
            variant: variantId,
        })

        res.json({ message: 'Đã xóa sản phẩm khỏi yêu thích' });
    } catch (err) {
        resError(res, err, {
            defaultCode: "FAV.REMOVE",
            defaultMessage: "Xoá sản phẩm yêu thích thất bại"
        })
    }
};

exports.getUserAddresses = async (req, res) => {
    try {
        const userId = await validateExistence(User, req.params.userId);

        const addresses = await Address.find({ user: userId })
            .sort({ isDefault: -1 })
            .select("-__v")
            .lean();

        res.json({ data: addresses });
    } catch (err) {
        resError(res, err, {
            defaultCode: "ADDR.FETCH_ALL",
            defaultMessage: "Lấy dữ liệu thất bại"
        })
    }
};

exports.addShippingAddress = async (req, res) => {
    try {
        const userId = await validateExistence(User, req.params.userId);
        const { fullName, phone, street, ward, province, isDefault } = req.body;

        if (isDefault)
            await Address.updateMany({ user: userId, isDefault: true }, { isDefault: false });

        await Address.create({
            user: userId,
            fullName,
            phone,
            street,
            ward,
            province,
            isDefault
        });

        const addresses = await Address.find({ user: userId })
            .sort({ isDefault: -1 })
            .select("-__v")
            .lean();

        res.json({ message: 'Đã thêm mới địa chỉ giao hàng', data: addresses });
    } catch (err) {
        resError(res, err, {
            defaultCode: "ADDR.ADD",
            defaultMessage: "Thêm địa chỉ mới thất bại"
        })
    }
};

exports.updateShippingAddress = async (req, res) => {
    try {
        const userId = await validateExistence(User, req.params.userId);
        const addressId = await validateExistence(Address, req.params.addressId)
        const { fullName, phone, street, ward, province, isDefault } = req.body;

        if (isDefault) {
            await Address.updateMany(
                { user: userId, isDefault: true, _id: { $ne: addressId } },
                { isDefault: false }
            );
        }

        await Address.findOneAndUpdate({
            _id: addressId, user: userId
        }, {
            fullName,
            phone,
            street,
            ward,
            province,
            isDefault
        }, { new: true });

        const addresses = await Address.find({ user: userId })
            .sort({ isDefault: -1 })
            .select("-__v")
            .lean();

        res.json({ message: 'Đã cập nhật địa chỉ giao hàng', data: addresses });
    } catch (err) {
        resError(res, err, {
            defaultCode: "ADDR.UPDATE",
            defaultMessage: "Cập nhật địa chỉ thất bại"
        })
    }
};

exports.removeShippingAddress = async (req, res) => {
    try {
        const userId = await validateExistence(User, req.params.userId);
        const addressId = await validateExistence(Address, req.params.addressId);

        const address = await Address.findOne({ _id: addressId, user: userId });
        if (!address) throwError('ADDR.REMOVE', 'Địa chỉ không thuộc người dùng này', 403);
        await address.deleteOne();

        const addresses = await Address.find({ user: userId })
            .sort({ isDefault: -1 })
            .select("-__v")
            .lean();

        res.json({ message: 'Đã xóa địa chỉ giao hàng', data: addresses });
    } catch (err) {
        resError(res, err, {
            defaultCode: "ADDR.REMOVE",
            defaultMessage: "Xoá địa chỉ thất bại"
        })
    }
};

exports.getUserCart = async (req, res) => {
    try {
        const userId = await validateExistence(User, req.params.userId);
        const items = await CartItem.find({ user: userId });
        const enrichedItems = await getEnrichedCartItems({ _id: { $in: items.map(item => item._id) } });
        res.json({ data: enrichedItems });
    } catch (err) {
        resError(res, err, {
            defaultCode: "CART.FETCH_ALL",
            defaultMessage: "Lấy giỏ hàng thất bại"
        })
    }
};

exports.addOrUpdateCartItem = async (req, res) => {
    try {
        const userId = await validateExistence(User, req.params.userId);
        const sizeId = await validateExistence(VariantSize, req.body.sizeId);
        const quantity = req.body.quantity;

        const updatedItem = await CartItem.findOneAndUpdate(
            { user: userId, variantSize: sizeId },
            { $inc: { quantity } },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        );

        res.status(200).json({ data: updatedItem });
    } catch (err) {
        resError(res, err, {
            defaultCode: "CART.ADD_ITEM",
            defaultMessage: "Thêm sản phẩm thất bại"
        })
    }
};

exports.updateCartItem = async (req, res) => {
    try {
        const userId = await validateExistence(User, req.params.userId);
        const sizeId = await validateExistence(VariantSize, req.params.sizeId);

        const updatedItem = await CartItem.findOneAndUpdate(
            { user: userId, variantSize: sizeId },
            { quantity: req.body.quantity },
            { new: true }
        );
        if (!updatedItem) {
            throwError('CART.UPDATE_ITEM', 'Sản phẩm không tồn tại trong giỏ hàng', 404);
        }

        res.status(200).json({ data: updatedItem });
    } catch (err) {
        resError(res, err, {
            defaultCode: "CART.UPDATE_ITEM",
            defaultMessage: "Cập nhật sản phẩm thất bại"
        })
    }
};

exports.removeCartItem = async (req, res) => {
    try {
        const userId = await validateExistence(User, req.params.userId);
        const sizeId = await validateExistence(VariantSize, req.params.sizeId);

        const deletedItem = await CartItem.findOneAndDelete({ variantSize: sizeId, user: userId });
        if (!deletedItem) {
            throwError('CART.REMOVE_ITEM', 'Sản phẩm không tồn tại trong giỏ hàng', 404);
        }

        res.json({ data: deletedItem });
    } catch (err) {
        resError(res, err, {
            defaultCode: "CART.REMOVE_ITEM",
            defaultMessage: "Xoá sản phẩm thất bại"
        })
    }
};

exports.removeManyCartItem = async (req, res) => {
    try {
        const userId = await validateExistence(User, req.params.userId);

        const sizeIds = req.body;

        if (!Array.isArray(sizeIds) || sizeIds.length === 0)
            throwError("CART.REMOVE_MANY", "Danh sách sizeIds không hợp lệ", 400);
        await Promise.all(sizeIds.map(id => validateExistence(VariantSize, id)));

        await CartItem.deleteMany({
            user: userId,
            variantSize: { $in: sizeIds }
        });

        const updatedCart = await CartItem.find({ user: userId });
        const enrichedItems = await getEnrichedCartItems({ _id: { $in: updatedCart.map(item => item._id) } });

        res.json({ data: enrichedItems });
    } catch (err) {
        console.log('err', err);

        resError(res, err, {
            defaultCode: "CART.REMOVE_MANY",
            defaultMessage: "Xoá nhiều sản phẩm thất bại"
        });
    }
};

exports.clearCart = async (req, res) => {
    try {
        const userId = await validateExistence(User, req.params.userId);

        await CartItem.deleteMany({ user: userId });
        const updatedCart = await CartItem.find({ user: userId });
        const enrichedItems = await getEnrichedCartItems({ _id: { $in: updatedCart.map(item => item._id) } });

        res.json({ data: enrichedItems });
    } catch (err) {
        resError(res, err, {
            defaultCode: "CART.CLEAR_CART",
            defaultMessage: "Xoá giỏ hàng thất bại"
        })
    }
};

exports.syncCart = async (req, res) => {
    try {
        const userId = await validateExistence(User, req.params.userId);
        const incomingItems = req.body; // [{ sizeId, quantity }]

        // Validate tất cả sizeId một lần
        const sizeIds = incomingItems.map(item => item.sizeId);

        const validSizes = await VariantSize.find({ _id: { $in: sizeIds } }).select('_id');
        const validSizeSet = new Set(validSizes.map(s => s._id.toString()));

        // Lọc ra các item hợp lệ
        const filteredItems = incomingItems.filter(item => validSizeSet.has(item.sizeId));

        // Tạo map từ sizeId → quantity
        const incomingMap = new Map();
        filteredItems.forEach(item => {
            incomingMap.set(item.sizeId, item.quantity);
        });

        // Lấy cart hiện tại
        const existingItems = await CartItem.find({ user: userId });

        // Merge logic
        const mergedMap = new Map();

        // Ưu tiên quantity từ incoming nếu trùng
        existingItems.forEach(item => {
            const sizeId = item.variantSize.toString();
            const quantity = incomingMap.has(sizeId) ? incomingMap.get(sizeId) : item.quantity;
            mergedMap.set(sizeId, quantity);
            incomingMap.delete(sizeId);
        });

        // Thêm các item mới chưa có trong cart
        incomingMap.forEach((quantity, sizeId) => {
            mergedMap.set(sizeId, quantity);
        });

        // Xoá toàn bộ cart cũ và ghi lại
        await CartItem.deleteMany({ user: userId });

        const mergedItems = Array.from(mergedMap.entries()).map(([sizeId, quantity]) => ({
            user: userId,
            variantSize: sizeId,
            quantity
        }));

        await CartItem.insertMany(mergedItems);

        const updatedCart = await CartItem.find({ user: userId });
        const enrichedItems = await getEnrichedCartItems({ _id: { $in: updatedCart.map(item => item._id) } });
        res.status(200).json({ data: enrichedItems });
    } catch (err) {
        resError(res, err, {
            defaultCode: "CART.SYNC_CART",
            defaultMessage: "Đồng bộ giỏ hàng thất bại"
        })
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = await validateExistence(User, req.params.userId);
        const props = req.body; // props là { username, fullName, gender, birthday }
        const avatar = req.files?.avatar?.[0] || null;
        const user = await User.findById(userId);

        const updated = await applyProfileUpdates(user, props, avatar);
        res.json({
            message: 'Cập nhật thông tin thành công',
            user: updated
        });
    } catch (err) {
        const status = err.statusCode || 500;
        res.status(status).json({ message: err.message });
    }
};

exports.getOrdersById = async (req, res) => {
    try {
        const user = await validateExistence(User, req.params.userId);
        const orders = await Order.find({ user })
            .populate('user', 'username fullName email')
            .populate('transaction', 'amount paymentMethod providerTransactionId status')
            .sort({ createdAt: -1 })
            .lean();

        const enrichedOrders = await Promise.all(orders.map(async order => {
            const items = await OrderItem.find({ order: order._id }).lean();
            return {
                ...order,
                items
            };
        }));

        res.json({ data: enrichedOrders });
    } catch (err) {
        resError(res, err, {
            defaultCode: "ORD.FETCH_BY_USR",
            defaultMessage: "Lấy danh sách đơn hàng thất bại"
        })
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
