const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const moment = require('moment');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.DASHBOARD_PORT || 4000;

// Middleware to dynamically set base URLs for dashboard links
app.use((req, res, next) => {
  const protocol = req.protocol;           // 'http' or 'https'
  const hostname = req.hostname;           // domain or IP without port
  const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000; // fallback
  const apiPort = process.env.API_PORT || 3000;

  res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
  res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
  res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

  next();
});

// Basic Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make moment available in templates
app.locals.moment = moment;

// MongoDB connection with retry mechanism
const connectToMongoDB = async () => {
  const maxRetries = 5;
  let retries = 0;
  while (retries < maxRetries) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Dashboard connected to MongoDB');
      break;
    } catch (error) {
      retries++;
      console.log(`❌ Dashboard MongoDB connection attempt ${retries}/${maxRetries} failed:`, error.message);
      if (retries < maxRetries) {
        console.log('⏳ Retrying MongoDB connection in 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.error('💥 Dashboard failed to connect to MongoDB after all retries');
        process.exit(1);
      }
    }
  }
};

// User Schema for dashboard authentication
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'editor'], default: 'editor' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  isActive: { type: Boolean, default: true }
});

const User = mongoose.model('User', UserSchema);

// Article schema
const ArticleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  contentHash: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true },
  url: { type: String, required: true, unique: true },
  source: {
    name: String,
    domain: String,
    feedUrl: String
  },
  author: { type: String, default: 'Unknown' },
  publishedAt: { type: Date, required: true, index: true },
  excerpt: { type: String, maxlength: 500 },
  content: { type: String },
  featuredImage: {
    url: String,
    alt: String,
    width: Number,
    height: Number
  },
  images: [{
    url: String,
    alt: String,
    caption: String
  }],
  categories: [String],
  tags: [String],
  commentCount: { type: Number, default: 0 },
  isDuplicate: { type: Boolean, default: false },
  relevanceScore: { type: Number, default: 0, min: 0, max: 1 },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

const Article = mongoose.model('Article', ArticleSchema);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-super-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600 // lazy session update
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production' && process.env.HTTPS === 'true',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.redirect('/login?message=Please log in to access the dashboard');
  }
};

// Admin-only middleware
const requireAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  } else {
    // Set locals for error template
    const protocol = req.protocol;
    const hostname = req.hostname;
    const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
    const apiPort = process.env.API_PORT || 3000;

    res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
    res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
    res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

    return res.status(403).render('error', {
      error: 'Admin access required for this operation',
      title: 'Access Denied',
      user: req.session?.user || null
    });
  }
};

// Editor or Admin middleware
const requireEditor = (req, res, next) => {
  if (req.session && req.session.user && (req.session.user.role === 'admin' || req.session.user.role === 'editor')) {
    return next();
  } else {
    const protocol = req.protocol;
    const hostname = req.hostname;
    const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
    const apiPort = process.env.API_PORT || 3000;

    res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
    res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
    res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

    return res.status(403).render('error', {
      error: 'Editor access required for this operation',
      title: 'Access Denied',
      user: req.session?.user || null
    });
  }
};

// Authentication Routes (BEFORE protected routes)

// Login page
app.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/');
  }

  res.render('login', {
    title: 'Login - IoT News Dashboard',
    message: req.query.message || '',
    error: req.query.error || ''
  });
});

// Login handler
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.redirect('/login?error=Please provide both username and password');
    }

    const user = await User.findOne({
      username: username.trim(),
      isActive: true
    });

    if (!user) {
      return res.redirect('/login?error=Invalid username or password');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.redirect('/login?error=Invalid username or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Set session
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    console.log(`✅ User ${user.username} (${user.role}) logged in successfully`);
    res.redirect('/?message=Welcome back, ' + user.username);
  } catch (error) {
    console.error('Login error:', error);
    res.redirect('/login?error=Login failed. Please try again.');
  }
});

