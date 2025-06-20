const Order = require('../models/orderModel');

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'username fullName email')
            .populate('items.product', 'name price image')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

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

exports.createOrder = async (req, res) => {
    try {
        const { user, items, totalPrice, shippingAddress, status } = req.body;
        if (!user || !items || !totalPrice || !shippingAddress) {
            return res.status(400).json({ message: 'Thiếu thông tin đơn hàng' });
        }

        const order = new Order({ user, items, totalPrice, shippingAddress, status });
        const savedOrder = await order.save();
        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
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
