🔧 Environment Setup

This project uses environment variables to securely manage PostgreSQL database configuration. Follow the steps below to set up your local environment.

1. Create a .env file
At the root of your project, create a .env file and add the following variables:

env
Copy
Edit
DB_USER=your_db_username
DB_HOST=localhost
DB_NAME=your_database_name
DB_PASSWORD=your_db_password
DB_PORT=5432
Make sure to replace the placeholder values with your actual PostgreSQL credentials.


2. Install dependencies
Run the following command to install required Node.js packages:

bash
Copy
Edit
npm install dotenv pg
