/**
 * A wrapper around an SQLite database.
 */
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

/**
 * Represents a single player.
 */
export interface PlayerProfile {
    ident: string;
    name: string;
    country: string;
    year: number;
}

/**
 * Represents stats for a player or group of players.
 */
export interface PlayerStats {
    atBats: number;
    hits: number;
    homeRuns: number;
    strikeouts: number;
    battingAverage: number;
    slugging: number;
}

/**
 * Represents a team of players.
 */
export interface Lineup {
    lineupId?: number;
    pitcher?: number;
    catcher?: number;
    firstBase?: number;
    secondBase?: number;
    thirdBase?: number;
    shortstop?: number;
    leftField?: number;
    centerField?: number;
    rightField?: number;
}
 
const KNOWN_POSITIONS = new Set([
    "pitcher",
    "catcher",
    "firstBase",
    "secondBase",
    "thirdBase",
    "shortstop",
    "leftField",
    "centerField",
    "rightField",
]);

type GenericMapping = { [key: string]: any };

/**
 * Creates a connection to the database.
 *
 * @param path  A valid path or the special string ":memory:" for a temporary database.
 * @param setup An optional function to call after the connection has been made.
 */
export async function connect(path: string, setup?: (db: any) => void) {
    const db = await open({
        filename: path,
        driver: sqlite3.Database
    });
    
    await db.exec(`
        CREATE TABLE IF NOT EXISTS "People" (
        	"playerID" TEXT UNIQUE,
        	"nameFirst" TEXT,
        	"nameLast" TEXT,
        	"birthYear" INTEGER,
        	"birthCountry" TEXT
        );
    `);
    
    await db.exec(`
        CREATE TABLE IF NOT EXISTS "Batting" (
        	"playerID" TEXT,
            "AB" INTEGER,
            "_2B" INTEGER,
            "_3B" INTEGER,
            "HR" INTEGER,
            "H" INTEGER,
            "SO" INTEGER
        );
    `);
    
    await db.exec(`
        CREATE TABLE IF NOT EXISTS "Lineups" (
        	"lineupId" INTEGER PRIMARY KEY AUTOINCREMENT
        );
    `);
    
    await db.exec(`
        CREATE TABLE IF NOT EXISTS "LineupAssignments" (
        	"lineupId" INTEGER,
            "position" TEXT,
            "playerId" TEXT,
            UNIQUE("lineupId", "position"),
            UNIQUE("lineupId", "playerId")
        );
    `);

    if(setup != undefined) {
        await setup(db);
    }
    
    return new Database(db);
}

/**
 * A wrapper around a baseball database.
 */
export class Database {
    private db;
    
    constructor(db: any) {
      this.db = db;
    }

    /**
     * Fetch players with matching names.
     * 
     * @param firstName The desired first name or a prefix of it.
     * @param lastName  The desired last name or a prefix of it.
     *
     * @returns A list of player identifiers.
     */
    async getPlayers(firstName: string, lastName: string) : Promise<number[]> {
        const result: GenericMapping[] = await this.db.all(`
            SELECT
            playerId
            FROM People
            WHERE nameFirst LIKE ? and namelast LIKE ?
            ORDER BY nameFirst,namelast
        `, [`${firstName}%`, `${lastName}%`]);
    
        return result.map((row: GenericMapping) => row["playerID"]);
    }
    
    /**
     * Fetch players profiles.
     * 
     * @param idents A list of player identifiers.
     */
    async getProfiles(idents: readonly string[]) : Promise<PlayerProfile[]> {
        const placeholders = (new Array(idents.length).fill("?")).join(",");
        const result = await this.db.all(`
            SELECT
            playerId,nameFirst,namelast,birthCountry,birthYear
            FROM People
            WHERE playerId IN (${placeholders})
        `, idents);
    
        const mapping: GenericMapping = {};
        for(const row of result) {
            const playerId = row["playerID"];
            mapping[playerId] = {
                name: `${row["nameFirst"]} ${row["nameLast"]}`,
                country: row["birthCountry"],
                year: row["birthYear"],
            }
        }
    
        return idents.map((i) => {
            if(mapping[i] !== undefined) {
                return mapping[i];
            } else {
                return null;
            }
        });
    }

