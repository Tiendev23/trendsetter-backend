const { LOCAL_URI } = require('../config')
const mongoose = require('mongoose');
const data = require('../data/data.json');
const { Location } = require('../models');

async function importData() {
    try {
        await mongoose.connect(LOCAL_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB.');

        // Xóa dữ liệu cũ (nếu cần)
        await Location.deleteMany({});
        console.log('Cleared existing data.');

        // Thêm dữ liệu mới
        const inserted = await Location.insertMany(data);
        console.log(`Imported ${inserted.length} provinces.`);

    } catch (err) {
        console.error('Error while importing:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);
    }
}

importData();