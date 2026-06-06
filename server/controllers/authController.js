const fs = require('fs').promises;
const path = require('path');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const USERS_FILE_PATH = path.resolve(__dirname, '..', '..', 'users.json');

async function ensureUsersFile() {
  try {
    await fs.access(USERS_FILE_PATH);
  } catch (err) {
    await fs.writeFile(USERS_FILE_PATH, '[]', 'utf8');
  }
}

async function loadUsersFile() {
  await ensureUsersFile();
  const raw = await fs.readFile(USERS_FILE_PATH, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

async function saveUsersFile(users) {
  await fs.writeFile(USERS_FILE_PATH, JSON.stringify(users, null, 2), 'utf8');
}

async function findUserInFile(email) {
  const users = await loadUsersFile();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase());
}

async function persistUserToFile(user) {
  const users = await loadUsersFile();
  users.push({
    name: user.name,
    email: user.email,
    password: user.password,
    createdAt: new Date().toISOString()
  });
  await saveUsersFile(users);
}

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    const existingFile = await findUserInFile(email);
    if (existing || existingFile) return res.status(400).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hash });
    await persistUserToFile({ name, email, password: hash });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    let user = await User.findOne({ email });
    let isFileUser = false;

    if (!user) {
      const fileUser = await findUserInFile(email);
      if (fileUser) {
        user = fileUser;
        isFileUser = true;
      }
    }

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: isFileUser ? email : user._id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    res.json({ token, user: { id: isFileUser ? email : user._id, email: user.email, name: user.name || '' } });
  } catch (err) {
    next(err);
  }
};
