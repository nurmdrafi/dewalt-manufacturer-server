const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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

// Verify Token
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();

    // Collections
    const productCollection = client.db("dewalt_DB").collection("products");
    const reviewCollection = client.db("dewalt_DB").collection("reviews");
    const orderCollection = client.db("dewalt_DB").collection("orders");
    const userCollection = client.db("dewalt_DB").collection("users");

    // Verify Admin
    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        next();
      } else {
        res.status(403).send({ message: "Forbidden Access" });
      }
    };

    // Get all products
    // http://localhost:5000/product
    app.get("/product", async (req, res) => {
      const query = req.query;
      const products = await productCollection.find(query).toArray();
      res.send(products);
    });

    // Get product by id
    // http://localhost:5000/product/${_id}
    app.get("/product/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await productCollection.find(query).toArray();
      res.send(product);
    });

    // Add new product
    // http://localhost:5000/add-product
    app.post("/add-product", verifyJWT, verifyAdmin, async (req, res) => {
      const data = req.body;
      const addedProduct = await productCollection.insertOne(data);
      res.send(addedProduct);
    });

    // Delete product by id
    // http://localhost:5000/product/${selectedId}
    app.delete("/product/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const deletedProduct = await productCollection.deleteOne(query);
      res.send(deletedProduct);
    });

    // Get all Reviews
    // http://localhost:5000/reviews
    app.get("/reviews", async (req, res) => {
      const query = req.query;
      const reviews = await reviewCollection.find(query).toArray();
      res.send(reviews);
    });

    // Add Review
    // http://localhost:5000/add-review
    app.post("/add-review", verifyJWT, async (req, res) => {
      const data = req.body;
      const insertedReview = await reviewCollection.insertOne(data);
      res.send(insertedReview);
    });

    // Add Order
    // http://localhost:5000/add-order
    app.post("/add-order", verifyJWT, async (req, res) => {
      const data = req.body;
      const insertedOrder = await orderCollection.insertOne(data);
      res.send(insertedOrder);
    });

    // Get All orders
    // http://localhost:5000/orders
    app.get("/orders", verifyJWT, verifyAdmin, async (req, res) => {
      const orders = await orderCollection.find().toArray();
      res.send(orders);
    });

    // Get orders by email
    // http://localhost:5000/orders/${email}
    app.get("/orders/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const order = await orderCollection.find(query).toArray();
      res.send(order);
    });

    // Get order by id
    // http://localhost:5000/order/${_id}
    app.get("/order/:_id", verifyJWT, async (req, res) => {
      const id = req.params._id;
      const query = { _id: id };
      const order = await orderCollection.findOne(query);
      res.send(order);
    });

    // Delete Order by Id
    // http://localhost:5000/order/${selectedId}
    app.delete("/delete-order/:selectedId", verifyJWT, async (req, res) => {
      const id = req.params.selectedId;
      console.log("id:", id);
      const filter = { _id: id };
      const deletedOrder = await orderCollection.deleteOne(filter);
      console.log(deletedOrder);
      res.send(deletedOrder);
    });

    // Issue Token + set userCollection
    // http://localhost:5000/user/${email}
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );
      res.send({ result, token });
    });

    // Get all users
    // http://localhost:5000/users
    app.get("/users", verifyJWT, verifyAdmin, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    // Get user by email
    app.get("/user/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      res.send(user);
    });

    // Update user profile
    // http://localhost:5000/update-user/${email}
    app.put("/update-user/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    // Make User to Admin
    // http://localhost:5000/user/admin/${email}
    app.put("/user/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Get access if role is Admin
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    // Stripe
    // http://localhost:5000/create-payment-intent
    app.post("/create-payment-intent", verifyJWT, async (req, res) => {
      const service = req.body;
      const price = service.price;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });
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
