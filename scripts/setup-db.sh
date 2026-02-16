#!/bin/bash

echo "🔧 Setting up Affiliate Tracking Database"
echo ""

# Check if MySQL is running
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed or not in PATH"
    exit 1
fi

echo "📝 Please enter your MySQL root password:"
read -s MYSQL_PASSWORD

# Try to connect and create database
mysql -u root -p"$MYSQL_PASSWORD" <<EOF
CREATE DATABASE IF NOT EXISTS affiliate_tracking;
SHOW DATABASES LIKE 'affiliate_tracking';
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database 'affiliate_tracking' created successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Make sure your .env file has correct DB credentials"
    echo "   2. Run: npm run db:init"
    echo "   3. Create admin: npm run create-admin <email> <password>"
else
    echo ""
    echo "❌ Failed to create database. Please check your MySQL credentials."
    exit 1
fi
