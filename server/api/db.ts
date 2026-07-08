import 'dotenv/config';
import { drizzle } from "drizzle-orm/mysql2";
import { relations } from '../db/schema';
import * as mysql from 'mysql2'

const connectionPool = mysql.createPool({
    uri: process.env.DATABASE_URL!,
    supportBigNumbers: true,
    isServer: false,
})
export const db = drizzle({
    client: connectionPool,
    relations: relations
});