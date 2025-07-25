const express = require('express');
const cors = require('cors');
const app = express();

const policyRoutes = require('./routes/policyRoutes');

app.use(cors());
app.use(express.json());

app.use('/api/policies', policyRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
  
});
