var express = require("express");
var app = express()
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var User = require("./models/user");
var Comment = require("./models/comment");
var Task = require("./models/task");
var async = require('async');
var nodemailer = require('nodemailer');
var crypto = require('crypto');
var flash = require("connect-flash");


mongoose.connect("mongodb://localhost/todolist_app",{useNewUrlParser:true, useUnifiedTopology:true});
app.set("view engine","ejs");
app.use(methodOverride("_method"))
app.use(bodyParser.urlencoded({extended:true}));
app.use(require("express-session")({
	secret: "i am the legend",
	resave: false,
	saveUninitialized: false
}))
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());





// Comment.create({
// 	text:"thirdcomment"
// },function(err,comments){
// 	if(err){
// 		console.log(err);
// 	}else{
// 		console.log(comments);
// 	}
// })

// User.create({
// 	username:"sjhdbfs",
// 	password:"akhbajdb"
	
// },function(err, users){
// 	if(err){
// 		console.log(err);
// 	}else{
// 		console.log(users)
// 		Comment.findOne({text: "thirdcomment"},function(err,comments){
// 			if(err){
// 				console.log(err);
// 			}else{
// 				comments.author.id = users.id;
// 				comments.author.username = users.username;
// 				comments.save(function(err,data){
// 					if(err){
// 						console.log(err);
// 					}else{
// 						console.log(comments.author.id === users.id);
// 						console.log(comments.author.username === users.username);
// 						console.log("results===" + data);
// 					}
// 				})
// 			}
// 		}) 
// 	}
// })

///////////////////////////////////////////////////////////////////////////////////////////////////////////
app.use(function(req,res,next){
	res.locals.currentUser = req.user;
	res.locals.success = req.flash("success");
	res.locals.error   = req.flash("error");
	next();
})
app.get("/",function(req,res){
	res.redirect("/login");
})

app.get("/home",isLoggedIn,function(req,res){
	Task.find({},function(err, tasks){
		if(err){
			console.log(err);
		}else{
			res.render("home",{task:tasks});
		}
	})
})
app.get("/home/profile",isLoggedIn,function(req,res){
	res.render("profile");
})

app.get("/home/new",isLoggedIn,function(req,res){
	res.render("new");
})

app.post("/home",isLoggedIn,function(req,res){
	var title = req.body.title;
	var text = req.body.text;
	var author = {
		id: req.user._id,
		username: req.user.username
	}
	var newtask = {
		title: title,
		text: text,
		author: author
	}
	Task.create(newtask,function(err,tasks){
		if(err){
			res.redirect("/home");
		}else{
			res.redirect("/home")
		}
	})
})

app.get("/home/:id",CheckOwner,function(req,res){
	Task.findById(req.params.id).populate("subtext").exec(function(err,tasks){
		if(err){
			res.redirect("/");
		}else{
			res.render("show",{task:tasks})
		}
	})
})

app.get("/home/:id/edit",CheckOwner,function(req,res){
	Task.findById(req.params.id,function(err,tasks){
		if(err){
			res.redirect("/home")
		}else{
			res.render("edit",{task:tasks});
		}
	})
	
})

app.put("/home/:id",CheckOwner,function(req,res){
	Task.findByIdAndUpdate(req.params.id,req.body.task,function(err,tasks){
		if(err){
			res.redirect("back");
		}else{
			res.redirect("/home/" + req.params.id);
		}
	})
})
app.delete("/home/:id",function(req,res){
	Task.findByIdAndRemove(req.params.id,function(err){
		if(err){
			res.redirect("back");
		}else{
			res.redirect("/home");
		}
	})
})

////////////////////////////////////////////////////////////////////////////////////////////////
// subtasks

app.get("/home/:id/comment/new",isLoggedIn,function(req,res){
	Task.findById(req.params.id,function(err,tasks){
		if(err){
			res.redirect("/");
		}else{
			res.render("commentnew",{task:tasks});
		}
	})
})

app.post("/home/:id/comment",isLoggedIn,function(req,res){
	Task.findById(req.params.id,function(err,tasks){
		if(err){
			res.redirect("/home/" + tasks._id)
		}else{
			Comment.create(req.body.comment,function(err,comment){
				if(err){
					res.redirect("/home/" + tasks._id + "/comment/new");
				}else{
					comment.author.id = req.params._id;
					comment.author.username = req.params.username;
					comment.save();
					console.log("results of comments :" + comment);
					console.log("adasd" + comment.author.username + comment.author.id);
					tasks.subtext.push(comment);
					tasks.save();
					console.log("results----" + tasks);
					res.redirect("/home/" + tasks._id);
				}
			})
		}
	})
})
app.delete("/home/:id/comment/:commentid",function(req,res){
	Comment.findByIdAndRemove(req.params.commentid,function(err){
		if(err){
			res.redirect("back");
		}else{
			res.redirect("/home/" + req.params.id);
		}
	})
})
/////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////
// authentication
app.get("/register",function(req,res){
	res.render("register");
})

