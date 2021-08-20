const { response,request } = require('express');
require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const PORT = process.env.PORT;

app.use(express.static('build'));
app.use(express.json());
app.use(cors());

const Person = require('./models/person');

//En ollut täysin varma mitä kaikkia tokeneita tähän haluttiin, koska osa palauttaa vain numeroita. 
app.use(morgan(`:method :url :status :total-time[4] ms :body`))

const errorHandler = (error, request, response, next) => {
  //console.error("error message:",error.message)
  //console.log("error.name:",error.name)
  
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if ( error.name === 'content missing') {
      return response.status(400).json({error: "content missing"})
  }  else if (error.name === 'ValidationError') {
      return response.status(400).json({ error: error.message })
  }
 
 next(error)
}

//Request tokens
morgan.token('body', function(request) {
  let body = JSON.stringify(request.body)
  //console.log(body)
  return body;
});

//app.post käytössä - Muistiinpanon luominen/info
let globaaliPersonVariable = ["tyhjä"];
async function personFind () { 
  await Person.find({}).then(persons => {
    globaaliPersonVariable = persons;
    return globaaliPersonVariable;
  })
return globaaliPersonVariable
}

//kaikkien haku
app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons);
  })
}) 

//Id haku
app.get('/api/persons/:id', (request, response, next) => {

//console.log("request params id:",request.params.id )
const id = Number(request.params.id);
Person.findById(id)
  .then(person => {
    if(person) {
      response.json(person)
    } else {
      response.status(404).end();
    }
  }).catch(error => next(error))
})

//info 
app.get('/info', async (req, res) => {
  let persons = await personFind ();
    let date = new Date();
    res.send(`<p>Phonebook has info for ${persons.length} people</p> <br>
    ${date.toString()}`)
}) 

/*
//Muistiinpanon luominen - tarkistaa onko nimi listassa
 function nameCheck(name, personList) {

  let returnValue = 0;
  let i =0;
 
  while (returnValue !== true && i < personList.length) {
    returnValue = personList[i].name === name;
    i++;
  }
  return returnValue; 
}
*/

//Muistiinpanon luominen
app.post('/api/persons', async (request, response, next) => {
  let body = request.body

  if (!body.name || !body.number) {
  let er = new Error('custom error')
  er.name = 'content missing';
  er.message = 'content missing';
  next(er)
  return response.send()
  }

  const person = new Person({
    _id: Math.floor(Math.random()*1000000),
    name: request.body.name,
    number: request.body.number
  })

  person.save().then(savedPerson => {
    response.json(savedPerson)
  })
  .catch(error => next(error)) 
})

//poistaa id perusteella 
app.delete('/api/persons/:id', (request,response,next) => {

  let delID =  Number(request.params.id);
  Person.findByIdAndRemove(delID)
    .then(result => {
      response.status(204).end()
    })
    .catch(error =>    next(error))
}); 
        
//Henkilön tietojen muutto id avulla
app.put('/api/persons/:id', (request, response, next) => {

  const body = request.body

  console.log("update number:",request.body.number)
  const person = {
    name: request.body.name,
    number: request.body.number
  }

  Person.findByIdAndUpdate(request.params.id, person, { new: true })
    .then(updatedPerson => {
      console.log("Updated:",updatedPerson)
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})


app.use(errorHandler);



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})