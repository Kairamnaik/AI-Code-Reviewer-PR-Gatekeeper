import mongoose from 'mongoose';
import { LocalModel } from './dbFallback.js';

let useLocalDB = false;
const mongooseModelsCache = {};
const localModelsCache = {};

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('⚠️ MONGODB_URI is not set. Falling back to local file database.');
    useLocalDB = true;
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('✅ MongoDB Connected.');
  } catch (err) {
    console.error('❌ MongoDB Connection Failed:', err.message);
    console.warn('⚠️ Falling back to local file database.');
    useLocalDB = true;
  }
};

export const createModel = (name, schema) => {
  // We return a Proxy to dynamically resolve the database driver (Mongoose vs Local JSON)
  // at execution time rather than static module load time.
  return new Proxy({}, {
    get: (target, prop) => {
      let activeModel;
      if (useLocalDB) {
        if (!localModelsCache[name]) {
          localModelsCache[name] = new LocalModel(name);
        }
        activeModel = localModelsCache[name];
      } else {
        if (!mongooseModelsCache[name]) {
          mongooseModelsCache[name] = mongoose.models[name] || mongoose.model(name, schema);
        }
        activeModel = mongooseModelsCache[name];
      }

      const value = activeModel[prop];
      if (typeof value === 'function') {
        return value.bind(activeModel);
      }
      return value;
    }
  });
};

export const isLocalDB = () => useLocalDB;
