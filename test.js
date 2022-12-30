
const environments =  require('./environments.js');
const express =  require('express');
const app =  express();
let mode = '';

console.log(`NODE_ENV=${environments.NODE_ENV}`);

app.get('/', (req, res) => {
    res.send('Hello World !!');
});

app.listen(environments.PORT, environments.HOST, () => {
    console.log(`APP LISTENING ON http://${environments.HOST}:${environments.PORT}`);
})