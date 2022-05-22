const express = require("express");
    const app = express();
    const cors = require("cors");
    const { MongoClient, ServerApiVersion } = require("mongodb");
    const ObjectId = require('mongodb').ObjectId;
    const port = process.env.PORT || 5000;
    
    require('dotenv').config();

    // use middleware
    app.use(cors());
    app.use(express.json());

    // for testing
    app.get("/", (req, res) => {
        res.send({ message: "Success" });
    });

    app.listen(port, () => {
        console.log("Listening to port", port);
    });