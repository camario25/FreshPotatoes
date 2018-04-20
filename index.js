const sqlite = require('sqlite'),
      Sequelize = require('sequelize'),
      request = require('request'),
      express = require('express'),
      app = express();

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
  timestamps: false
})

Film.belongsTo(Genre);

sequelize.sync()
  .then(() => {
    console.log('hello');
  });
Film.findOne({ include: [Genre] }).then(film => {
  console.log(JSON.stringify(film.dataValues));
})

// ROUTES
app.get('/films/:id/recommendations', getFilmRecommendations);

// ROUTE HANDLER
function getFilmRecommendations(req, res) {
  res.status(500).send('Not Implemented');
}

module.exports = app;
