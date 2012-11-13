var http = require('http');
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
    if(req.url === '/'){
      res.writeHead(200, {'Content-Type': 'text/html'});
      //More files === less fun
      var html = "<!DOCTYPE html><html>"+
        "<head><title>Tweet Week</title>"+
        "<link href='//netdna.bootstrapcdn.com/twitter-bootstrap/2.2.1/css/bootstrap.no-responsive.no-icons.min.css' rel='stylesheet'>"+
        "<link href='http://fonts.googleapis.com/css?family=Montserrat:700' rel='stylesheet' type='text/css'>"+
      "<script language='javascript' type='text/javascript' src='//cdnjs.cloudflare.com/ajax/libs/jquery/1.8.2/jquery.min.js'></script>"+
        "<script language='javascript' type='text/javascript' src='//cdnjs.cloudflare.com/ajax/libs/flot/0.7/jquery.flot.min.js'></script>"+
        "<script language='javascript' type='text/javascript' src='//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.2/underscore-min.js '></script>"+
        "</head>"+
        "<body style='font-family: &quot;Montserrat&quot;, sant-serif;'>"+
        "<div class='container offset-1'>"+
        "<h1>Tweet Week</h1>"+
        "<p>Enter your twitter handle to get to know when you should post your next tweet to get as many retweets as possible</p>"+
        "<div class='row offset1'>"+
        "<div id='searchbuttons' class='input-append'>"+
        "<input id='search' type='text' class='span3' placeholder='Twitter handle'>"+
        "<button class='btn' onclick='renderGraph()'>Search!</button>"+
        "</div></div>"+
        "<div id='graph' style='width:1100px; height: 400px;'></div>"+
        "A <a href='http://pttr.se'>pttr</a> production</p>"+
        "<script>function renderGraph(){$.getJSON('/user/'+$('#search').val()+'.json',function(){}).success(function(data){"+
        "var total = _.map(data,function(hours){return [hours.hour,hours.total_tweets];});"+
        "var rts = _.map(data,function(hours){return [hours.hour,hours.retweets];});"+
        "$.plot($('#graph'),[{label: 'tweets', data: total},{label: 'retweets', data: rts}],{series:{ lines: {show: true}, points: {show: true}}, xaxis: { ticks: [[0, 'Sunday'], ,[12, '12:00'], [24, 'Monday'],[36,'12:00'],[48, 'Tuesday'],[60, '12:00'],[72,'Wednesday'],[84,'12:00'],[96, 'Thursday'],[108,'12:00'],[120,'Friday'],[132,'12:00'],[144,'Saturday'],[156,'12:00']]}});"+
        "}).error(function(data){if(data.status === 500){$('#graph').prepend(data.responseText);}})}</script>"+
        "</div></body></html>";
      res.end(html);
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