    /**
     * Fetch summary statistics over a player's entire career.
     * 
     * @param idents A list of player identifiers.
     */
    async getStats(idents: readonly string[]) : Promise<PlayerStats[]> {
        const placeholders = (new Array(idents.length).fill("?")).join(",");
        const result = await this.db.all(`
            SELECT
                playerId,
                SUM(AB) AS AB,
                SUM(_2B) AS _2B,
                SUM(_3B) AS _3B,
                SUM(HR) AS HR,
                SUM(H) AS H,
                SUM(SO) AS SO
            FROM Batting
            WHERE playerId IN (${placeholders})
            GROUP BY playerId
        `, idents);
    
        const mapping: GenericMapping = {};
        for(const row of result) {
            const playerId = row["playerID"];
    
            const hits = row["H"];
            const atBats = row["AB"];
            const doubles = row["_2B"];
            const triples = row["_3B"];
            const homeRuns = row["HR"];
            const strikeouts = row["SO"];
    
            const battingAverage = hits / atBats;
            const singles = hits - doubles - triples - homeRuns;
            const slugging = (singles + (2 * doubles) + (3 * triples) + (4 * homeRuns)) / atBats;
    
            mapping[playerId] = {
                atBats: atBats,
                hits: hits,
                homeRuns: homeRuns,
                strikeouts: strikeouts,
                battingAverage: battingAverage,
                slugging: slugging,
            }
        }
    
        return idents.map((i) => {
            if(mapping[i] !== undefined) {
                return mapping[i];
            } else {
                return null;
            }
        });
    }

    /**
     * Fetch a mapping between player and position
     * 
     * @param lineupId A lineup identifier.
     */
    async getLineup(lineupId: number) : Promise<Lineup> {
        const assignments = await this.db.all(`
            SELECT position,playerId
            FROM Lineups
            INNER JOIN LineupAssignments
            ON Lineups.lineupId = LineupAssignments.lineupId
            WHERE Lineups.lineupId=?
        `, [lineupId]);

        const result: any = { "lineupId": lineupId };
        for(const position of KNOWN_POSITIONS) {
            result[position] = null;
        }

        for(const assignment of assignments) {
            const position = assignment["position"]
            if(KNOWN_POSITIONS.has(position)) {
                if(assignment["playerId"] != null) {
                    result[position] = { playerId: assignment["playerId"] };
                }
            }
        }

        return result;
    }

    /**
     * Create a new lineup.
     */
    async createLineup() : Promise<Lineup> {
        const result: GenericMapping = await this.db.run("INSERT INTO Lineups VALUES(null)");
        const lineupId = result["lastID"];
        return this.getLineup(lineupId);
    }

    /**
     * Update a lineup by assigning players to positions.
     *
     * @param lineupId      A lineup identifier.
     * @param assignments   A mapping from known positions to player identifiers.
     */
    async updateLineup(lineupId: number, assignments: any) : Promise<Lineup> {
        const data = [];
        for(const position of KNOWN_POSITIONS) {
            if(assignments[position] !== undefined) {
                const query = assignments[position];

                // interpret as id
                const playerId = query; 

                // interpret as name
                const parts = query.split(" ")

                let firstName = "";
                let lastName = "";
                if(parts.length == 1) {
                    firstName = query + "%";
                    lastName = "%";
                } else if(parts.length == 2) {
                    firstName = parts[0] + "%";
                    lastName = parts[1] + "%";
                }

                data.push([lineupId, position, playerId, firstName, lastName]);
            }
        }

        await Promise.all(data.map((row) => {
            return this.db.run(`
                INSERT OR REPLACE INTO LineupAssignments
                VALUES(
                    ?,
                    ?,
                    (
                        SELECT playerId
                        FROM People
                        WHERE playerId=?
                            OR (
                                namefirst LIKE ?
                                AND namelast LIKE ?
                            )
                        LIMIT 1
                    )
                )
            `, row);
        }));

        return this.getLineup(lineupId);
    }
    
}
