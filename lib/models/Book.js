const pool = require('../utils/pool');
const Author = require('./Author');

class Book {
  id;
  title;
  released;

  constructor(row) {
    this.id = row.id;
    this.title = row.title;
    this.released = row.released;
    this.authors = row.authors?.map(x => new Author(x));
  }

  static async getAll() {
    const { rows } = await pool.query('select * from books');
    return rows.map(row => new Book(row));
  }

  static async getById(id) {
    const { rows } = await pool.query(`
      select
        books.*,
        COALESCE(
          json_agg(json_build_object('id', authors.id::varchar, 'name', authors.name))
          FILTER (WHERE authors.id IS NOT NULL), '[]'
        ) AS authors
        from books
      left join authors_books on books.id = authors_books.book_id
      left join authors on authors_books.author_id = authors.id
      where books.id = $1
      group by books.id;
    `,
    [id]
    );

    if (rows.length <= 0) throw new Error(`no book with id=${id}`);

    return new Book(rows[0]);
  }
}

module.exports = Book;