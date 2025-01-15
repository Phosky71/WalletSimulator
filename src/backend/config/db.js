const mongoose = require('mongoose');
require('dotenv').config();

const connectToCluster = async () => {
    try {
        console.log('Connecting to MongoDB Atlas cluster...');
        await mongoose.connect(process.env.DB_URI);
        console.log('Successfully connected to MongoDB Atlas!');
    } catch (error) {
        console.error('Connection to MongoDB Atlas failed!', error);
        process.exit();
    }
}

const closeClusterConnection = async () => {
    try {
        console.log('Closing connection to MongoDB Atlas...');
        await mongoose.connection.close();
        console.log('Connection to MongoDB Atlas closed successfully!');
    } catch (error) {
        console.error('Error closing connection to MongoDB Atlas', error);
    }
}

module.exports = {
    connectToCluster,
    closeClusterConnection
};