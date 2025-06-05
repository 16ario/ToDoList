const mongoose = require('mongoose');

const SubtaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    done: { type: Boolean, default: false }
});

const TodoSchema = new mongoose.Schema({
    todo: { type: String, required: true },
    done: { type: Boolean, default: false },
    subtasks: [SubtaskSchema],
    tags: [String],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Todo', TodoSchema);
