const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000 

// middleware
app.use(cors())
app.use(express.json())







// mongoDB



// api
app.get("/",(req,res) =>{
    res.send("Hello world")
})

app.listen(port, () =>{
    console.log(`server running on port ${port}`);
})
