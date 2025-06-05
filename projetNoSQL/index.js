const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Todo = require('./models/todo'); // Assurez-vous que le chemin est correct

const port = 3000;

app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const dburl = "mongodb://localhost:27017/tododb";

mongoose.connect(dburl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.get('/', (request, response) => {
    Todo.find()
        .then(result => {
            response.render('index', { data: result });
        })
        .catch(err => {
            console.error(err);
            response.status(500).send("Internal Server Error");
        });
});

app.post('/', (request, response) => {
    const todo = new Todo({
        todo: request.body.todoValue // Correction ici
    });

    todo.save()
        .then(result => {
            response.redirect('/');
        })
        .catch(err => {
            console.error(err);
            response.status(500).send("Internal Server Error");
        });
});

app.delete('/:id', (request, response) => {
    Todo.findByIdAndDelete(request.params.id)
        .then(result => {
            console.log("Todo deleted:", result);
            response.status(200).send("Todo deleted successfully");
        })
        .catch(err => {
            console.error(err);
            response.status(500).send("Internal Server Error");
        });
});

app.listen(port, () => {
    console.log('Server is running on port ' + port);
});
