const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subtaskSchema = new Schema({
    title: { type: String, required: true },
    done: { type: Boolean, default: false }
});

const todoSchema = new Schema({
    todo: { type: String, required: true },
    subtasks: [subtaskSchema],
    createdAt: { type: Date, default: Date.now }
});

const Todo = mongoose.model("Todo", todoSchema);
module.exports = Todo;
