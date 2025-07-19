import express, { Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app = express();

app.use(express.json());

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'User API',
      version: '1.0.0',
      description: 'A simple Express User API',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
    components: {
      securitySchemes: {
        basicAuth: {
          type: 'http',
          scheme: 'basic',
        },
      },
    },
    security: [
      {
        basicAuth: [],
      },
    ],
    tags: [
      {
        name: 'Users',
        description: 'API for users'
      }
    ]
  },
  apis: ['api/index.ts'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

let users = [
  {
    user_id: 'TaroYamada',
    password: 'PaSSwd4TY',
    nickname: 'TaroYamada',
    comment: '',
  },
];
// Helper function to validate user_id
const validateUserId = (userId: string | any[]) => {
  if (!userId || typeof userId !== 'string' || userId.length < 6 || userId.length > 20) {
    return false;
  }
  const regex = /^[a-zA-Z0-9]+$/;
  return regex.test(userId);
};

// Helper function to validate password
const validatePassword = (password: string | any[]) => {
  if (!password || typeof password !== 'string' || password.length < 8 || password.length > 20) {
    return false;
  }
  // ASCII characters without spaces or control codes
  const regex = /^[\x21-\x7E]+$/;
  return regex.test(password);
};

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Create a new user account
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - password
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: User ID (6-20 characters, alphanumeric)
 *               password:
 *                 type: string
 *                 description: Password (8-20 characters, ASCII)
 *     responses:
 *       200:
 *         description: Account successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                     nickname:
 *                       type: string
 *       400:
 *         description: Account creation failed
 */
app.post('/signup', (req: Request, res: Response) => {
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

  if (users.find((u) => u.user_id === user_id)) {
    return res.status(400).json({
      message: 'Account creation failed',
      cause: 'already same user_id is used',
    });
  }

  const newUser = {
    user_id,
    password,
    nickname: user_id,
    comment: '',
  };
  users.push(newUser);

  return res.status(200).json({
    message: 'Account successfully created',
    user: {
      user_id: newUser.user_id,
      nickname: newUser.nickname,
    },
  });
});

/**
 * @swagger
 * /users/{user_id}:
 *   get:
 *     summary: Get user details by user_id
 *     tags: [Users]
 *     security:
 *       - basicAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User details by user_id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                     nickname:
 *                       type: string
 *                     comment:
 *                       type: string
 *       401:
 *         description: Authentication Failed
 *       404:
 *         description: No user found
 */
app.get('/users/:user_id', (req: Request, res: Response) => {
  const { user_id } = req.params;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ message: 'Authentication Failed' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authentication Failed' });
  }
  const credentials = Buffer.from(token, 'base64').toString('ascii');
  const [auth_user_id, auth_password] = credentials.split(':');

  const user = users.find((u) => u.user_id === user_id);

  if (!user) {
    return res.status(404).json({ message: 'No user found' });
  }

  // Check if the authenticated user exists and has correct password
  const authUser = users.find((u) => u.user_id === auth_user_id && u.password === auth_password);
  if (!authUser) {
    return res.status(401).json({ message: 'Authentication Failed' });
  }

  return res.status(200).json({
    message: 'User details by user_id',
    user: {
      user_id: user.user_id,
      nickname: user.nickname,
      comment: user.comment,
    },
  });
});

/**
 * @swagger
 * /users/{user_id}:
 *   patch:
 *     summary: Update user details
 *     tags: [Users]
 *     security:
 *       - basicAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *                 description: New nickname (max 30 characters)
 *               comment:
 *                 type: string
 *                 description: New comment (max 100 characters)
 *     responses:
 *       200:
 *         description: User successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     nickname:
 *                       type: string
 *                     comment:
 *                       type: string
 *       400:
 *         description: User updation failed
 *       401:
 *         description: Authentication Failed
 *       403:
 *         description: No Permission for Update
 *       404:
 *         description: No User found
 */
app.patch('/users/:user_id', (req: Request, res: Response) => {
  const { user_id } = req.params;
  const authHeader = req.headers.authorization;
  const { nickname, comment } = req.body;

  if (nickname === undefined && comment === undefined) {
    return res.status(400).json({
      message: 'User updation failed',
      cause: 'required nickname or comment',
    });
  }

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ message: 'Authentication Failed' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authentication Failed' });
  }
  const credentials = Buffer.from(token, 'base64').toString('ascii');
  const [auth_user_id, auth_password] = credentials.split(':');

  if (user_id !== auth_user_id) {
    return res.status(403).json({ message: 'No Permission for Update' });
  }

  let user = users.find((u) => u.user_id === user_id);

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

  return res.status(200).json({
    message: 'User successfully updated',
    user: {
      nickname: user.nickname,
      comment: user.comment,
    },
  });
});

/**
 * @swagger
 * /close:
 *   post:
 *     summary: Close/delete a user account
 *     tags: [Users]
 *     security:
 *       - basicAuth: []
 *     responses:
 *       200:
 *         description: Account and user successfully removed
 *       401:
 *         description: Authentication Failed
 */
app.post('/close', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ message: 'Authentication Failed' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authentication Failed' });
  }
  const credentials = Buffer.from(token, 'base64').toString('ascii');
  const [auth_user_id, auth_password] = credentials.split(':');

  const userIndex = users.findIndex((u) => u.user_id === auth_user_id);

  if (userIndex === -1) {
    return res.status(401).json({ message: 'Authentication Failed' });
  }

  const user = users[userIndex];

  if (user?.password !== auth_password) {
    return res.status(401).json({ message: 'Authentication Failed' });
  }

  users.splice(userIndex, 1);

  return res.status(200).json({
    message: 'Account and user successfully removed',
  });
});

app.listen(3000, () => console.log('Server ready on port 3000.'));

export default app;
