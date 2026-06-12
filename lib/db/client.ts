import { Pool } from 'pg';
import { Signer } from '@aws-sdk/rds-signer';

const signer = new Signer({
  hostname: process.env.PGHOST || '',
  port: parseInt(process.env.PGPORT || '5432'),
  username: process.env.PGUSER || '',
  region: process.env.AWS_REGION || 'us-east-1',
});

const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: async () => await signer.getAuthToken(),
  ssl: { rejectUnauthorized: false },
  max: 10,
});

export default pool;