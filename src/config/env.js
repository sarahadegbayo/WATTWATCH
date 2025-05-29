import { config } from 'dotenv';

const envPath = `.env.${process.env.NODE_ENV || 'development'}.local`;
//the config method loads the env file
config({ path: envPath });

console.log(envPath.toLowerCase());

export const
    {
        PORT,
        SERVER_URL,
        NODE_ENV,
        MONGODB_URI,
        JWT_SECRET,
        JWT_EXPIRES_IN,
    } = process.env;


