const Category = require('../models/categoryModel');


exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().populate('parent').sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getLevelOneCategories = async (req, res) => {
    try {
        const categories = await Category.find({ parent: null }).sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSubCategories = async (req, res) => {
    try {
        const subCategories = await Category.find({ parent: req.params.parentId }).sort({ name: 1 });
        res.json(subCategories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, parent } = req.body;
        const category = new Category({ name, parent: parent || null });
        const savedCategory = await category.save();
        res.status(201).json(savedCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { name, parent } = req.body;
        const updateData = { name, parent: parent || null };
        const updatedCategory = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updatedCategory) return res.status(404).json({ message: 'Category not found' });
        res.json(updatedCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const deleted = await Category.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Category not found' });
        res.json({ message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
