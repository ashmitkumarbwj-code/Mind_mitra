const { MongoClient } = require('mongodb');
const fs = require('fs');
const uri = "mongodb+srv://Ajay:GQi8gKIRYvjPeFTA@cluster0.ifjs5.mongodb.net/?appName=Cluster0";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("mind_mitra");
    const checkins = db.collection("checkins");
    const docs = await checkins.find({}).sort({ timestamp: -1 }).limit(5).toArray();
    fs.writeFileSync('output.json', JSON.stringify(docs, null, 2), 'utf8');
  } finally {
    await client.close();
  }
}
run();