// Logout handler
app.get('/logout', (req, res) => {
  if (req.session && req.session.user) {
    const username = req.session.user.username;
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
      } else {
        console.log(`✅ User ${username} logged out successfully`);
      }
      res.redirect('/login?message=You have been logged out successfully');
    });
  } else {
    res.redirect('/login');
  }
});

// Create default admin user (run once for setup)
app.get('/setup-admin', async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.send(`
        <h2>⚠️ Admin user already exists</h2>
        <p>Username: <strong>${existingAdmin.username}</strong></p>
        <p>Email: <strong>${existingAdmin.email}</strong></p>
        <p><a href="/login">← Go to Login</a></p>
      `);
    }

    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminUser = new User({
      username: 'admin',
      email: 'admin@iotcommunity.space',
      password: hashedPassword,
      role: 'admin'
    });

    await adminUser.save();
    console.log('✅ Default admin user created');

    res.send(`
      <h2>✅ Admin user created successfully!</h2>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <strong>Login Credentials:</strong><br>
        Username: <code>admin</code><br>
        Password: <code>admin123</code>
      </div>
      <p><strong>⚠️ Important:</strong> Change this password immediately after first login!</p>
      <p><a href="/login">← Go to Login</a></p>
    `);
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).send('Setup failed: ' + error.message);
  }
});

// Change Password Page
app.get('/change-password', requireAuth, (req, res) => {
  res.render('change-password', {
    title: 'Change Password - IoT News Dashboard',
    user: req.session.user,
    error: req.query.error || '',
    success: req.query.success || ''
  });
});

// Change Password Handler
app.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.redirect('/change-password?error=All fields are required');
    }

    if (newPassword !== confirmPassword) {
      return res.redirect('/change-password?error=New passwords do not match');
    }

    if (newPassword.length < 8) {
      return res.redirect('/change-password?error=Password must be at least 8 characters long');
    }

    // Password strength validation
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!strongPassword.test(newPassword)) {
      return res.redirect('/change-password?error=Password must contain uppercase, lowercase, number, and special character');
    }

    // Get user from database
    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.redirect('/change-password?error=User not found');
    }

    // Verify current password
    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      return res.redirect('/change-password?error=Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await User.findByIdAndUpdate(user._id, { 
      password: hashedNewPassword,
      updatedAt: new Date()
    });

    console.log(`✅ Password changed for user ${user.username}`);
    res.redirect('/change-password?success=Password updated successfully');
  } catch (error) {
    console.error('Change password error:', error);
    res.redirect('/change-password?error=Failed to change password');
  }
});

// Profile Management Routes

// Profile Page (GET)
app.get('/profile', requireAuth, async (req, res) => {
  try {
    const userProfile = await User.findById(req.session.user.id);
    if (!userProfile) {
      return res.redirect('/logout');
    }
    
    res.render('profile', {
      title: 'Edit Profile - IoT News Dashboard',
      user: req.session.user,
      userProfile: userProfile,
      error: req.query.error || '',
      success: req.query.success || ''
    });
  } catch (error) {
    console.error('Profile load error:', error);
    const protocol = req.protocol;
    const hostname = req.hostname;
    const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
    const apiPort = process.env.API_PORT || 3000;

    res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
    res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
    res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

    res.status(500).render('error', {
      error: 'Failed to load profile',
      title: 'Profile Error',
      user: req.session.user
    });
  }
});

