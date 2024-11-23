const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");

// middleware
app.use(cors());
app.use(express.json());

// mongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9fglmuq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const dbConnect = async () => {
  try {
    // Issue: `client.connect()` was commented out, preventing database connection.
    // Fixed: Uncommented `client.connect()` to ensure the database connects properly.
    await client.connect();
    console.log("Successfully connected database");

    // Collections
    const database = client.db("ecommerce");
    const productCollection = database.collection("allProducts");
    const cartsCollection = database.collection("cartProducts");
    const usersCollection = database.collection("usersProducts");
    const searchProducts = database.collection("products");

    // Middleware: Verify JWT
    const verifyToken = (req, res, next) => {
      // Issue: Debug log may expose sensitive information.
      // Fixed: Removed the debug log `console.log("inside verify token")`.
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "Unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "Unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // Middleware: Verify Admin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      next();
    };

    // JWT-related API
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // Admin-related APIs
    app.delete("/users/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      // Issue: No check if `id` is valid before passing to `ObjectId`.
      // Fixed: Added validation to ensure `id` is a valid ObjectId.
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid user ID" });
      }
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    app.get(
      "/users/admin/:email",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const email = req.params.email;
        if (email !== req.decoded.email) {
          return res.status(403).send({ message: "Forbidden access" });
        }
        if (!req.headers.authorization) {
          return res
            .status(401)
            .send({ message: "Unauthorized access: No token provided" });
        }
        const query = { email: email };
        const user = await usersCollection.findOne(query);
        let admin = false;
        if (user) {
          admin = user?.role === "admin";
        }
        res.send({ admin });
      }
    );

    app.patch(
      "/users/admin/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid user ID" });
        }
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            role: "Admin",
          },
        };
        const result = await usersCollection.updateOne(filter, updatedDoc);
        res.send(result);
      }
    );

    // User-related APIs
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user?.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User already exists.", insertedId: null });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", verifyToken, async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/carts", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = cartsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/carts", async (req, res) => {
      const cartItem = req.body;
      const result = await cartsCollection.insertOne(cartItem);
      res.send(result);
    });

    // Products-related APIs
    app.get("/products", async (req, res) => {
      const cursor = productCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // products search related
    app.get("/allProducts", async (req, res) => {
      const { title, sort, category, brand } = req.query;
      const query = {};
      if (title) {
        query.title = { $regex: title, $options: "i" };
      }
      if (category) {
        query.category = { $regex: category, $options: "i" };
      }
      if (brand) {
        query.brand = { $regex: brand, $options: "i" };
      }
      const productInformation = await searchProducts
        .find({}, { projection: { category: 1, brand: 1 } })
        .toArray();
      const totalProducts = await searchProducts.countDocuments(query);
      const brands = [...new Set(productInformation.map((p) => p.brand))];
      const categorys = [...new Set(productInformation.map((p) => p.category))];
      const sorting = sort === "asc" ? 1 : -1;
      const result = await searchProducts
        .find(query)
        .sort({ sort: sorting })
        .toArray();
      res.send({result, brands,sorting, categorys, totalProducts});
    });
  } catch (err) {
    // Issue: Error object incorrectly accessed (typo in `massage`).
    // Fixed: Changed `err.massage` to `err.message`.
    console.error("Error:", err.name, err.message);
  }
};

dbConnect();

// Root API
app.get("/", (req, res) => {
  res.send("Hello World");
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
