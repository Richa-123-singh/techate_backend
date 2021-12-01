let middlewareObj = {};

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        next();
    } else {
        req.flash('error', 'You Need To Be Logged In!!!');
        res.redirect('/');
    }
};

module.exports = middlewareObj;