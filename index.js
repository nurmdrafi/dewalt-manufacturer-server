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
    // http://localhost:5000/product
    app.get("/product", async (req, res) => {
      const query = req.query;
      const products = await productsCollection.find(query).toArray();
      console.log("mongodb connected");
      res.send(products);
    });
    
    // Get product by id
    // http://localhost:5000/product/:id
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await productsCollection.find(query).toArray();
      res.send(product);
    });

    // Add new product
    //   http://localhost:5000/add-product
    app.post("/add-product", async (req, res) => {
      const data = req.body;
      const addedProduct = await productsCollection.insertOne(data);
      res.send(addedProduct);
    });

    // Delete product by id
    app.delete("/product/:id", async (req, res) =>{
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const deletedProduct = await productsCollection.deleteOne(query);
      res.send(deletedProduct);
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
