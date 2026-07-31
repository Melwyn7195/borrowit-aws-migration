# BorrowIt Backend API

A RESTful API for BorrowIt - A rental platform where users can rent and lend items.

## 🎯 Overview

BorrowIt is a peer-to-peer rental marketplace backend that allows users to:
- Register and authenticate as customers or sellers
- List items for rent
- Browse and search available products
- Manage rental transactions
- Rate and review products and users

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (via `postgres` package) — Amazon RDS in AWS, a local
  instance in development
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **API Documentation**: OpenAPI 3.0 + Swagger UI
- **Development**: nodemon

## 📁 Project Structure

```
be/
├── controllers/          # Request handlers and business logic
│   ├── userController.js     # User authentication and management
│   └── productController.js  # Product CRUD operations
├── models/              # Database models and queries
│   ├── User.js              # User model with DB operations
│   └── Product.js           # Product model with DB operations
├── routes/              # API route definitions
│   ├── userRoutes.js        # User-related endpoints
│   └── productRoutes.js     # Product-related endpoints
├── db/                  # Database configuration and schema
│   ├── index.js             # PostgreSQL connection setup
│   └── schema.sql           # Database schema definitions
├── .env.example         # Documented template — copy to .env
├── .env                 # Your local config (gitignored)
├── index.js            # Application entry point
├── openapi.yaml        # OpenAPI/Swagger specification
├── package.json        # Project dependencies and scripts
└── README.md           # This file
```

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Frontend)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Express Server                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Middleware Layer                                       │ │
│  │  - CORS                                                 │ │
│  │  - Body Parser                                          │ │
│  │  - Cookie Parser                                        │ │
│  │  - Error Handler                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Routes Layer                                           │ │
│  │  - /api/users                                           │ │
│  │  - /api/products                                        │ │
│  │  - /health                                              │ │
│  │  - /api-docs (Swagger)                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Controllers Layer                                      │ │
│  │  - Business Logic                                       │ │
│  │  - Request Validation                                   │ │
│  │  - Response Formatting                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Models Layer                                           │ │
│  │  - Database Queries                                     │ │
│  │  - Data Validation                                      │ │
│  │  - Business Rules                                       │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                        │
│  - User Table                                                │
│  - Product Table                                             │
│  - Other Tables...                                           │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Melwyn7195/borrowit-aws-migration.git
   cd borrowit-aws-migration/Renting-Online-Backend-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the example file and fill it in:

   ```bash
   cp .env.example .env
   ```

   Every variable is documented there. The minimum for local development is
   `DATABASE_URL` pointing at a local PostgreSQL, `DB_SSL=disable`, and a
   `JWT_SECRET`. Generate one with:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   In AWS none of this comes from a file — the database credentials are injected
   into the task definition from Secrets Manager, and `.env` is gitignored.

4. **Load the database schema**

   ```bash
   npm run migrate db/schema.sql
   npm run seed          # optional: demo users and products
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3456`

## 📚 API Documentation

Once the server is running, you can access the interactive API documentation at:

