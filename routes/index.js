const express = require('express');
const router = express.Router();


router.get('/',(req,res)=>{
     res.render("index");
});
router.get('/chat',(req,res)=>{
     res.render("chating");
});



module.exports = router;
