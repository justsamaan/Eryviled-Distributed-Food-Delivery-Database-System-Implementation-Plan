const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'food_delivery.db');
const db = new sqlite3.Database(dbPath);

function runSqlScript(filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, '..', '..', '..', 'sql', filename);
    if (!fs.existsSync(filePath)) {
      return resolve();
    }
    const sql = fs.readFileSync(filePath, 'utf-8');
    db.exec(sql, (err) => {
      if (err) {
        console.error(`Error executing ${filename}:`, err.message);
        return reject(err);
      }
      resolve();
    });
  });
}

function initDb() {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        db.run('PRAGMA foreign_keys = ON;');
        await runSqlScript('01_schema.sql');
        await runSqlScript('02_indexes.sql');
        await runSqlScript('03_partitioning.sql');
        await runSqlScript('06_seed_data.sql');
        console.log('Database initialized successfully with 15 normalized tables & seed data!');
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
}

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const startTime = process.hrtime.bigint();
    db.all(sql, params, (err, rows) => {
      const endTime = process.hrtime.bigint();
      const executionTimeMs = Number(endTime - startTime) / 1e6;
      if (err) return reject(err);
      resolve({ rows, executionTimeMs });
    });
  });
};

const execute = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

module.exports = {
  db,
  initDb,
  query,
  execute
};
