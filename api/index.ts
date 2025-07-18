const express = require('express');
const app = express();

app.use(express.json());

// interface User {
//   user_id: string;
//   password: string;
//   nickname: string;
//   comment: string;
// }

// let users: User[] = [];
let users = [];

// Add the reserved test user
users.push({
  user_id: 'TaroYamada',
  password: 'PaSSwd4TY',
  nickname: 'TaroYamada',
  comment: ''
});

// Helper function to validate user_id
const validateUserId = (userId) => {
  if (!userId || typeof userId !== 'string' || userId.length < 6 || userId.length > 20) {
    return false;
  }
  const regex = /^[a-zA-Z0-9]+$/;
  return regex.test(userId);
};

// Helper function to validate password
const validatePassword = (password) => {
  if (!password || typeof password !== 'string' || password.length < 8 || password.length > 20) {
    return false;
  }
  // ASCII characters without spaces or control codes
  const regex = /^[\x21-\x7E]+$/;
  return regex.test(password);
};

app.get('/', function (req, res) {
	res.status(200).send('<h1>Hello</h1>');
});

app.post('/signup', (req, res) => {
  const { user_id, password } = req.body;

  // Check if user_id and password are provided
  if (!user_id || !password) {
    return res.status(400).json({
      message: 'Account creation failed',
      cause: 'required user_id and password',
    });
  }

  // Validate user_id
  if (!validateUserId(user_id)) {
    return res.status(400).json({
      message: 'Account creation failed',
      cause: 'user_id does not meet requirements',
    });
  }

  // Validate password
  if (!validatePassword(password)) {
    return res.status(400).json({
      message: 'Account creation failed',
      cause: 'password does not meet requirements',
    });
  }

  if (users.find(u => u.user_id === user_id)) {
    return res.status(400).json({
      message: 'Account creation failed',
      cause: 'already same user_id is used',
    });
  }

  const newUser = {
    user_id,
    password,
    nickname: user_id,
    comment: ''
  };
  users.push(newUser);

  res.status(200).json({
    message: 'Account successfully created',
    user: {
      user_id: newUser.user_id,
      nickname: newUser.nickname,
    },
  });
});

app.get('/users/:user_id', (req, res) => {
  const { user_id } = req.params;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ message: 'Authentication Failed' });
  }

  const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('ascii');
  const [auth_user_id, auth_password] = credentials.split(':');

  const user = users.find(u => u.user_id === user_id);

  if (!user) {
    return res.status(404).json({ message: 'No user found' });
  }

  // Check if the authenticated user exists and has correct password
  const authUser = users.find(u => u.user_id === auth_user_id && u.password === auth_password);
  if (!authUser) {
    return res.status(401).json({ message: 'Authentication Failed' });
  }

  res.status(200).json({
    message: 'User details by user_id',
    user: {
      user_id: user.user_id,
      nickname: user.nickname,
      comment: user.comment,
    },
  });
});

app.patch('/users/:user_id', (req, res) => {
    const { user_id } = req.params;
    const authHeader = req.headers.authorization;
    const { nickname, comment } = req.body;

    if (nickname === undefined && comment === undefined) {
        return res.status(400).json({
            message: "User updation failed",
            cause: "required nickname or comment"
        });
    }

    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return res.status(401).json({ message: 'Authentication Failed' });
    }

    const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('ascii');
    const [auth_user_id, auth_password] = credentials.split(':');

    if (user_id !== auth_user_id) {
        return res.status(403).json({ message: "No Permission for Update" });
    }

    let user = users.find(u => u.user_id === user_id);

    if (!user) {
        return res.status(404).json({ message: 'No User found' });
    }

    if (user.password !== auth_password) {
        return res.status(401).json({ message: 'Authentication Failed' });
    }

    if (nickname !== undefined) {
        if (typeof nickname !== 'string' || nickname.length > 30) {
            return res.status(400).json({ message: 'User updation failed', cause: 'Invalid nickname' });
        }
        user.nickname = nickname === '' ? user.user_id : nickname;
    }

    if (comment !== undefined) {
        if (typeof comment !== 'string' || comment.length > 100) {
            return res.status(400).json({ message: 'User updation failed', cause: 'Invalid comment' });
        }
        user.comment = comment;
    }

    res.status(200).json({
        message: "User successfully updated",
        user: {
            nickname: user.nickname,
            comment: user.comment
        }
    });
});

app.post('/close', (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return res.status(401).json({ message: 'Authentication Failed' });
    }

    const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('ascii');
    const [auth_user_id, auth_password] = credentials.split(':');

    const userIndex = users.findIndex(u => u.user_id === auth_user_id);
    
    if (userIndex === -1) {
        return res.status(401).json({ message: 'Authentication Failed' });
    }
    
    const user = users[userIndex];
    
    if (user.password !== auth_password) {
        return res.status(401).json({ message: 'Authentication Failed' });
    }

    users.splice(userIndex, 1);

    res.status(200).json({
        message: "Account and user successfully removed"
    });
});


app.listen(3000, () => console.log('Server ready on port 3000.'));

module.exports = app;
