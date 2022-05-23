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
    const productCollection = client.db("dewalt_DB").collection("products");
    const reviewCollection = client.db("dewalt_DB").collection("reviews");
    const orderCollection = client.db("dewalt_DB").collection("orders");

    // Get all products
    // http://localhost:5000/product
    app.get("/product", async (req, res) => {
      const query = req.query;
      const products = await productCollection.find(query).toArray();
      console.log("mongodb connected");
      res.send(products);
    });

    // Get product by id
    // http://localhost:5000/product/${_id}
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await productCollection.find(query).toArray();
      res.send(product);
    });

    // Add new product
    // http://localhost:5000/add-product
    app.post("/add-product", async (req, res) => {
      const data = req.body;
      const addedProduct = await productCollection.insertOne(data);
      res.send(addedProduct);
    });

    // Delete product by id
    // `http://localhost:5000/product/${selectedId}
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const deletedProduct = await productCollection.deleteOne(query);
      res.send(deletedProduct);
    });

    // Get all Reviews
    // http://localhost:5000/reviews
    app.get("/reviews", async(req, res) =>{
      const query = req.query;
      const reviews = await reviewCollection.find(query).toArray();
      res.send(reviews);
    })

    // Add Review
    // http://localhost:5000/add-review
    app.post("/add-review", async (req, res) => {
      const data = req.body;
      const insertedReview = await reviewCollection.insertOne(data);
      res.send(insertedReview);
    });

    // Add Order
    // http://localhost:5000/add-order
    app.post("/add-order", async (req, res) =>{
      const data = req.body;
      const insertedOrder = await orderCollection.insertOne(data);
      res.send(insertedOrder)
    })

    // Get order by email
    app.get("/order/:email", async(req, res) =>{
      const email = req.params.email;
      const query = {email: email};
      const order = await orderCollection.find(query).toArray();
      res.send(order)

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