// Profile Update (POST)
app.post('/profile', requireAuth, async (req, res) => {
  try {
    const { username, email } = req.body;

    // Validation
    if (!username || !email) {
      return res.redirect('/profile?error=All fields are required');
    }

    if (username.length < 3) {
      return res.redirect('/profile?error=Username must be at least 3 characters long');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.redirect('/profile?error=Please enter a valid email address');
    }

    // Check if username or email already exists (except current user)
    const existingUser = await User.findOne({
      $and: [
        { _id: { $ne: req.session.user.id } },
        { $or: [{ username: username.trim() }, { email: email.trim() }] }
      ]
    });

    if (existingUser) {
      if (existingUser.username === username.trim()) {
        return res.redirect('/profile?error=Username already exists');
      }
      if (existingUser.email === email.trim()) {
        return res.redirect('/profile?error=Email already exists');
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.session.user.id,
      {
        username: username.trim(),
        email: email.trim(),
        updatedAt: new Date()
      },
      { new: true }
    );

    // Update session
    req.session.user.username = updatedUser.username;
    req.session.user.email = updatedUser.email;

    console.log(`✅ Profile updated for user ${updatedUser.username}`);
    res.redirect('/profile?success=Profile updated successfully');
  } catch (error) {
    console.error('Profile update error:', error);
    res.redirect('/profile?error=Failed to update profile');
  }
});

// User Management Routes (Admin only)

// Manage Users Page (GET)
app.get('/admin/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    
    res.render('manage-users', {
      title: 'Manage Users - IoT News Dashboard',
      user: req.session.user,
      users: users,
      error: req.query.error || '',
      success: req.query.success || ''
    });
  } catch (error) {
    console.error('Manage users load error:', error);
    const protocol = req.protocol;
    const hostname = req.hostname;
    const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
    const apiPort = process.env.API_PORT || 3000;

    res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
    res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
    res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

    res.status(500).render('error', {
      error: 'Failed to load user management',
      title: 'User Management Error',
      user: req.session.user
    });
  }
});

// Create User (POST)
app.post('/admin/users/create', requireAdmin, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validation
    if (!username || !email || !password || !role) {
      return res.redirect('/admin/users?error=All fields are required');
    }

    if (username.length < 3) {
      return res.redirect('/admin/users?error=Username must be at least 3 characters long');
    }

    if (password.length < 8) {
      return res.redirect('/admin/users?error=Password must be at least 8 characters long');
    }

    if (!['admin', 'editor'].includes(role)) {
      return res.redirect('/admin/users?error=Invalid role selected');
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username: username.trim() }, { email: email.trim() }]
    });

    if (existingUser) {
      if (existingUser.username === username.trim()) {
        return res.redirect('/admin/users?error=Username already exists');
      }
      if (existingUser.email === email.trim()) {
        return res.redirect('/admin/users?error=Email already exists');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = new User({
      username: username.trim(),
      email: email.trim(),
      password: hashedPassword,
      role: role,
      isActive: true
    });

    await newUser.save();

    console.log(`✅ New user created: ${newUser.username} (${newUser.role}) by ${req.session.user.username}`);
    res.redirect('/admin/users?success=User created successfully');
  } catch (error) {
    console.error('Create user error:', error);
    res.redirect('/admin/users?error=Failed to create user');
  }
});

