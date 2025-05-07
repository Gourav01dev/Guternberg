const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/books', async (req, res) => {
  const {
    gutenberg_id,
    language,
    mime_type,
    topic,
    author,
    title,
    page = 1,
  } = req.query;
    
  const offset = (page - 1) * 25;
  const values = [];
  let conditions = [];

  // Handle filters
  if (gutenberg_id) {
    const ids = gutenberg_id.split(',').map(Number).filter(id => !isNaN(id));
    if (ids.length) {
      conditions.push(`bb.gutenberg_id = ANY($${values.length + 1}::int[])`);
      values.push(ids);
    }
  }

  if (language) {
    const langs = language.split(',').map(code => code.trim());
    conditions.push(`bl.code = ANY($${values.length + 1}::text[])`);
    values.push(langs);
  }

  if (mime_type) {
    conditions.push(`bf.mime_type ILIKE $${values.length + 1}`);
    values.push(`%${mime_type}%`);
  }
   
  if (topic) {
    const topicValue = `%${topic}%`;
    conditions.push(`(
      bs.name ILIKE $${values.length + 1} OR
      bsh.name ILIKE $${values.length + 1}
    )`);
    values.push(topicValue);
  }

  if (author) {
    conditions.push(`ba.name ILIKE $${values.length + 1}`);
    values.push(`%${author}%`);
  }

  if (title) {
    conditions.push(`bb.title ILIKE $${values.length + 1}`);
    values.push(`%${title}%`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    WITH book_data AS (
      SELECT 
        bb.id,
        bb.title,
        bb.download_count,
        bb.gutenberg_id,
        json_agg(DISTINCT ba.*) AS authors,
        json_agg(DISTINCT bl.code) AS languages,
        json_agg(DISTINCT bs.name) AS subjects,
        json_agg(DISTINCT bsh.name) AS bookshelves,
        json_agg(DISTINCT jsonb_build_object('type', bf.mime_type, 'url', bf.url)) AS formats
      FROM books_book bb
      LEFT JOIN books_book_authors bba ON bb.id = bba.book_id
      LEFT JOIN books_author ba ON bba.author_id = ba.id
      LEFT JOIN books_book_languages bbl ON bb.id = bbl.book_id
      LEFT JOIN books_language bl ON bbl.language_id = bl.id
      LEFT JOIN books_book_subjects bbs ON bb.id = bbs.book_id
      LEFT JOIN books_subject bs ON bbs.subject_id = bs.id
      LEFT JOIN books_book_bookshelves bbb ON bb.id = bbb.book_id
      LEFT JOIN books_bookshelf bsh ON bbb.bookshelf_id = bsh.id
      LEFT JOIN books_format bf ON bb.id = bf.book_id
      ${whereClause}
      GROUP BY bb.id
    )
    SELECT COUNT(*) OVER() AS total, *
    FROM book_data
    ORDER BY download_count DESC
    OFFSET $${values.length + 1} LIMIT 25;
  `;
    
  try {
    const result = await pool.query(query, [...values, offset]);
    const total = result.rows[0]?.total || 0;

    res.json({
      total,
      books: result.rows.map(({ total, ...book }) => book)
    });
  } catch (err) {
    console.error('Error fetching books:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
