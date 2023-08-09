import DataLoader from 'dataloader'
import { Database } from './database'

export class DataSource {
    private db: Database;
    
    constructor(db: Database) {
      this.db = db;
    }

    async getPlayers(firstName: string, lastName: string) {
        return this.db.getPlayers(firstName, lastName);
    }

    private batchProfiles = new DataLoader(async (idents: string[]) => {
        return await this.db.getProfiles(idents)
    });
    async getProfile(ident: string) {
        return this.batchProfiles.load(ident);
    }

    private batchStats = new DataLoader(async (idents: string[]) => {
        return await this.db.getStats(idents)
    });
    async getStats(ident: string) {
        return this.batchStats.load(ident);
    }

    getLineup(lineupId: number) {
        return this.db.getLineup(lineupId);
    }

    createLineup() {
        return this.db.createLineup();
    }

    updateLineup(lineupId: number, args) {
        return this.db.updateLineup(lineupId, args);
    }
}
