/*
CSC3916 HW2
File: Server.js
Description: Web API scaffolding for Movie API
 */

const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const authController = require('./auth');
const authJwtController = require('./auth_jwt');
const cors = require('cors');
const User = require('./models/Users');
const Movie = require("./models/Movies");
const Review = require("./models/Review");

const PORT = process.env.PORT || 8080
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(passport.initialize());

const router = express.Router();


router.post('/signup', function (req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        let user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function (err) {
            if (err) {
                if (err.code === 11000)
                    return res.json({success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    let userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({username: userNew.username}).select('name username password').exec(function (err, user) {
        if (err) {
            res.send(err);
        }

        if (user === null) {
            res.status(404).send({success: false, msg: 'User not found!'});
        } else {
            user.comparePassword(userNew.password, function (isMatch) {
                if (isMatch) {
                    let userToken = {
                        id: user.id,
                        username: user.username
                    };
                    let token = jwt.sign(userToken, process.env.SECRET_KEY);
                    res.json({success: true, token: 'JWT ' + token});
                } else {
                    res.status(401).send({success: false, msg: 'Password incorrect!'});
                }
            })
        }
    })
});

router.route('/movies')
    .post(authJwtController.isAuthenticated, function (req, res) {
        console.log(req.body);
        let movie = new Movie();
        movie.title = req.body.title;
        movie.year = req.body.year;
        movie.genre = req.body.genre;
        movie.actors = req.body.actors;
        movie.imageURL = req.body.imageURL;
        movie.averageRating = req.body.averageRating;

        Movie.findOne({title: req.body.title}, function (err, found) {
            if (err) {
                res.json({message: "ERROR:", error: err});
            } else if (found) {
                res.json({message: "Movie of same name already in DB", error: err});
            } else if (movie.actors.length !== 3) {
                res.json({message: "Less than 3 actors", error: err});
            } else {
                movie.save(function (err) {
                    if (err) {
                        res.json({message: "ERROR", error: err});
                    } else {
                        res.json({message: "Movie is saved to DB"});
                    }
                })
            }
        });
    })
    .get(function (req, res) {
            Movie.find(function (err, result) {
                if (err) res.json({message: "ERROR", error: err});
                res.json(result);
            })
        }
    );

router.route('/movies/:title')
    .get(function (req, res) {
        Movie.find({title: req.params.title}, function (err, result) {
            if (err) res.json({message: "ERROR", error: err});
            res.json(result);
        })
    })
    .delete(authController.isAuthenticated, function (req, res) {
        let conditions = {title: req.params.title};
        Movie.findOne({title: req.body.title}, function (err, found) {
            if (err) {
                res.json({message: "ERROR", error: err});
            } else {
                Movie.deleteOne(conditions, req.body)
                    .then(mov => {
                        if (!mov) {
                            return res.status(400).end();
                        }
                        return res.status(200).json({msg: "Successfully removed movie from DB"})
                    })
                    .catch(err => console.log(err))
            }
        })
    })
    .put(authJwtController.isAuthenticated, function (req, res) {
        let conditions = {title: req.params.title};
        Movie.findOne({title: req.body.title}, function (err, found) {
            if (err) {
                res.json({message: "ERROR", error: err});
            } else {
                Movie.updateOne(conditions, req.body)
                    .then(mov => {
                        if (!mov) {
                            return res.status(400).end();
                        }
                        return res.status(200).json({msg: "Successfully updated movie in DB"})
                    })
                    .catch(err => console.log(err))
            }
        })
    })


router.route('/reviews')
    .get(function (req, res) {
            console.log(req.body);
            let review = new Review();
            review.movie = req.body.movie;
            review.reviewerName = req.body.reviewerName;
            review.quote = req.body.quote;
            review.rating = req.body.rating;
            Movie.find(function (err, result) {
                if (err) res.json({message: "ERROR", error: err});
                res.json(result);
            })
        }
    )
    .post((req, res) => {
            let newReview = new Review();
            newReview.movie = req.body.movie;
            newReview.reviewerName = req.body.reviewerName;
            newReview.quote = req.body.quote;
            newReview.rating = req.body.rating;

            if (!req.body.movie || !req.body.reviewerName || !req.body.quote || !req.body.rating) {
                res.json({success: false, msg: 'All fields must be included to save a review'});
            } else if (Movie.find({title: newReview.movie})) {
                res.status(400).json({
                    success: false,
                    msg: 'Movie does not exist, please create movie before adding review'
                });
            } else {
                console.log(newReview);
                newReview.save((err, result) => {
                    if (err) {
                        res.json({message: "ERROR", error: err});
                    } else {
                        res.json({message: `["${newReview.movie}] review by ${newReview.reviewerName} saved `});
                    }
                })
            }
        }
    );

// all other requests
router.all('*', function (req, res) {
    res.status(405).json({error: 'HTTP Method Not Supported'});
});

app.use('/', router);
app.listen(PORT, () =>
    console.log(`Server started on port ${PORT}`));

module.exports = app; // for testing only

