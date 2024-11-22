const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

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
    // client.connect();
    console.log("Successfully connected database");
    // get product
    const database = client.db("ecommerce");
    // All db collection
    const productCollection = database.collection("allProducts");
    const cartsCollection = database.collection("cartProducts");
    const usersCollection = database.collection("usersProducts");

    // admin user related apis
    app.delete('/users/:id' ,async (req,res) =>{
      const id = req.params.id
      console.log("Delete user id" , id);
      const query = {_id :new ObjectId(id)}
      console.log(query);
      const result = await usersCollection.deleteOne(query)
      res.send(result)
    })

    app.patch('/users/admin/:id',async(req,res)=>{
      const id = req.params.id
      const filter = {_id:new ObjectId(id)}
      const updatedDoc ={
        $set:{
          role:"Admin"
        }
      }
      const result = await usersCollection.updateOne(filter,updatedDoc)
      res.send(result)

    })
    // user related api
    app.post('/users',async(req,res) =>{
      const user = req.body
      const query = {email:user?.email}
      const exestingUser = await usersCollection.findOne(query)
      if(exestingUser){
        return res.send({massage:"User already exists.",insertedId:null})
      }
      const result = await usersCollection.insertOne(user)
      res.send(result)
    })
    app.get("/users", async (req, res) => {
      const cusor = usersCollection.find();
      const result = await cusor.toArray();
      res.send(result);
    });

    app.get("/carts", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cusor = cartsCollection.find(query );
      const result = await cusor.toArray();
      res.send(result);
    });

    app.post("/carts", async (req, res) => {
      const cartItem = req.body;
      const result = await cartsCollection.insertOne(cartItem);
      res.send(result);
    });

    // Endpoint to get data
    app.get("/products", async (req, res) => {
      const cusor = productCollection.find();
      const result = await cusor.toArray();
      console.log(result);
      res.send(result);
    });
  } catch (err) {
    console.log("Error name", err.name, err.massage);
  }
};

dbConnect();

// api
app.get("/", (req, res) => {
  res.send("Hello world");
});

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
