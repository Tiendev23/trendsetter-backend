const Order = require('../models/orderModel');
const OrderDetail = require('../models/orderDetailModel');
const Transaction = require('../models/transactionModel');
const throwError = require('../helpers/errorHelper');
const validateExistence = require('../utils/validates');
const User = require('../models/userModel');

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'username fullName email')
            .populate('transaction')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
/** old getOrdersByUser
exports.getOrdersByUser = async (req, res) => {
    try {
        const user = req.params.user;
        const orders = await Order.find({ user })
            .populate('user', 'username fullName email')
            .populate('transaction')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
 */

/** old getOrderById
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'username fullName email')
            .populate('items.product', 'name price image');
        if (!order) return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
 */

exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'username fullName email')
            .populate('transaction')
            .lean();
        if (!order) return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        const items = await OrderDetail.find({ order: order._id }).lean();

        const enrichedOrder = {
            ...order,
            items
        };
        res.json(enrichedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createOrder = async (req, res) => {
    try {
        const { user, shippingAddress, recipientName, recipientPhone, items, transaction, shippingFee } = req.body;
        if (!user || !shippingAddress || !recipientName || !recipientPhone || !items.length || !shippingFee)
            throwError('Bad Request', 'Thiếu thông tin đơn hàng', 400);
        await validateExistence(User, user);
        await validateExistence(Transaction, transaction);

        const order = await Order.create({
            transaction,
            shippingAddress,
            recipientName,
            recipientPhone,
            shippingFee,
        });
        await Transaction.updateOne(
            { _id: transaction },
            { $set: { order: order._id } },
            { version: false }
        );
        const orderItems = await Promise.all(
            items.map(item => OrderDetail.create({
                order: order._id,
                productVariant: item.variant._id,
                productName: item.name,
                productQuantity: item.quantity,
                productSize: item.variant.size.size,
                productColor: item.variant.color,
                productBasePrice: item.variant.basePrice,
                productFinalPrice: item.variant.finalPrice,
                productImageUrl: item.variant.imageUrl
            }))
        );
        order.set('items', orderItems);
        res.status(201).json({ message: 'Tạo đơn hàng thành công', order });
    } catch (error) {
        const statusCode = error.status || 500;
        res.status(statusCode).json({ message: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
        }
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!order) return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const deletedOrder = await Order.findByIdAndDelete(req.params.id);
        if (!deletedOrder) return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        res.json({ message: 'Đơn hàng đã được xóa' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
