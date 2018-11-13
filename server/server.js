const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');


const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())
app.use(express.static(__dirname + '/../client/dist'));

app.get('/test*', (req, res) => {
  res.sendFile(path.join(__dirname + '/../client/dist/devclient.html'));
})

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '../client/dist/index.html'));
});

app.listen(3000, function() {
  console.log('Listening on port 3000');
})