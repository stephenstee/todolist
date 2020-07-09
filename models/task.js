var mongoose = require("mongoose");


var taskSchema = new mongoose.Schema({
	title: String,
	text: String,
	time: {type:Date, default:Date.now},
	subtext: [{
		type: mongoose.Schema.Types.ObjectId,
		   ref: "Comment"
	}],
	author: {
		id:{
			type:mongoose.Schema.Types.ObjectId,
			ref:"User"
		},
		username: String
	}
	
})
var Task = mongoose.model("Task",taskSchema);

module.exports = Task;