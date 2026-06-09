import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class QueryHelper {
  constructor(data, promiseFn) {
    this.data = data;
    this.promiseFn = promiseFn;
    this._sort = null;
    this._limit = null;
    this._skip = null;
  }

  sort(sortObj) {
    this._sort = sortObj;
    return this;
  }

  limit(limitVal) {
    this._limit = limitVal;
    return this;
  }

  skip(skipVal) {
    this._skip = skipVal;
    return this;
  }

  async execute() {
    let result = [...this.data];

    // Sorting
    if (this._sort) {
      const keys = Object.keys(this._sort);
      result.sort((a, b) => {
        for (const key of keys) {
          const dir = this._sort[key];
          const valA = a[key];
          const valB = b[key];
          if (valA < valB) return dir === -1 ? 1 : -1;
          if (valA > valB) return dir === -1 ? -1 : 1;
        }
        return 0;
      });
    }

    // Skip & Limit
    if (this._skip !== null) {
      result = result.slice(this._skip);
    }
    if (this._limit !== null) {
      result = result.slice(0, this._limit);
    }

    return result;
  }

  // Thenable interface so users can await the query helper directly
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
}

export class LocalModel {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name.toLowerCase()}s.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  _read() {
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(content || '[]');
    } catch (err) {
      console.error(`Error reading local db file ${this.filePath}:`, err);
      return [];
    }
  }

  _write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(`Error writing local db file ${this.filePath}:`, err);
    }
  }

  _matches(item, query) {
    if (!query || Object.keys(query).length === 0) return true;
    for (const key of Object.keys(query)) {
      // Handle simple dot notation or basic match
      if (query[key] !== item[key]) {
        // Simple regex fallback
        if (query[key] instanceof RegExp) {
          if (!query[key].test(item[key])) return false;
        } else if (typeof query[key] === 'object' && query[key] !== null) {
          // Handle operator fields (e.g. $in)
          if (query[key].$in && Array.isArray(query[key].$in)) {
            if (!query[key].$in.includes(item[key])) return false;
          } else {
            return false;
          }
        } else {
          return false;
        }
      }
    }
    return true;
  }

  find(query = {}) {
    const data = this._read();
    const filtered = data.filter(item => this._matches(item, query));
    return new QueryHelper(filtered);
  }

  async findOne(query = {}) {
    const data = this._read();
    const found = data.find(item => this._matches(item, query));
    return found || null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(doc) {
    const data = this._read();
    const now = new Date().toISOString();
    const newDoc = {
      _id: Math.random().toString(36).substring(2, 11),
      createdAt: now,
      updatedAt: now,
      timestamp: now,
      ...doc
    };
    data.push(newDoc);
    this._write(data);
    return newDoc;
  }

  async updateOne(query, update, options = {}) {
    const data = this._read();
    let updatedCount = 0;
    const updatedData = data.map(item => {
      if (this._matches(item, query) && updatedCount === 0) {
        updatedCount++;
        let changes = {};
        if (update.$set) {
          changes = update.$set;
        } else {
          changes = update;
        }
        return {
          ...item,
          ...changes,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });

    if (updatedCount > 0) {
      this._write(updatedData);
      return { matchedCount: 1, modifiedCount: 1 };
    }

    if (options.upsert) {
      const setFields = update.$set || update;
      const newDoc = await this.create({ ...query, ...setFields });
      return { matchedCount: 0, modifiedCount: 1, upsertedId: newDoc._id };
    }

    return { matchedCount: 0, modifiedCount: 0 };
  }

  async updateMany(query, update) {
    const data = this._read();
    let modifiedCount = 0;
    const updatedData = data.map(item => {
      if (this._matches(item, query)) {
        modifiedCount++;
        let changes = {};
        if (update.$set) {
          changes = update.$set;
        } else {
          changes = update;
        }
        return {
          ...item,
          ...changes,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });

    this._write(updatedData);
    return { matchedCount: modifiedCount, modifiedCount };
  }

  async deleteOne(query) {
    const data = this._read();
    const index = data.findIndex(item => this._matches(item, query));
    if (index !== -1) {
      data.splice(index, 1);
      this._write(data);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async deleteMany(query) {
    const data = this._read();
    const initialLength = data.length;
    const remaining = data.filter(item => !this._matches(item, query));
    this._write(remaining);
    return { deletedCount: initialLength - remaining.length };
  }

  async countDocuments(query = {}) {
    const data = this._read();
    return data.filter(item => this._matches(item, query)).length;
  }
}
