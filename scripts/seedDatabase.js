require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Database = require('../models/databaseModel');

const seedRecords = () => {
  const divisions = ['North', 'South', 'East', 'West', 'Central'];
  const typologies = ['Villa', 'Apartment', 'Plot', 'Office', 'Shop'];
  const sectors = ['A', 'B', 'C', 'D', 'E'];
  const constructionTypes = ['Under Construction', 'Ready To Move'];
  const types = ['Residential', 'Commercial'];
  const sizes = ['750 sq ft', '950 sq ft', '1200 sq ft', '1500 sq ft', '1800 sq ft'];
  const prices = ['25 Lacs', '35 Lacs', '50 Lacs', '75 Lacs', '1.2 Cr'];

  return Array.from({ length: 200 }, (_, index) => {
    const projectIndex = index + 1;
    const typology = typologies[index % typologies.length];
    const sector = sectors[index % sectors.length];
    const constructionType = constructionTypes[index % constructionTypes.length];
    const type = types[index % types.length];
    const size = sizes[index % sizes.length];
    const price = prices[index % prices.length];

    return {
      projectName: `Project ${projectIndex} ${typology}`,
      divisionName: `${divisions[index % divisions.length]} Division`,
      typology,
      sector,
      price,
      size,
      pdfLink: `https://example.com/project-${projectIndex}.pdf`,
      remarks: `Sample record ${projectIndex} for seed data`,
      type,
      constructionType,
      createdBy: new mongoose.Types.ObjectId(),
    };
  });
};

const seedDatabase = async () => {
  try {
    await connectDB();

    const records = seedRecords();
    await Database.insertMany(records);

    console.log(`✅ Seeded ${records.length} records into the Database collection.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed database:', error);
    process.exit(1);
  }
};

seedDatabase();
