# limpar dataset (artificiais)

docker start mongoEW
docker cp dataset.json mongoEW:/tmp
docker exec -it mongoEW sh

cd tmp
ls

mongoimport -d livros -c livros dataset.json --jsonArray 
# --jsonArray porque aqui o dataset começa e acaba com []

mongosh
use livros

#fazer queries - pedir aos artificiais
#meter as queries na pasta do ex1

# para apagar uma db "x" db.dropDatabase() depois do use "x"

npx express-generator apiDados
#no www, trocar port e colocar console log com o link na função onListening
#no app.js, apagar rotas nao necessarias e modificar as existentes (ex: /books)

#no app.js adicionar:
var mongoose = require('mongoose')

var mongoDB = 'mongodb://localhost:27017/livros'; 
mongoose.connect(mongoDB);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function() {
  console.log('Connected to MongoDB');
});

#criar pastas "models" e "controllers"
cd apiDados
npm i
npm i mongoose
npm start 

#para a ui repetir 
npx express-generator --view=pug UIBooks

#meter o w3.css no public/stylesheetse alterar no layout.pug link(rel='stylesheet', href='/stylesheets/w3.css')

#no www, trocar a port e meter em baixo o console log
#no app.js trocar o router
#no router ir fazendo as rotas a ligas às páginas
cd UIBooks
npm i
npm i axios --save
npm start


#fazer PR.md



