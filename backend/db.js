const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let dbInstance = null;

async function connectDB() {
  if (dbInstance) return dbInstance;
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    dbInstance = client.db("mind_mitra");
    return dbInstance;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

module.exports = connectDB;
