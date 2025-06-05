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

app.get('/', async (req, res) => {
    try {
        const todos = await Todo.find();
        res.render('index', { data: todos });
    } catch (err) {
        res.status(500).send('Erreur serveur');
    }
});

app.post('/', (req, res) => {
    const { todoValue } = req.body;
    const todo = new Todo({
        todo: todoValue,
        subtasks: []
    });
    todo.save()
        .then(() => res.redirect('/'))
        .catch(err => {
            console.error(err);
            res.status(500).send("Internal Server Error");
        });
});

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

app.delete('/:id', (req, res) => {
    Todo.findByIdAndDelete(req.params.id)
        .then(() => res.status(200).send("Todo deleted successfully"))
        .catch(err => {
            console.error(err);
            res.status(500).send("Internal Server Error");
        });
});

app.delete('/:todoId/subtask/:subtaskId', async (req, res) => {
    const { todoId, subtaskId } = req.params;
    try {
        await Todo.findByIdAndUpdate(
            todoId,
            { $pull: { subtasks: { _id: subtaskId } } }
        );
        res.status(200).send('Sous-tâche supprimée');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur lors de la suppression de la sous-tâche');
    }
});

app.listen(port, () => {
    console.log('Server is running on port ' + port);
});
