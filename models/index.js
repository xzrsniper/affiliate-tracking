import User from './User.js';
import Link from './Link.js';
import Click from './Click.js';
import Conversion from './Conversion.js';

// Define Associations

// User -> Links (One-to-Many)
User.hasMany(Link, {
  foreignKey: 'user_id',
  as: 'links',
  onDelete: 'CASCADE'
});
Link.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Link -> Clicks (One-to-Many)
Link.hasMany(Click, {
  foreignKey: 'link_id',
  as: 'clicks',
  onDelete: 'CASCADE'
});
Click.belongsTo(Link, {
  foreignKey: 'link_id',
  as: 'link'
});

// Link -> Conversions (One-to-Many)
Link.hasMany(Conversion, {
  foreignKey: 'link_id',
  as: 'conversions',
  onDelete: 'CASCADE'
});
Conversion.belongsTo(Link, {
  foreignKey: 'link_id',
  as: 'link'
});

// Export all models
export {
  User,
  Link,
  Click,
  Conversion
};

export default {
  User,
  Link,
  Click,
  Conversion
};
