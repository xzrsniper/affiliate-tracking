import User from './User.js';
import Link from './Link.js';
import Click from './Click.js';
import Conversion from './Conversion.js';
import Website from './Website.js';
import PageContent from './PageContent.js';
import PageStructure from './PageStructure.js';
import TrackerVerification from './TrackerVerification.js';
import LinkClick from './LinkClick.js';

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

// Link -> LinkClicks (auto-event tracking on client site)
Link.hasMany(LinkClick, { foreignKey: 'link_id', as: 'linkClicks', onDelete: 'SET NULL' });
LinkClick.belongsTo(Link, { foreignKey: 'link_id', as: 'link' });

// User -> Websites (One-to-Many)
User.hasMany(Website, {
  foreignKey: 'user_id',
  as: 'websites',
  onDelete: 'CASCADE'
});
Website.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Export all models
export {
  User,
  Link,
  Click,
  Conversion,
  Website,
  PageContent,
  PageStructure,
  TrackerVerification,
  LinkClick
};

export default {
  User,
  Link,
  Click,
  Conversion,
  Website,
  PageContent,
  PageStructure,
  TrackerVerification,
  LinkClick
};
