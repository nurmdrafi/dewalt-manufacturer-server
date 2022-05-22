const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const port = process.env.PORT || 5000;

require("dotenv").config();

// use middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.zp9wl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
    try {
      await client.connect();
      // Collections
      const productsCollection = client.db("dewalt_DB").collection("products");
  
      // Get all products
      app.get("/product", async (req, res) => {
        const query = req.query;
        const products = await productsCollection.find(query).toArray();
        console.log("mongodb connected");
        res.send(products);
      });

      // Add new product
      app.post("/add-product", async(req, res) =>{
          const data = req.body;
          const addedProduct = await productsCollection.insertOne(data);
          res.send(addedProduct)
      })
    } finally {
      //   await client.close();
    }
  }
  run().catch(console.dir);

// for testing
app.get("/", (req, res) => {
  res.send({ message: "Success" });
});

app.listen(port, () => {
  console.log("Listening to port", port);
});
