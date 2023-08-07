//jshint esversion:6
import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import _ from "lodash";

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const workItems = [];

async function startServer() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/tolistDB");
    console.log("Connected to MongoDB");

    const itemSchema = new mongoose.Schema({
      name: {
        type: String,
        required: true,
      },
    });

    const listSchema = new mongoose.Schema({
      name: String,
      items: [itemSchema],
    });

    const Task = mongoose.model("task", itemSchema);

    const List = mongoose.model("list", listSchema);

    const task1 = new Task({
      name: "Wash your car",
    });

    const task2 = new Task({
      name: "Complete mongooose today",
    });

    const task3 = new Task({
      name: "Avoid Avadhoot",
    });

    const default_list = [task1, task2, task3];

    app.get("/", async (req, res) => {
      const items = await Task.find();

      if (items.length === 0) {
        await Task.insertMany([task1, task2, task3]);
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: items });
      }
    });

    app.post("/", async function (req, res) {
      const itemname = req.body.newItem;
      const list_title = req.body.list;

      const newtask = new Task({
        name: itemname,
      });

      if (list_title === "today") {
        await newtask.save();
        res.redirect("/");
      } else {
        const curr_list = await List.findOne({ name: list_title });

        curr_list.items.push(newtask);
        curr_list.save();
        res.redirect("/" + list_title);
      }
    });

    app.get("/:title", async function (req, res) {
      const customlist = _.capitalize(req.params.title);
      //res.render("list", { listTitle: "Work List", newListItems: workItems });
      const curr_list = await List.findOne({ name: customlist }).exec();
      const list = new List({
        name: customlist,
        items: default_list,
      });
      if (!curr_list) {
        await list.save();
        res.redirect("/" + customlist);
      } else {
        res.render("list", {
          listTitle: curr_list.name,
          newListItems: curr_list.items,
        });
      }
    });

    app.post("/delete", async (req, res) => {
      const item = req.body.checkbox;
      const list_title = req.body.list;

      if (list_title === "Today") {
        await Task.deleteOne({ _id: req.body.checkbox });
        console.log(req.body);

        res.redirect("/");
      } else {
        await List.updateOne(
          { name: list_title },
          { $pull: { items: { _id: item } } }
        );
        res.redirect("/" + list_title);
      }
    });

    app.get("/about", function (req, res) {
      res.render("about");
    });

    app.listen(3000, function () {
      console.log("Server started on port 3000");
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

// Call the async function to start the server
startServer();
