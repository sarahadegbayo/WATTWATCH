import mongoose from 'mongoose';
import { MONGODB_URI, NODE_ENV } from '../config/env.js';


if (!MONGODB_URI) {
    throw new Error('Please define the MONGO_URI environment variable inside .env.<development/production>.local');
}

const connectToDatabase = async () => {
    try {
        console.log(`connect to database in ${NODE_ENV} mode`);
        await mongoose.connect(MONGODB_URI);
    } catch (err) {
        console.error('Error connecting to database: ', err.message);
        // process.exit(1);
    }


}

export default connectToDatabase;



















