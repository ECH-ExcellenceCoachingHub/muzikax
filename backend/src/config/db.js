"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();

// Add this to db.js to prevent multiple connections
let cachedDb = null;

const connectDB = async () => {
  // Check if we already have a connection
  if (cachedDb && cachedDb.connections && cachedDb.connections.length > 0) {
    console.log('Using existing database connection');
    return cachedDb;
  }
  
  // Check if mongoose is already connected
  if (mongoose_1.default.connection.readyState === 1) {
    console.log('MongoDB already connected, using existing connection');
    cachedDb = mongoose_1.default.connection;
    return cachedDb;
  }
  
  try {
    const conn = await mongoose_1.default.connect(process.env['MONGO_URI'] || 'mongodb://localhost:27017/muzikax', {
      // Updated options for Mongoose 6+
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000, // Atlas can take >5s to select a primary on slower networks
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferCommands: false,  // Disable mongoose buffering
      // Ensure connection is ready before returning
      autoCreate: true,
      autoIndex: true
    });
    
    // Wait for connection to be fully ready
    await new Promise((resolve) => {
      if (mongoose_1.default.connection.readyState === 1) {
        resolve(true);
      } else {
        mongoose_1.default.connection.once('open', resolve);
      }
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    cachedDb = conn;
    return conn;
  }
  catch (error) {
    console.error(`Error: ${error.message}`);
    throw error; // Don't exit process in serverless
  }
};
module.exports = connectDB;
//# sourceMappingURL=db.js.map