app.post("/register",function(req,res){
	User.register(new User({username: req.body.username, email: req.body.email}), req.body.password, function(err,user){
		if(err){
			console.log("error");
			return res.render("register");
		}else{
		passport.authenticate("local")(req,res, function(){
			
			res.redirect("/home");
	})
		}
})
})

app.get("/login",function(req,res){

	res.render("login");
})

app.post("/login",passport.authenticate("local",{
	successRedirect: "/home",
	failureRedirect: "/login",
	failureFlash: true,
	successFlash: "Successfully Logged In"
	
}),function(req,res){	
});

app.get("/logout",function(req,res){
	req.logout();
	res.redirect("/");
})

////////////////////////////////////////////////////////////////////
app.get("/forgot",function(req,res){
	console.log(process.env.GMAILPW);
	res.render("forgot");
})

app.post("/forgot",function(req,res,next){
	async.waterfall([
		function(done){
			crypto.randomBytes(20,function(err, buf){
				var token = buf.toString('hex');
				done(err, token);
				
			});
		},
		function(token, done){
			User.findOne({email: req.body.email}, function(err, user){
				if(!user){
						req.flash('error', 'No account with that email address exists.');
					return res.redirect("/forgot");
				}
				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 3600000;
				
				user.save(function(err){
					done(err, token, user);
				});
			});
		},
		function(token, user, done){
			var smtpTransport = nodemailer.createTransport({
				service : 'Gmail',
				auth: {
					user: 'vvtodo35@gmail.com',
					pass: process.env.GMAILPW
				}
			});
			var mailOption = {
				to: user.email,
				from: 'vvtodo35@gmail.com',
				subjet: "Todolist Reset Your Password",
				text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' + 
		'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'https://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
			};
			smtpTransport.sendMail(mailOption,function(err){
				console.log('mailsent');
				req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
				done(err, 'done');
			});
		}
	], function(err){
		if(err) return next(err);
		res.redirect('forgot');
	});
});

app.get("/reset/:token", function(req,res){
	User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires:{$gt: Date.now()}},function(err,user){
		if(!user){
			req.flash('error', 'password reset token is invaild or has expired');
			return res.redirect("/forgot");
		}
		res.render('reset', {token: req.params.token});
	});
});

app.post('/reset/:token',function(req,res){
	async.waterfall([
		function(done){
			User.findOne({resetPasswordToken: req.params.token ,resetPasswordExpires:{$gt: Date.now()}}, function(err, user){
				if(!user){
					req.flash('error', 'password reset token is invaild or has expired');
					return res.redirect('back');
				}
				if(req.body.password === req.body.confirm){
					user.setPassword(req.body.password, function(err){
						
						user.resetPasswordToken = undefined;
						user.resetPasswordExpires = undefined;
						
						user.save(function(err){
							req.logIn(user,function(err){
								done(err, user);
							});
						});
					})
				}else{
					req.flash('error', 'passwords do not match');
					return res.redirect('back');
				}
			});
		},
		function(user, done){
			var smtpTransport = nodemailer.createTransport({
				service: 'Gmail',
				auth: {
					user: 'vvtodo35@gmail.com',
					pass: process.env.GMAILPW
				}
			});
			var mailOption ={
				to:user.email,
				from:'vvtodo35@mail.com',
				subjet: "ToDo-List",
				text: "Your password has been changed" + user.email + "done"
			};
			smtpTransport.sendMail(mailOption, function(err){
				req.flash('success', "success your has been changed");
				done(err);
			});
		}
	],function(err){
		res.redirect("/login")
	})
})









function isLoggedIn(req,res, next){
	if(req.isAuthenticated()){
			// console.log(req.user);
		return next();
	}
	res.redirect("/login");
}

function CheckOwner(req,res,next){
	if(req.isAuthenticated()){
		Task.findById(req.params.id,function(err,tasks){
			if(err){
				console.log(err);
			}else{
				if(tasks.author.id.equals(req.user._id)){
					next();
			   }
			else
			{
			res.redirect("back");	
			}
			}
		})
	}else{
		res.redirect("back");
	}
}

function CommentOwner(req,res,next){
	if(req.isAuthenticated()){
		Comment.findById(req.params.commentid,function(err,comments){
			if(err){
				res.redirect("back");
			}else{
				if(comments.author.id.equals(req.user._id)){
					next();
			   }
			else
			{
			res.redirect("back");	
			}
			}
		})
	}else{
		res.redirect("back");
	}
}


app.listen(process.env.PORT || 3000,process.env.IP,function(){
	console.log("server starts");
})
