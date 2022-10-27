//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

require('dotenv').config() ;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = process.env.MONGODB_URI ;

mongoose.connect(db, { useNewUrlParser: true });

const itemsSchema = new mongoose.Schema({
  name: String
})

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
})

const item2 = new Item({
  name: "Hit the + button to add a new item."
})

const item3 = new Item({
  name: "<-- Hit this to delete an item."
})

const defaultItems = [item1, item2, item3];

//A new schema is created for lists that has a name ans an array of itemsSchema based
//documents associated with it
const listSchema = {
  name : String ,
  items : [itemsSchema]
};

const List = mongoose.model("List",listSchema) ;

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully Inserted the default");
        }
      })
      //We are redirecting so that after inserting defaultItems in
      //database , we can render those default items
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  })
});

app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName) ;  

  List.findOne({name : customListName} , function(err,foundList){
    if(err) {
      console.log(err) ;
    } else {
      if(!foundList) {
        //Create a new List
        const list = new List({
          name : customListName ,
          items : defaultItems
        });
      
        list.save() ;
        res.redirect("/" + customListName) ;
      } else {
        //Show the existing List
        res.render("list", { listTitle: customListName, newListItems: foundList.items});
      }
    }
  })
})

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list ;

  const item = new Item({
    name : itemName
  });

  if(listName === "Today") {
    item.save() ;
    res.redirect("/") ;
  } else {
    List.findOne({name : listName} , function(err,foundList){
      foundList.items.push(item) ;
      foundList.save() ;
      res.redirect("/" + listName) ;
    })
  }  
});

app.post("/delete",function(req,res){
  const checkedItemID = req.body.checkbox ;
  const listName = req.body.listName ;

  if(listName === "Today") {
    Item.findByIdAndRemove(checkedItemID,function(err){
      if(err) {
        console.log(err) ;
      } else {
        console.log("Successfully Delete the element that was checked") ;
      }
    });

    res.redirect("/") ;
  } else {
    List.findOneAndUpdate({name : listName} , {$pull : {items : {_id : checkedItemID}}} , function(err,foundList){
      if(err) {
        console.log(err) ;
      } else {
        res.redirect("/" + listName) ;
      }
    })
  }

  
})

app.get("/about", function (req, res) {
  res.render("about");
});

const port = process.env.PORT || 3000 ;

app.listen(port, function () {
  console.log("Server started on port 3000");
});
