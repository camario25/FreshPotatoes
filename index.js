const sqlite = require('sqlite'),
      Sequelize = require('sequelize'),
      request = require('request'),
      express = require('express'),
      app = express(),
      Op = Sequelize.Op,
      moment = require('moment')

const sequelize = new Sequelize({
  host: 'localhost',
  database: null,
  username: null,
  password: null,
  dialect: 'sqlite',
  storage: './db/database.db'
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

const { PORT=3000, NODE_ENV='development', DB_PATH='./db/database.db' } = process.env;

// START SERVER
Promise.resolve()
  .then(() => app.listen(PORT, () => console.log(`App listening on port ${PORT}`)))
  .catch((err) => { if (NODE_ENV === 'development') console.error(err.stack); });


const Film = sequelize.define('film', {
  title: Sequelize.STRING,
  release_date: Sequelize.DATE,
  tagline: Sequelize.STRING,
  revenue: Sequelize.BIGINT,
  budget: Sequelize.BIGINT,
  runtime: Sequelize.INTEGER,
  original_language: Sequelize.STRING,
  status: Sequelize.STRING,
  genre_id: Sequelize.INTEGER
},{
  timestamps: false,
  underscored: true
});

const Genre = sequelize.define('genre', {
  name: Sequelize.STRING
}, {
  timestamps: false,
  underscored: true
})

Film.belongsTo(Genre);

sequelize.sync();


// ROUTES
app.get('/films/:id/recommendations', getFilmRecommendations);

// ROUTE HANDLER
function getFilmRecommendations(req, res) {
  let limit = 7;
  let offset = 0;
  let orgId = parseInt(req.params.id);
  
  if(req.query.limit) {
    limit = parseInt(req.query.limit);
  }
  if(req.query.offset) {
    offset = parseInt(req.query.limit);
  }

  Film.findById(orgId).then(film => {
    let before15 = moment(film.dataValues.release_date).subtract(15,'years').format('YYYY-MM-DD');
    let after15 = moment(film.release_date).add(15, 'years').format('YYYY-MM-DD');
    Film.findAll({
      where: {
        // [Op.and]: {
        genre_id: film.genre_id
        // release_date: {
        //   [Op.gte]: before15,
        //   [Op.lte]: after15
        //   }
        // }
      }
    }).then(films => {
      console.log(films[0].dataValues.title);
      res.status(200).send(films[0].dataValues.title);
    })

  });

  // Film.findOne({
  //   where: {id: req.params.id }}{ include: [Genre]}).then(film => {
  //   res.status(200).send(req.params.id);
  //   console.log(JSON.stringify(film.dataValues.genre.name));
  // })
  // 
}

module.exports = app;
