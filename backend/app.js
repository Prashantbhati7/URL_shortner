import express from 'express';

const app = express();

app.use(express.json());


const PORT = process.env.PORT || 5000;

const urlRoutes = require('./routes/url.routes');

app.use('/api/url', urlRoutes);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;