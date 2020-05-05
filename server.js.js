var favicon = require('serve-favicon');
var express = require('express');
var path = require('path'); 
var log = require('./libs/log')(module);
var app = express();
app.use(express.favicon("public/favicon.ico")); 
app.use(express.logger('dev')); 
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.methodOverride()); // поддержка put и delete 
app.use(app.router); // модуль для простого задания обработчиков путей 
app.use(express.static(path.join(__dirname, "public"))); // запуск статического файлового сервера, который смотрит на папку public/ (в нашем случае отдает index.html)
app.get('/api', function (req, res) { 
	res.send('API is running');
});
app.listen(1337, function(){
	log.info('Express server listening on port 1338');
});
//=============================================================================================
app.use(function(req, res, next){
	res.status(404);
	log.debug('Not found URL: %s',req.url);
	res.send({ error: 'Not found' });
	return;
});
 
app.use(function(err, req, res, next){ 
	res.status(err.status || 500);
	log.error('Internal error(%d): %s',res.statusCode,err.message); res.send({ error: err.message });
 	return;
});

app.get('/ErrorExample', function(req, res, next){
next(new Error('Random error!'));
});

var config          = require('./libs/config');
app.listen(config.get('port'), function(){
    log.info('Express server listening on port ' + config.get('port'));
});

var log = require('./libs/log')(module);
var ArticleModel = require('./libs/mongoose').ArticleModel;

app.get('/api/articles', function(req, res) {
    return ArticleModel.find(function (err, articles) {
        if (!err) {
            return res.send(articles);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.post('/api/articles', jsonParser, function (req, res) {
    var article = new ArticleModel({
        title: req.body.title,
        author: req.body.author,
        description: req.body.description,
        images: []
    });

    article.save(function (err) {
        if (!err) {
            log.info("article created");
            return res.send({ status: 'OK', article:article });
        } else {
            console.log(err);
            if(err.name == 'ValidationError') {
                res.statusCode = 400;
                res.send({ error: 'Validation error' });
            } else {
                res.statusCode = 500;
                res.send({ error: 'Server error' });
            }
            log.error('Internal error(%d): %s',res.statusCode,err.message);
        }
    });
});

app.get('/api/articles/:id', function(req, res) {
    return ArticleModel.findById(req.params.id, function (err, article) {
        if(!article) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        if (!err) {
            return res.send({ status: 'OK', article:article });
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.put('/api/articles/:id', function (req, res){
    return ArticleModel.findById(req.params.id, function (err, article) {
        if(!article) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }

		article.title = req.body.title;
		article.description = req.body.description;
		article.author = req.body.author;
		article.images = req.body.images;
        return article.save(function (err) {
            if (!err) {
                log.info("article updated");
                return res.send({ status: 'OK', article:article });
            } else {
                if(err.name == 'ValidationError') {
                    res.statusCode = 400;
                    res.send({ error: 'Validation error' });
                } else {
                    res.statusCode = 500;
                    res.send({ error: 'Server error' });
                }
                log.error('Internal error(%d): %s',res.statusCode,err.message);
            }
        });
    });
});

app.delete('/api/articles/:id', function (req, res){
    return ArticleModel.findById(req.params.id, function (err, article) {
        if(!article) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        return article.remove(function (err) {
            if (!err) {
                log.info("article removed");
                return res.send({ status: 'OK' });
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s',res.statusCode,err.message);
                return res.send({ error: 'Server error' });
            }
        });
    });
});


