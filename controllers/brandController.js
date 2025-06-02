const Brand = require('../models/brandModel');

exports.getAllBrands = async (req, res) => {
    try {
        const brands = await Brand.find();
        res.json(brands);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createBrand = async (req, res) => {
    try {
        const { name } = req.body;
        const brand = new Brand({ name });
        const savedBrand = await brand.save();
        res.status(201).json(savedBrand);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateBrand = async (req, res) => {
    try {
        const { name } = req.body;
        const updatedBrand = await Brand.findByIdAndUpdate(req.params.id, { name }, { new: true });
        if (!updatedBrand) return res.status(404).json({ message: 'Brand not found' });
        res.json(updatedBrand);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteBrand = async (req, res) => {
    try {
        const deletedBrand = await Brand.findByIdAndDelete(req.params.id);
        if (!deletedBrand) return res.status(404).json({ message: 'Brand not found' });
        res.json({ message: 'Brand deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
