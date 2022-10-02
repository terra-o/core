import express from 'express'

const app = express()

app.get('/resources', (request, response) => response.send('Resources'))

export { app }
