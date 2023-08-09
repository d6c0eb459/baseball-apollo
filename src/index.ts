/**
 * Main server.
 */
import path from 'path';
import { fileURLToPath } from 'url';

import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers.js";
import { connect, Database } from './database.js';
import { DataSource } from './datasource.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db: Database = await connect(path.join(__dirname, "..", "database.sqlite"));

export interface ContextValue {
    dataSources: {
        ds: DataSource;
    };
}

export const server = new ApolloServer<ContextValue>({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
    context: async () => {
        return {
            dataSources: {
                ds: new DataSource(db),
            }
        };
    },
});

console.log(`Now serving at: ${url}`);
