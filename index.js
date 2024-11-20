const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000 

// middleware
app.use(cors())
app.use(express.json())







// mongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9fglmuq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  const dbConnect =async()=>{
    try{
        client.connect();
        console.log("Successfully connected database");

    }
    catch(err){
        console.log("Error name",err.name,err.massage);

    }
  }

  dbConnect()





// api
app.get("/",(req,res) =>{
    res.send("Hello world")
})

app.listen(port, () =>{
    console.log(`server running on port ${port}`);
})
