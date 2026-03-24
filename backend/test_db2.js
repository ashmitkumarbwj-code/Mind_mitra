const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://Ajay:GQi8gKIRYvjPeFTA@cluster0.ifjs5.mongodb.net/?appName=Cluster0";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("mind_mitra");
    const checkins = db.collection("checkins");
    const docs = await checkins.find({}).sort({ timestamp: -1 }).limit(2).toArray();
    docs.forEach(doc => {
      console.log("ID:", doc._id);
      console.log("Timestamp:", doc.timestamp, "| Type:", typeof doc.timestamp);
      console.log("Analysis:", JSON.stringify(doc.analysis));
    });
  } finally {
    await client.close();
  }
}
run();
