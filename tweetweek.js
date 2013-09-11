var http = require('http');
var fs = require('fs');
var _ = require('underscore');


/*
 * Returns an array for every hour in the week
 * each array entry contains the number of tweets
 * for screen_name that week and the total number
 * of retweets of those tweets
 */
function getTimeline(screen_name, callback) {

  //Create an array with one array for each hour of the week
  var hours = [];
  _.each(_.range(168), function(hour) {
    hours.push([]);
  });

  //Get Data from twitter
  getTwitterData(screen_name,function(err,res){
    if(err){
      callback(err);
      return;
    }
    var all_tweets = JSON.parse(res);

    _.each(all_tweets, function(tweet) {
      var d = new Date(tweet.created_at);
      var hour = (d.getDay() * 24) + d.getHours();
      hours[hour].push(tweet);
    });

    var data = _.map(hours, function(tweets, num) {
      var retweets = 0;
      var favorites = 0;
      retweets += (parseInt(_.pluck(tweets, 'retweet_count'), 10) || 0);
      //favorites += (parseInt(_.pluck(tweets, 'favourites_count'), 10) || 0);
      return {
        retweets: retweets,
        //favorites: favorites,
        total_tweets: tweets.length,
        hour: num
      };
    });

    callback(err, data);
  });
}

/*
 * Get the 200 last tweets from screen_name and
 * returns them as JSON in the callback response
 */
function getTwitterData(screen_name, callback){
  http.get('http://api.twitter.com/1/statuses/user_timeline.json?count=200&trim_user=true&screen_name=' + screen_name, function(res) {
    var err = null;
    console.log(err,res)html;
    if(res.statusCode !== 200){
      err = res.statusCode;
    }
    var data = '';
    res.on('data', function(chunk){
      data += chunk;
    });

    res.on('end', function(){callback(err,data);});
  });
}

http.createServer(function(req,res){
  console.log(req.url);
    if(req.url === '/'){
      res.writeHead(200, {'Content-Type': 'text/html'});
      fs.readFile('index.html', function(err, data){
        res.end(data);
      });
    } else if((/^\/user\/\w{1,30}\.json$/i).test(req.url)){
      var user = req.url.match(/\w+/gi);
      user = user[1];
      getTimeline(user,function(err,data){
        if(err){
          res.writeHead(500, {'Content-Type': 'text/plain'});
          res.end("<h2>You killed it!</h2><h3>The user probably doesn't exist</h3><iframe width='560' height='315' src='http://www.youtube.com/embed/CqyEUAoKcz0?start=354&autoplay=1' frameborder='0' allowfullscreen></iframe>");
        } else {
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify(data));
        }
      });
    } else {
      res.writeHead(404, {'Content-Type': 'text/html'});
      res.end("<!DOCTYPE html><html><body><h1 style='font-family: Arial'>404: not found</h1><audio src='http://tts-api.com/tts.mp3?q=This%20page%20is%20not%20found.%20I%20am%20so%20very%20sorry.%20Really.' autoplay></audio></body></html>");
    }
}).listen(8042, '127.0.0.1');