**Swagger UI**: [http://localhost:3456/api-docs](http://localhost:3456/api-docs)

### Quick API Overview

#### Authentication Endpoints
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login and get JWT token

#### User Endpoints
- `GET /api/users` - Get all users (with pagination and filters)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### Product Endpoints
- `GET /api/products` - Get all products (with pagination and filters)
- `POST /api/products` - Create new product
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/seller/:sellerId` - Get products by seller
- `GET /api/products/categories/list` - Get all categories

#### System Endpoints
- `GET /health` - Health check

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

Example request:
```bash
curl -X GET http://localhost:3456/api/users/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🔄 Development Workflow

### How to Add a New Feature

Follow this step-by-step workflow when implementing a new feature:

#### 1. **Database Schema**

   Add the table or column to `db/schema.sql`. It is the source of truth for the
   schema and is written with `CREATE TABLE IF NOT EXISTS`, so it can be re-run.

   Apply it locally with:

   ```bash
   npm run migrate db/schema.sql
   ```

   On AWS the database has no public endpoint, so the same file is applied from
   inside a running Fargate task via `aws ecs execute-command` — see
   [../infra/README.md](../infra/README.md), "Load the schema". Because the file
   ships inside the container image, a schema change means rebuilding and pushing
   the image before it takes effect.

#### 2. **Model** (`models/`)
   
   Create a model file to handle database operations:
   
   ```javascript
   // models/Review.js
   const sql = require("../db");
   
   /**
    * Get all reviews for a product
    */
   async function getReviewsByProduct(productId) {
     return await sql`
       SELECT r.*, u.username, u.avatar_url
       FROM "Review" r
       LEFT JOIN "User" u ON r.user_id = u.user_id
       WHERE r.product_id = ${productId}
       ORDER BY r.created_at DESC
     `;
   }
   
   /**
    * Create a new review
    */
   async function createReview(reviewData) {
     const { userId, productId, rating, comment } = reviewData;
     
     const newReview = await sql`
       INSERT INTO "Review" (user_id, product_id, rating, comment)
       VALUES (${userId}, ${productId}, ${rating}, ${comment})
       RETURNING *
     `;
     
     return newReview[0];
   }
   
   // Export functions
   module.exports = {
     getReviewsByProduct,
     createReview,
     // ... other functions
   };
   ```

#### 3. **Controller** (`controllers/`)
   
   Implement business logic and request handling:
   
   ```javascript
   // controllers/reviewController.js
   const reviewModel = require('../models/Review');
   
   /**
    * @desc    Create new review
    * @route   POST /api/reviews
    * @access  Private
    */
   const createReview = async (req, res) => {
     try {
       const { userId, productId, rating, comment } = req.body;
       
       // Validation
       if (!userId || !productId || !rating) {
         return res.status(400).json({
           success: false,
           message: 'Please provide all required fields'
         });
       }
       
       // Create review
       const review = await reviewModel.createReview({
         userId,
         productId,
         rating,
         comment
       });
       
       res.status(201).json({
         success: true,
         message: 'Review created successfully',
         data: review
       });
     } catch (error) {
       console.error('Create review error:', error);
       res.status(500).json({
         success: false,
         message: 'Error creating review',
         error: error.message
       });
     }
   };
   
   /**
    * @desc    Get reviews for a product
    * @route   GET /api/reviews/product/:productId
    * @access  Public
    */
   const getProductReviews = async (req, res) => {
     try {
       const { productId } = req.params;
       
       const reviews = await reviewModel.getReviewsByProduct(productId);
       
       res.status(200).json({
         success: true,
         data: reviews
       });
     } catch (error) {
       console.error('Get reviews error:', error);
       res.status(500).json({
         success: false,
         message: 'Error fetching reviews',
         error: error.message
       });
     }
   };
   
   module.exports = {
     createReview,
     getProductReviews,
     // ... other functions
   };
   ```

#### 4. **Routes** (`routes/`)
   
   Define API endpoints:
   
   ```javascript
   // routes/reviewRoutes.js
   const express = require('express');
   const {
     createReview,
     getProductReviews,
     updateReview,
     deleteReview
   } = require('../controllers/reviewController');
   
   const router = express.Router();
   
   // Review CRUD routes
   router.post('/', createReview);
   router.get('/product/:productId', getProductReviews);
   router.put('/:id', updateReview);
   router.delete('/:id', deleteReview);
   
   module.exports = router;
   ```

#### 5. **Register Routes** (`index.js`)
   
   Add your routes to the main application:
   
   ```javascript
   // index.js
   const reviewRoutes = require("./routes/reviewRoutes");
   
   // ... other code ...
   
   // API Routes
   app.use("/api/reviews", reviewRoutes);
   ```

#### 6. **Update API Documentation** (`openapi.yaml`)
   
   Document your new endpoints:
   
   ```yaml
   /api/reviews:
     post:
       summary: Create new review
       tags: [Reviews]
       requestBody:
         required: true
         content:
           application/json:
             schema:
               type: object
               required:
                 - userId
                 - productId
                 - rating
               properties:
                 userId:
                   type: integer
                 productId:
                   type: integer
                 rating:
                   type: integer
                   minimum: 1
                   maximum: 5
                 comment:
                   type: string
   ```

#### 7. **Test Your Endpoints**
   
   Test using the Swagger UI at `http://localhost:3456/api-docs` or tools like:
   - Postman
   - cURL
   - Thunder Client (VS Code extension)
   
   Example cURL test:
   ```bash
   curl -X POST http://localhost:3456/api/reviews \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "userId": 1,
       "productId": 2,
       "rating": 5,
       "comment": "Great product!"
     }'
   ```