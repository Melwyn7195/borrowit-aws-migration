# BorrowIt - Online Renting Platform

BorrowIt is a modern web application built with React and Vite that allows users to rent products online. The platform supports multiple user roles including regular users, sellers, and administrators, providing a comprehensive renting experience with features like product listings, order management, reviews, and reporting.

## Features

- **User Authentication**: Login, signup, and password recovery
- **Product Management**: Browse, filter, and view product details
- **Shopping Cart**: Add products to cart and proceed to checkout
- **Order Management**: Place orders, track status, and manage schedules
- **Reviews and Ratings**: Leave and view product reviews
- **Seller Dashboard**: Manage products, view orders, and track sales
- **Admin Dashboard**: Oversee users, products, orders, and handle reports/violations
- **Responsive Design**: Optimized for desktop and mobile devices

## Tech Stack

- **Frontend**: React 19, React Router DOM
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React, React Icons
- **Linting**: ESLint
- **Development**: Hot Module Replacement (HMR)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Melwyn7195/borrowit-aws-migration.git
   cd borrowit-aws-migration/Renting-Online-Web-main
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the project for production
- `npm run lint` - Run ESLint for code linting
- `npm run preview` - Preview the production build locally

## Project Structure

```
src/
├── api/          # API client and service functions
├── assets/       # Static assets
├── components/   # Reusable UI components
├── data/         # Mock data (for development)
├── pages/        # Page components
├── utils/        # Utility functions
├── App.jsx       # Main app component
├── main.jsx      # Entry point
└── main.css      # Global styles
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is licensed under the MIT License.
