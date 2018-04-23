const sqlite = require('sqlite'),
      Sequelize = require('sequelize'),
      Op = Sequelize.Op,
      request = require('request'),
      express = require('express'),
      app = express(),
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
app.get('*', function(req, res) {
  res.status(404).json({
    message: 'route not found'
  })
})

//GET AVERAGE
function getAverageRating(reviewArr) {
  let sum = 0;
  // console.log(reviewArr[0]);
  reviewArr.forEach( review => {
    sum += review.rating;
  })
  return sum / reviewArr.length;
}

// ROUTE HANDLER
function getFilmRecommendations(req, res) {
  let limit = 10;
  let offset = 0;
  let orgId = req.params.id;
  
  
  if(req.query.limit) {
    limit = parseInt(req.query.limit);
  }
  if(req.query.offset) {
    offset = parseInt(req.query.limit);
  }
  
  if (!Number.isInteger(parseInt(orgId))) {
    res.status(422).json({
      message: 'invalid entry'
    })
  }

  Film.findById(orgId).then(film => {
    const relDate = moment(film.release_date);
    const before15 = relDate.subtract(15,'years').format('YYYY-MM-DD');
    let after15 = relDate.add(15, 'years').format('YYYY-MM-DD');

    Film.findAll({
      where: {
        genre_id: film.genre_id,
        release_date: {
          $between: [before15, after15]
        }
      },
      include: [Genre]
      // order: ['id']
    }).then(films => {
      // console.log(films);
      let filmIds = films.map(film => {
        return film.id
      });

      let idString = filmIds.join(',');
      let filteredArray = [];
      
      request(`http://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1?films=${idString}`, (err, response, body) =>{
        if (err){
          throw ( err => {
            console.log(err);
            res.status(500).json({
              message: 'server error'
            })
          })
        } else
        filmIdReviews = JSON.parse(response.body);
        filmIdReviews.forEach(filmRevs => {
          // console.log(filmRevs);
          if(filmRevs.reviews.length >=5 && (getAverageRating(filmRevs.reviews) > 4)) {
            films.forEach(flm => {
            // console.log(filmRevs.reviews);
            // console.log(getAverageRating(filmRevs.reviews));
            if (flm.id === filmRevs.film_id){
            filteredArray.push({
              id: filmRevs.film_id,
              title: flm.title,
              releaseDate: flm.release_date,
              genre: flm.genre.name,
              reviews: filmRevs.reviews.length,
              averageRating: getAverageRating(filmRevs.reviews)
                })
            
              }
            })

          }
        })
              console.log(filteredArray);
             res.status(200).json({
               recommendations: filteredArray.slice(offset, offset+limit),
               meta: {limit: limit, offset: offset}
             })
      })
    })
  })
  .catch ( err => {
    console.log(err);
    res.status(422).json({
      message: 'missing key'
    })
  })
}

module.exports = app;
