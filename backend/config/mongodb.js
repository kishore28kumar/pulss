// mongodb config replaced with a harmless no-op stub so Mongo is removed from runtime.
// If you later want Mongo, restore the original implementation.

module.exports = {
  // Backwards compatible no-op connect function
  connectMongo: async () => {
    console.log('connectMongo: MongoDB disabled in this build (no-op)');
    return null;
  },
  connectMongoDB: async () => {
    console.log('connectMongoDB: MongoDB disabled in this build (no-op)');
    return null;
  },
  mongoose: null,
  MONGODB_URI: null,
  MONGODB_OPTIONS: {},
};
