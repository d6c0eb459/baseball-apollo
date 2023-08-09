/**
 * GraphQL oriented wrappers.
 */

import DataLoader from 'dataloader'
import { Database, PlayerProfile, PlayerStats, Lineup } from './database.js'

/**
 * A GraphQL oriented wrapper around a database.
 */
export class DataSource {
    private db: Database;
    
    constructor(db: Database) {
      this.db = db;
    }

    async getPlayers(firstName: string, lastName: string): Promise<number[]>  {
        return this.db.getPlayers(firstName, lastName);
    }

    private batchProfiles = new DataLoader(async (idents: readonly string[]) => {
        return await this.db.getProfiles(idents)
    });

    async getProfile(ident: string): Promise<PlayerProfile> {
        return this.batchProfiles.load(ident);
    }

    private batchStats = new DataLoader(async (idents: readonly string[]) => {
        return await this.db.getStats(idents)
    });

    async getStats(ident: string) {
        return this.batchStats.load(ident);
    }

    async getLineup(lineupId: number): Promise<Lineup> {
        return await this.db.getLineup(lineupId);
    }

    async createLineup(): Promise<Lineup> {
        return await this.db.createLineup();
    }

    async updateLineup(lineupId: number, assignments: Lineup): Promise<Lineup> {
        return await this.db.updateLineup(lineupId, assignments);
    }
}
