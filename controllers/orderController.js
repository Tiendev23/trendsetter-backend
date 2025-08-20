
const { withTransaction } = require('../helpers/dbTransaction');
const { throwError, resError } = require('../helpers/errorHelper');
const { getEnrichedOrders } = require('../helpers/orderHelper');
const Model = require('../models');
const { cancelOrder } = require('../services/order.service');
const { validateExistence } = require('../utils/validates');

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Model.Order.find()
            .populate('user', 'username fullName email')
            .populate('transaction', '-metadata')
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
        const orderId = await validateExistence(Model.Order, req.params.orderId);
        const order = await Model.Order.findById(orderId)
            .populate([
                {
                    path: 'user',
                    select: 'fullName username email avatar'
                },
                {
                    path: 'transaction',
                    select: '-user -order -__v'
                }
            ])
            .lean();

        const [enrichedOrder] = await getEnrichedOrders([order], order.user._id);

        res.json({ data: enrichedOrder });
    } catch (err) {
        resError(res, err, {
            defaultCode: "ORD.GET_DETAIL",
            defaultMessage: "Lấy dữ liệu đơn hàng thất bại"
        });
    }
};

exports.createOrder = async (req, res) => {
    try {
        const { user, shippingAddress, recipientName, recipientPhone, items, transaction, shippingFee } = req.body;
        if (!user || !shippingAddress || !recipientName || !recipientPhone || !items.length || !shippingFee)
            throwError('ORD.CREATE', 'Thiếu thông tin đơn hàng', 400);
        await validateExistence(Model.User, user);
        await validateExistence(Model.Transaction, transaction);

        const order = await Model.Order.create({
            transaction,
            shippingAddress,
            recipientName,
            recipientPhone,
            shippingFee,
        });
        await Model.Transaction.updateOne(
            { _id: transaction },
            { $set: { order: order._id } },
            { version: false }
        );
        const orderItems = await Promise.all(
            items.map(item => Model.OrderItem.create({
                order: order._id,
                variant: item.variant,
                size: item.size._id,
                campaign: item.campaign,
                name: item.name,
                color: item.color,
                basePrice: item.basePrice,
                finalPrice: item.finalPrice,
                imageUrl: item.imageUrl,
                quantity: item.quantity,
            }))
        );
        order.set('items', orderItems);
        res.status(201).json({ message: 'Tạo đơn hàng thành công', order });
    } catch (err) {
        resError(res, err, {
            defaultCode: "ORD.CREATE",
            defaultMessage: "Tạo đơn hàng thất bại"
        });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
        }
        const order = await Model.Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!order) return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const deletedOrder = await Model.Order.findByIdAndDelete(req.params.id);
        if (!deletedOrder) return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        res.json({ message: 'Đơn hàng đã được xóa' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const A_DAY = 1000 * 60 * 60 * 24;
exports.cancelOrderById = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        const cancelledOrder = await withTransaction(async session => {
            const order = await Model.Order.findById(orderId)
                .populate('transaction')
                .session(session);

            const isOverOneDay = Date.now() > new Date(order.createdAt).getTime() + A_DAY;
            if (order.status === 'delivered' || isOverOneDay) {
                throwError('ORD.CANCEL', 'Đơn hàng không thể hủy ở trạng thái hiện tại', 400);
            }

            if (['confirmed', 'shipping'].includes(order.status)) {
                const orderItems = await Model.OrderItem.find({ order: order._id }).session(session);
                for (const item of orderItems) {
                    await Model.VariantSize.findOneAndUpdate(
                        { _id: item.size },
                        { $inc: { stock: item.quantity } },
                        { session }
                    );
                }
            }
            order.status = 'cancelled';
            await order.save({ session });
            return await order.populate('transaction');
        });

        res.json({ message: 'Đơn hàng đã được hủy thành công', data: cancelledOrder });
    } catch (err) {
        resError(res, err, {
            defaultCode: "ORD.CANCEL",
            defaultMessage: "Huỷ đơn hàng thất bại"
        });
    }
};