// Toggle User Status (POST)
app.post('/admin/users/:id/toggle', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    // Prevent deactivating yourself
    if (id === req.session.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user status
    await User.findByIdAndUpdate(id, { isActive: active });

    console.log(`✅ User ${user.username} ${active ? 'activated' : 'deactivated'} by ${req.session.user.username}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Toggle user error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Delete User (POST)
app.post('/admin/users/:id/delete', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.session.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user
    await User.findByIdAndDelete(id);

    console.log(`✅ User ${user.username} deleted by ${req.session.user.username}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Edit User Page (GET)
app.get('/admin/users/:id/edit', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userToEdit = await User.findById(id);
    
    if (!userToEdit) {
      return res.redirect('/admin/users?error=User not found');
    }

    res.render('edit-user', {
      title: `Edit User: ${userToEdit.username} - IoT News Dashboard`,
      user: req.session.user,
      userToEdit: userToEdit,
      error: req.query.error || '',
      success: req.query.success || ''
    });
  } catch (error) {
    console.error('Edit user load error:', error);
    res.redirect('/admin/users?error=Failed to load user for editing');
  }
});

// Protect all routes except login and setup
app.use('/login', (req, res, next) => next());
app.use('/setup-admin', (req, res, next) => next());
app.use('/health', (req, res, next) => next());
app.use('/', requireAuth); // This protects all other routes

// Protected Routes

// Dashboard Home - Article List
app.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const search = req.query.search || '';
    const source = req.query.source || '';
    const category = req.query.category || '';

    const query = { isDuplicate: false };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }

    if (source) {
      query['source.domain'] = source;
    }

    if (category) {
      query.categories = { $regex: category, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [articles, total, sources, categories] = await Promise.all([
      Article.find(query).sort({ publishedAt: -1 }).skip(skip).limit(limit).lean(),
      Article.countDocuments(query),
      Article.aggregate([
        { $match: { isDuplicate: false } },
        { $group: { _id: '$source.domain', name: { $first: '$source.name' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Article.aggregate([
        { $match: { isDuplicate: false } },
        { $unwind: '$categories' },
        { $group: { _id: '$categories', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ])
    ]);

    const pages = Math.ceil(total / limit);

    res.render('home', {
      articles,
      currentPage: page,
      totalPages: pages,
      total,
      search,
      selectedSource: source,
      selectedCategory: category,
      sources,
      categories,
      title: 'IoT News Dashboard',
      user: req.session.user,
      message: req.query.message || ''
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    const protocol = req.protocol;
    const hostname = req.hostname;
    const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
    const apiPort = process.env.API_PORT || 3000;

    res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
    res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
    res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

    res.status(500).render('error', {
      error: 'Failed to load articles',
      title: 'Error',
      user: req.session?.user || null
    });
  }
});

// View Single Article
app.get('/article/:id', async (req, res) => {
  try {
    const article = await Article.findOne({ id: req.params.id });
    if (!article) {
      const protocol = req.protocol;
      const hostname = req.hostname;
      const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
      const apiPort = process.env.API_PORT || 3000;

      res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
      res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
      res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

      return res.status(404).render('error', {
        error: 'Article not found',
        title: 'Article Not Found',
        user: req.session?.user || null
      });
    }

    res.render('article', {
      article,
      title: article.title,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error loading article:', error);
    const protocol = req.protocol;
    const hostname = req.hostname;
    const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
    const apiPort = process.env.API_PORT || 3000;

    res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
    res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
    res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

    res.status(500).render('error', {
      error: 'Failed to load article',
      title: 'Error',
      user: req.session?.user || null
    });
  }
});

// Edit Article Form (Editors and Admins only)
app.get('/article/:id/edit', requireEditor, async (req, res) => {
  try {
    const article = await Article.findOne({ id: req.params.id });
    if (!article) {
      const protocol = req.protocol;
      const hostname = req.hostname;
      const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
      const apiPort = process.env.API_PORT || 3000;

      res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
      res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
      res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

      return res.status(404).render('error', {
        error: 'Article not found',
        title: 'Article Not Found',
        user: req.session?.user || null
      });
    }

    res.render('edit', {
      article,
      title: `Edit: ${article.title}`,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error loading article for edit:', error);
    const protocol = req.protocol;
    const hostname = req.hostname;
    const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
    const apiPort = process.env.API_PORT || 3000;

    res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
    res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
    res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

    res.status(500).render('error', {
      error: 'Failed to load article',
      title: 'Error',
      user: req.session?.user || null
    });
  }
});

// Update Article (Editors and Admins only)
app.post('/article/:id/edit', requireEditor, async (req, res) => {
  try {
    const { title, excerpt, content, author, categories, tags } = req.body;

    const updateData = {
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: content,
      author: author.trim(),
      categories: categories ? categories.split(',').map(cat => cat.trim()).filter(Boolean) : [],
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      updatedAt: new Date()
    };

    await Article.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    );

    console.log(`✅ Article ${req.params.id} updated by ${req.session.user.username}`);
    res.redirect(`/article/${req.params.id}?updated=true`);
  } catch (error) {
    console.error('Error updating article:', error);
    const protocol = req.protocol;
    const hostname = req.hostname;
    const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
    const apiPort = process.env.API_PORT || 3000;

    res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
    res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
    res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

    res.status(500).render('error', {
      error: 'Failed to update article',
      title: 'Update Error',
      user: req.session?.user || null
    });
  }
});

// Delete Article (Admins only)
app.post('/article/:id/delete', requireAdmin, async (req, res) => {
  try {
    const article = await Article.findOne({ id: req.params.id });
    if (!article) {
      return res.redirect('/?error=Article not found');
    }

    await Article.findOneAndDelete({ id: req.params.id });
    console.log(`✅ Article ${req.params.id} deleted by ${req.session.user.username}`);
    res.redirect('/?message=Article deleted successfully');
  } catch (error) {
    console.error('Error deleting article:', error);
    const protocol = req.protocol;
    const hostname = req.hostname;
    const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
    const apiPort = process.env.API_PORT || 3000;

    res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
    res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
    res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

    res.status(500).render('error', {
      error: 'Failed to delete article',
      title: 'Delete Error',
      user: req.session?.user || null
    });
  }
});

// Statistics Page
app.get('/stats', async (req, res) => {
  try {
    const [
      totalArticles,
      sourcesStats,
      categoriesStats,
      recentStats
    ] = await Promise.all([
      Article.countDocuments({ isDuplicate: false }),
      Article.aggregate([
        { $match: { isDuplicate: false } },
        { $group: {
          _id: '$source.domain',
          name: { $first: '$source.name' },
          count: { $sum: 1 },
          latestArticle: { $max: '$publishedAt' }
        }},
        { $sort: { count: -1 } }
      ]),
      Article.aggregate([
        { $match: { isDuplicate: false } },
        { $unwind: '$categories' },
        { $group: { _id: '$categories', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 }
      ]),
      Article.aggregate([
        { $match: {
          isDuplicate: false,
          publishedAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) }
        }},
        { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$publishedAt" } },
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ])
    ]);

    res.render('stats', {
      totalArticles,
      sources: sourcesStats,
      categories: categoriesStats,
      recentStats,
      title: 'Dashboard Statistics',
      user: req.session.user
    });
  } catch (error) {
    console.error('Error loading statistics:', error);
    const protocol = req.protocol;
    const hostname = req.hostname;
    const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
    const apiPort = process.env.API_PORT || 3000;

    res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
    res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
    res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

    res.status(500).render('error', {
      error: 'Failed to load statistics',
      title: 'Statistics Error',
      user: req.session?.user || null
    });
  }
});

// Health Check (Unprotected)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'iot-news-dashboard',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    authentication: 'enabled'
  });
});

// Error handler (important: set locals here!)
app.use((error, req, res, next) => {
  console.error('Dashboard error:', error);

  // Inject res.locals so error.ejs has access to those variables
  const protocol = req.protocol;
  const hostname = req.hostname;
  const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
  const apiPort = process.env.API_PORT || 3000;

  res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
  res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
  res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

  res.status(500).render('error', {
    error: 'Internal server error',
    title: 'Server Error',
    user: req.session?.user || null
  });
});

// 404 handler (also inject locals)
app.use((req, res) => {
  const protocol = req.protocol;
  const hostname = req.hostname;
  const dashboardPort = req.socket.localPort || process.env.DASHBOARD_PORT || 4000;
  const apiPort = process.env.API_PORT || 3000;

  res.locals.dashboardBaseUrl = `${protocol}://${hostname}:${dashboardPort}`;
  res.locals.apiBaseUrl = `${protocol}://${hostname}:${apiPort}`;
  res.locals.apiHealthUrl = `${res.locals.apiBaseUrl}/health`;

  res.status(404).render('error', {
    error: 'Page not found',
    title: '404 - Page Not Found',
    user: req.session?.user || null
  });
});

// Start server
const startServer = async () => {
  await connectToMongoDB();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 IoT News Dashboard running on port ${PORT}`);
    console.log(`📊 Dashboard URL: http://localhost:${PORT}`);
    console.log(`🔐 Authentication: ENABLED`);
    console.log(`👤 Setup admin user: http://localhost:${PORT}/setup-admin`);
  });
};

startServer().catch(error => {
  console.error('💥 Failed to start dashboard:', error);
  process.exit(1);
});

module.exports = app;
