const express = require('express');
const app = express();
const booksRoutes = require('./routes/books'); // ✅ Make sure the path and name are correct
require('dotenv').config();

app.use(express.json());
app.use('/api', booksRoutes); // ⬅️ This makes /api/authors work

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
