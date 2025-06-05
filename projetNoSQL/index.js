const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Todo = require('./models/todo');

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

// Route GET
app.get('/', async (req, res) => {
    try {
        const todos = await Todo.find();
        res.render('index', { data: todos });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur serveur');
    }
});

// Ajouter todo
app.post('/', (req, res) => {
    const { todoValue, tags } = req.body;
    const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [];

    const todo = new Todo({
        todo: todoValue,
        subtasks: [],
        tags: tagsArray
    });

    todo.save()
        .then(() => res.redirect('/'))
        .catch(err => {
            console.error(err);
            res.status(500).send("Internal Server Error");
        });
});

// Ajouter subtask
app.post('/:id/subtask', async (req, res) => {
    const { subtaskTitle } = req.body;

    try {
        await Todo.findByIdAndUpdate(
            req.params.id,
            { $push: { subtasks: { title: subtaskTitle } } },
            { new: true }
        );
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur lors de l’ajout de la sous-tâche');
    }
});

// Supprimer todo
app.delete('/:id', async (req, res) => {
    console.log("DELETE todo: ", req.params.id);
    try {
        await Todo.findByIdAndDelete(req.params.id);
        res.status(200).send("Todo deleted successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

// Supprimer sous-tâche
app.delete('/:todoId/subtask/:subtaskId', async (req, res) => {
    console.log(`DELETE subtask: todoId=${req.params.todoId}, subtaskId=${req.params.subtaskId}`);
    try {
        await Todo.findByIdAndUpdate(
            req.params.todoId,
            { $pull: { subtasks: { _id: req.params.subtaskId } } }
        );
        res.status(200).send("Subtask deleted successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

app.listen(port, () => {
    console.log('Server is running on port ' + port);
});
