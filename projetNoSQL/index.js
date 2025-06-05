const express = require("express");
const session = require('express-session');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const Todo = require('./models/todo');
const User = require('./models/user');

const app = express();
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

app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: false
}));

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isAuthenticated || false;
    res.locals.username = req.session.username || null;
    next();
});

// Middleware pour protéger les routes
function requireAuth(req, res, next) {
    if (!req.session.isAuthenticated) {
        return res.redirect('/login');
    }
    next();
}

app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                req.session.isAuthenticated = true;
                req.session.userId = user._id;
                req.session.username = username;
                return res.redirect('/');
            }
        }
        res.render('login', { error: 'Identifiants incorrects' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur serveur');
    }
});

app.get('/signup', (req, res) => {
    res.render('signup', { error: null });
});

app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.render('signup', { error: 'Nom d\'utilisateur déjà pris' });
        }
        const user = new User({ username, password });
        await user.save();

        req.session.isAuthenticated = true;
        req.session.userId = user._id;
        req.session.username = username;

        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur lors de la création du compte');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

app.get('/', requireAuth, async (req, res) => {
    try {
        const todos = await Todo.find({ userId: req.session.userId });
        res.render('index', { data: todos });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur serveur');
    }
});

app.post('/', requireAuth, async (req, res) => {
    const { todoValue, tags } = req.body;
    const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [];

    const todo = new Todo({
        todo: todoValue,
        subtasks: [],
        tags: tagsArray,
        userId: req.session.userId
    });
    try {
        await todo.save();
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
});

app.post('/:id/subtask', requireAuth, async (req, res) => {
    const { subtaskTitle } = req.body;
    try {
        await Todo.findOneAndUpdate(
            { _id: req.params.id, userId: req.session.userId },
            { $push: { subtasks: { title: subtaskTitle } } }
        );
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur lors de l’ajout de la sous-tâche');
    }
});


app.delete('/:id', requireAuth, async (req, res) => {
    try {
        await Todo.findOneAndDelete({ _id: req.params.id, userId: req.session.userId });
        res.status(200).send("Todo supprimé avec succès");
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
});

app.delete('/:todoId/subtask/:subtaskId', requireAuth, async (req, res) => {
    try {
        await Todo.findOneAndUpdate(
            { _id: req.params.todoId, userId: req.session.userId },
            { $pull: { subtasks: { _id: req.params.subtaskId } } }
        );
        res.status(200).send('Sous-tâche supprimée');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur serveur');
    }
});

app.post('/:id/tag', requireAuth, async (req, res) => {
    const { tagValue } = req.body;
    try {
        await Todo.findOneAndUpdate(
            { _id: req.params.id, userId: req.session.userId },
            { $addToSet: { tags: tagValue } }
        );
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur lors de l’ajout du tag');
    }
});

app.delete('/:id/tag/:tag', requireAuth, async (req, res) => {
    try {
        await Todo.findOneAndUpdate(
            { _id: req.params.id, userId: req.session.userId },
            { $pull: { tags: req.params.tag } }
        );
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur lors de la suppression du tag');
    }
});


app.listen(port, () => {
    console.log('Server running on port ' + port);
});
